<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function show(Request $request, \App\Models\Account $account)
    {
        $user = $request->user();

        // Authorization: Ensure user owns the account or is admin
        if ($account->user_id !== $user->id && !$user->is_admin) {
            abort(403);
        }

        $account->load(['balances', 'user']);

        // Fetch exchange rates for USD equivalent
        // We need rates relative to USD.
        // The ExchangeRate model stores pairs canonically.
        // We get all pairs involving USD.
        $exchangeRates = \App\Models\ExchangeRate::where('to_currency', 'USD')
            ->orWhere('from_currency', 'USD')
            ->get()
            ->mapWithKeys(function ($rate) {
                if ($rate->to_currency === 'USD') {
                    // Pair is COIN/USD. Rate is Price of COIN in USD.
                    return [$rate->from_currency => (float) $rate->rate];
                } else {
                    // Pair is USD/COIN. Rate is Price of USD in COIN.
                    // We want Price of COIN in USD = 1 / Rate.
                    return [$rate->to_currency => 1 / (float) $rate->rate];
                }
            });
        
        // Add USD itself
        $exchangeRates['USD'] = 1.0;

        $feeSetting = \App\Models\SystemSetting::where('key', 'crypto_conversion_fee_percent')->first();
        $feePercent = $feeSetting ? (float)$feeSetting->value : 1.0;

        $transactions = \App\Models\Transaction::where('from_account_id', $account->id)
            ->orWhere('to_account_id', $account->id)
            ->latest()
            ->take(10)
            ->get();

// Load Crypto Account for Fiat View (for conversion purposes)
$cryptoAccount = null;
if ($account->account_type === 'fiat') {
$cryptoAccount = $user->cryptoAccount()->with('balances')->first();
}
$recipientAccounts = \App\Models\Account::where('account_type', 'fiat')
        ->where('id', '!=', $account->id)
        ->with('user:id,name')
        ->get(['id', 'account_number', 'user_id']);

        return \Inertia\Inertia::render('AccountDetails', [
            'account' => $account,
'cryptoAccount' => $cryptoAccount,
            'rates' => $exchangeRates,
            'cryptoConversionFeePercent' => $feePercent,
            'transactions' => $transactions,
'recipientAccounts' => $recipientAccounts,
        ]);
    }

    public function showCryptoDetail(Request $request, \App\Models\Account $account, string $currency)
    {
        $user = $request->user();
        if ($account->user_id !== $user->id && !$user->is_admin) {
            abort(403);
        }

        $account->load('user');

        $walletType = $request->query('wallet');

        $query = $account->balances()->where('currency', $currency);
        
if ($walletType) {
$w = strtolower($walletType);
$types = [$w];

// Handle specific aliases and casing
if ($w === 'earn' || $w === 'earning') {
$types = ['earn', 'Earn', 'earning', 'Earning'];
} elseif ($w === 'spot') {
$types = ['spot', 'Spot'];
} elseif ($w === 'funding') {
$types = ['funding', 'Funding'];
} else {
$types[] = ucfirst($w);
}
$query->whereIn('wallet_type', array_unique($types));
        }

        $balances = $query->get();

        $rateToUsd = 0;
        if ($currency === 'USD') {
            $rateToUsd = 1.0;
        } else {
             $rateModel = \App\Models\ExchangeRate::where(function($q) use ($currency) {
                 $q->where('from_currency', $currency)->where('to_currency', 'USD');
             })->orWhere(function($q) use ($currency) {
                 $q->where('from_currency', 'USD')->where('to_currency', $currency);
             })->first();

             if ($rateModel) {
                 $rateToUsd = $rateModel->to_currency === 'USD' ? (float)$rateModel->rate : 1 / (float)$rateModel->rate;
             }
        }

        // Fetch Trading Pairs (Rates involving this currency)
        // Exclude Fiat pairs (USD, EUR) as trading happens in Spot wallet with Stablecoins/Crypto
        // Return standard pair keys (Base/Quote)
        $allowedCurrencies = ['BTC', 'ETH', 'USDT', 'BNB', 'USDC'];
        
        $tradingPairs = \App\Models\ExchangeRate::where(function ($q) use ($currency) {
                $q->where('from_currency', $currency)
                  ->orWhere('to_currency', $currency);
            })
            ->whereIn('from_currency', $allowedCurrencies)
            ->whereIn('to_currency', $allowedCurrencies)
            ->get()
            ->map(function ($rateModel) use ($currency) {
                // Determine if we need to invert the pair to ensure Other/Current format
                // We want the 'to' currency to be the current page currency ($currency)
                $isMatchingTarget = $rateModel->to_currency === $currency;

                if ($isMatchingTarget) {
                    // Already in Other -> Current format
                    return [
                        'id' => $rateModel->id,
                        'from' => $rateModel->from_currency,
                        'to' => $rateModel->to_currency,
                        'rate' => (float)$rateModel->rate,
                    ];
                } else {
                    // In Current -> Other format. Invert to Other -> Current
                    return [
                        'id' => $rateModel->id,
                        'from' => $rateModel->to_currency,
                        'to' => $rateModel->from_currency,
                        'rate' => 1 / (float)$rateModel->rate, // Invert rate
                    ];
                }
            })
            ->filter(fn($p) => $p['rate'] > 0)
            ->values();

        // Fetch all spot balances for trading validations
$spotBalances = $account->balances()->whereIn('wallet_type', ['Spot', 'spot'])->get();
        
        // Fetch all balances for this currency (for Transfer modal)
        $allCurrencyBalances = $account->balances()->where('currency', $currency)->get();

// Fetch Funding Fiat Balances (USD/EUR) for Withdraw Funding
// Handle case sensitivity for wallet_type (Funding vs funding) and filter by available balance
$fundingFiatBalances = \App\Models\AccountBalance::where('account_id', $account->id)
->where(function($q) {
$q->where('wallet_type', 'funding')->orWhere('wallet_type', 'Funding');
})
->whereIn('currency', ['USD', 'EUR'])
->where('balance_type', 'available')
->pluck('balance', 'currency')
->toArray();
        // Fetch Trading Fee
        $tradingFeePercent = (float)(\App\Models\SystemSetting::where('key', 'trading_fee_percent')->value('value') ?? 0.1);

        // Fetch recent transactions for this currency
        $transactions = \App\Models\Transaction::where(function($q) use ($account) {
                $q->where('from_account_id', $account->id)
                  ->orWhere('to_account_id', $account->id);
            })
            ->where(function($q) use ($currency) {
                $q->where('from_currency', $currency)
                  ->orWhere('to_currency', $currency);
            })
->where(function ($q) use ($walletType) {
// Default to Spot if not specified
$targetWallet = 'Spot';
if ($walletType) {
$w = strtolower($walletType);
if (str_contains($w, 'fund')) $targetWallet = 'Funding';
elseif (str_contains($w, 'earn')) $targetWallet = 'Earn';
}

if ($targetWallet === 'Spot') {
$q->whereIn('type', ['Buy Crypto', 'Sell Crypto', 'Convert Crypto'])
->orWhere('description', 'LIKE', '%[Spot%')
->orWhere('description', 'LIKE', '%->Spot]%');
} elseif ($targetWallet === 'Funding') {
$q->whereIn('type', ['Deposit to Funding', 'Withdraw from Funding'])
->orWhere('description', 'LIKE', '%Funding Wallet%')
->orWhere('description', 'LIKE', '%[Funding%')
->orWhere('description', 'LIKE', '%->Funding]%');
} elseif ($targetWallet === 'Earn') {
$q->where('description', 'LIKE', '%[Earn%')
->orWhere('description', 'LIKE', '%->Earn]%');
}
})
            ->orderBy('created_at', 'desc')
            ->paginate(5)
            ->withQueryString();

        return \Inertia\Inertia::render('CryptoDetail', [
            'account' => $account,
            'currency' => $currency,
            'balances' => $balances,
            'spotBalances' => $spotBalances,
            'allCurrencyBalances' => $allCurrencyBalances,
            'rateToUsd' => $rateToUsd,
            'walletType' => $walletType,
            'tradingPairs' => $tradingPairs,
            'tradingFeePercent' => $tradingFeePercent,
            'transactions' => $transactions,
            'fiatBalances' => $user->fiatAccount 
                ? $user->fiatAccount->balances
                    ->where('wallet_type', 'fiat')
                    ->where('balance_type', 'available')
                    ->mapWithKeys(fn($b) => [$b->currency => $b->balance]) 
                : [],
'fundingFiatBalances' => $fundingFiatBalances,
]);
}

public function showEarnPage(Request $request, \App\Models\Account $account, string $currency)
{
$user = $request->user();
if ($account->user_id !== $user->id && !$user->is_admin) {
abort(403);
}

$account->load('user');

$messageSetting = \App\Models\SystemSetting::where('key', 'earning_page_message')->first();
$message = $messageSetting ? $messageSetting->value : 'Earn functionality is currently under maintenance. Please check
back later.';

return \Inertia\Inertia::render('EarnPage', [
'account' => $account,
'currency' => $currency,
'message' => $message,
]);
}

public function showRedeemPage(Request $request, \App\Models\Account $account, string $currency)
{
$user = $request->user();
if ($account->user_id !== $user->id && !$user->is_admin) {
abort(403);
}

$account->load('user');

$messageSetting = \App\Models\SystemSetting::where('key', 'redeem_page_message')->first();
$message = $messageSetting ? $messageSetting->value : 'Redeem functionality is currently under maintenance. Please check
back later.';

return \Inertia\Inertia::render('RedeemPage', [
'account' => $account,
'currency' => $currency,
'message' => $message,
]);
}
    public function depositFiatToFunding(Request $request, \App\Models\Account $account)
    {
        $user = $request->user();
        if ($account->user_id !== $user->id && !$user->is_admin) {
            abort(403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'currency' => 'required|in:USD,EUR',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $account, $user) {
            $amount = (float) $validated['amount'];
            $currency = $validated['currency'];

            $fiatAccount = $user->fiatAccount;
            if (!$fiatAccount) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                     'amount' => ["No Fiat Account found."],
                 ]);
            }

            // Lock and check Fiat Balance
            $fiatBalance = $fiatAccount->balances()
                ->where('wallet_type', 'fiat')
                ->where('currency', $currency)
                ->where('balance_type', 'available') // Explicitly use available balance
                ->lockForUpdate()
                ->first();

            if (!$fiatBalance || $fiatBalance->balance < $amount) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                     'amount' => ["Insufficient {$currency} available balance in Fiat Account."],
                 ]);
            }

// Deduct from Fiat Available
            $fiatBalance->decrement('balance', $amount);
            
// Add to Fiat Locked (Holding for approval)
            $fiatLocked = $fiatAccount->balances()->firstOrCreate(
            ['wallet_type' => 'fiat', 'currency' => $currency, 'balance_type' => 'locked'],
            ['balance' => 0]
            );
$fiatLocked->increment('balance', $amount);

// Record Transaction (Pending)
            \App\Models\Transaction::create([
                 'from_account_id' => $fiatAccount->id,
                 'to_account_id' => $account->id,
                 'type' => 'Deposit to Funding',
                 'from_currency' => $currency,
                 'to_currency' => $currency,
                 'amount' => $amount,
'converted_amount' => $amount,
                'status' => 'pending',
                 'description' => "Deposit {$amount} {$currency} from Fiat Account to Funding Wallet",
                 'created_by' => $user->id,
'reference_number' => 'DEP-' . strtoupper(uniqid()),
            ]);

return redirect()->back();
        });
    }

    public function buyCrypto(Request $request, \App\Models\Account $account)
    {
        $user = $request->user();
        if ($account->user_id !== $user->id && !$user->is_admin) {
            abort(403);
        }

        $validated = $request->validate([
            'pair_id' => 'required|exists:exchange_rates,id',
            'amount' => 'required|numeric|min:0.00000001',
            'spending_currency' => 'required|string',
            'receiving_currency' => 'required|string',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $account) {
             $pair = \App\Models\ExchangeRate::findOrFail($validated['pair_id']);
             $amount = (float) $validated['amount'];
             $spendingCurrency = $validated['spending_currency'];
             $receivingCurrency = $validated['receiving_currency'];

             // 1. Calculate Raw Receive Amount
             // If spending Quote (to_currency) -> Divide by Rate
             // If spending Base (from_currency) -> Multiply by Rate
             $rawReceiveAmount = 0;
             if ($spendingCurrency === $pair->to_currency) {
                 $rawReceiveAmount = $amount / (float)$pair->rate;
             } elseif ($spendingCurrency === $pair->from_currency) {
                 $rawReceiveAmount = $amount * (float)$pair->rate;
             } else {
                 throw new \Exception('Invalid pair for this currency');
             }

             // 2. Calculate Fee
             $feePercent = (float)(\App\Models\SystemSetting::where('key', 'trading_fee_percent')->value('value') ?? 0.1);
             $feeAmount = $rawReceiveAmount * ($feePercent / 100);
             $netReceiveAmount = $rawReceiveAmount - $feeAmount;

// 3. Check & Deduct Balance (Available)
             $spendBalance = $account->balances()
                 ->where('wallet_type', 'Spot')
                 ->where('currency', $spendingCurrency)
->where('balance_type', 'available') // Specific check
->lockForUpdate()
                 ->first();

// Fallback for legacy records without explicit balance_type if needed,
// but best to be strict now that we introduce locking.
if (!$spendBalance) {
// Try finding one without balance_type specifier if default is used
$spendBalance = $account->balances()
->where('wallet_type', 'Spot')
->where('currency', $spendingCurrency)
->first();
}
             if (!$spendBalance || $spendBalance->balance < $amount) {
                 throw \Illuminate\Validation\ValidationException::withMessages([
                     'amount' => ["Insufficient {$spendingCurrency} balance in Spot Wallet."],
                 ]);
             }

// 1. Deduct from Available
             $spendBalance->decrement('balance', $amount);

// 2. Add to Locked
$lockedBalance = $account->balances()->firstOrCreate(
['wallet_type' => 'Spot', 'currency' => $spendingCurrency, 'balance_type' => 'locked'],
['balance' => 0]
);
$lockedBalance->increment('balance', $amount);
// 3. Create Pending Transaction
             \App\Models\Transaction::create([
                 'from_account_id' => $account->id,
                 'to_account_id' => $account->id,
                 'type' => 'Buy Crypto',
'from_currency' => $spendingCurrency, // Spending USDT
'to_currency' => $receivingCurrency, // Buying BTC
'amount' => $amount, // Spent Amount
'exchange_rate' => $rawReceiveAmount > 0 ? ($amount / $rawReceiveAmount) : 0,
'converted_amount' => $netReceiveAmount, // To be received
'status' => 'pending',
'description' => "Buy Crypto Request: {$amount} {$spendingCurrency} -> {$netReceiveAmount} {$receivingCurrency} (Fee:
{$feePercent}%)",
                 'reference_number' => 'TRD-' . strtoupper(uniqid()),
                 'created_by' => $account->user_id,
]);
        });
return back();
    }

    public function sellCrypto(Request $request, \App\Models\Account $account)
    {
        $user = $request->user();
        if ($account->user_id !== $user->id && !$user->is_admin) {
            abort(403);
        }

        $validated = $request->validate([
            'pair_id' => 'required|exists:exchange_rates,id',
            'amount' => 'required|numeric|min:0.00000001',
            'spending_currency' => 'required|string',
            'receiving_currency' => 'required|string',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $account) {
             $pair = \App\Models\ExchangeRate::findOrFail($validated['pair_id']);
             $amount = (float) $validated['amount'];
             $spendingCurrency = $validated['spending_currency'];
             $receivingCurrency = $validated['receiving_currency'];

             // 1. Calculate Raw Receive Amount
             // If spending Quote (to_currency) -> Divide by Rate
             // If spending Base (from_currency) -> Multiply by Rate
             $rawReceiveAmount = 0;
             if ($spendingCurrency === $pair->to_currency) {
                 $rawReceiveAmount = $amount / (float)$pair->rate;
             } elseif ($spendingCurrency === $pair->from_currency) {
                 $rawReceiveAmount = $amount * (float)$pair->rate;
             } else {
                 throw new \Exception('Invalid pair for this currency');
             }

             // 2. Calculate Fee
             $feePercent = (float)(\App\Models\SystemSetting::where('key', 'trading_fee_percent')->value('value') ?? 0.1);
             $feeAmount = $rawReceiveAmount * ($feePercent / 100);
             $netReceiveAmount = $rawReceiveAmount - $feeAmount;

             // 3. Check & Deduct Balance
             $spendBalance = $account->balances()
                 ->where('wallet_type', 'Spot')
                 ->where('currency', $spendingCurrency)
->where('balance_type', 'available')
                 ->lockForUpdate() // Lock row
                 ->first();

             if (!$spendBalance || $spendBalance->balance < $amount) {
                 throw \Illuminate\Validation\ValidationException::withMessages([
                     'amount' => ["Insufficient {$spendingCurrency} balance in Spot Wallet."],
                 ]);
             }

// Deduct from Available
             $spendBalance->decrement('balance', $amount);

// Add to Locked
$lockedBalance = $account->balances()->firstOrCreate(
['wallet_type' => 'Spot', 'currency' => $spendingCurrency, 'balance_type' => 'locked'],
['balance' => 0]
);
$lockedBalance->increment('balance', $amount);
// 4. Create Transaction Record (Pending)
             \App\Models\Transaction::create([
                 'from_account_id' => $account->id,
                 'to_account_id' => $account->id,
                 'type' => 'Sell Crypto',
                 'from_currency' => $spendingCurrency,
                 'to_currency' => $receivingCurrency,
                 'amount' => $amount,
                 'exchange_rate' => $rawReceiveAmount > 0 ? ($amount / $rawReceiveAmount) : 0, // Effective Rate
                 'converted_amount' => $netReceiveAmount,
'status' => 'pending',
'description' => "Sell Crypto Request: {$amount} {$spendingCurrency} -> {$netReceiveAmount} {$receivingCurrency} (Fee:
{$feePercent}%)",
                 'reference_number' => 'TRD-' . strtoupper(uniqid()),
                 'created_by' => $account->user_id,
             ]);

return redirect()->back();
        });
    }

    public function transferCrypto(Request $request, \App\Models\Account $account)
    {
        $user = $request->user();
        if ($account->user_id !== $user->id && !$user->is_admin) {
            abort(403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.00000001',
            'from_wallet' => 'required|string|in:Spot,Funding,Earn',
            'to_wallet' => 'required|string|in:Spot,Funding,Earn|different:from_wallet',
            'currency' => 'required|string',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $account) {
            $amount = (float) $validated['amount'];
            $fromWallet = $validated['from_wallet'];
$toWallet = $validated['to_wallet']; // used for description
            $currency = $validated['currency'];

// 1. Get Source Balance (Available) and Lock
            $sourceBalance = $account->balances()
                ->where('wallet_type', $fromWallet)
                ->where('currency', $currency)
->where('balance_type', 'available')
                ->lockForUpdate()
                ->first();

            if (!$sourceBalance || $sourceBalance->balance < $amount) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'amount' => ["Insufficient balance in {$fromWallet} Wallet."],
                ]);
            }

// 2. Decrement Source Available
            $sourceBalance->decrement('balance', $amount);

// 3. Move to Source Locked
$lockedBalance = $account->balances()->firstOrCreate(
['wallet_type' => $fromWallet, 'currency' => $currency, 'balance_type' => 'locked'],
['balance' => 0]
            );
$lockedBalance->increment('balance', $amount);

// 4. Create Transaction Record (Pending)
// Storing destination wallet in description for Admin parsing
// Format: "Transfer [Spot->Funding]..."
$desc = "Transfer [{$fromWallet}->{$toWallet}]: {$amount} {$currency}";

            \App\Models\Transaction::create([
                'from_account_id' => $account->id,
                'to_account_id' => $account->id,
                'type' => 'Transfer',
                'from_currency' => $currency,
                'to_currency' => $currency,
                'amount' => $amount,
'converted_amount' => $amount,
                'exchange_rate' => 1.0,
'status' => 'pending', // Requires Admin Approval
'description' => $desc,
                'reference_number' => 'TRF-' . strtoupper(uniqid()),
                'created_by' => $account->user_id,
            ]);

return redirect()->back();
        });
    }

    public function convertFiat(Request $request, \App\Models\Account $account)
    {
        $request->validate([
            'from_currency' => 'required|in:USD,EUR',
            'to_currency' => 'required|in:USD,EUR|different:from_currency',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $user = $request->user();
        if ($account->user_id !== $user->id) {
            abort(403);
        }

        if ($account->account_type !== 'fiat') {
            return back()->withErrors(['error' => 'Conversion only available for fiat accounts.']);
        }

        $fromCurrency = $request->from_currency;
        $toCurrency = $request->to_currency;
        $amount = (float) $request->amount;

        // Get Source Balance (Always use 'available' type for transactions)
        $fromBalance = $account->balances()
            ->where('currency', $fromCurrency)
            ->where('wallet_type', 'fiat')
            ->where('balance_type', 'available')
            ->first();
        
        if (!$fromBalance || $fromBalance->balance < $amount) {
             return back()->withErrors(['amount' => 'Insufficient balance.']);
        }

        // Determine Exchange Rate
        // Base logic: 1 USD = 0.92 EUR (approx). 
        // We try to fetch dynamic rate from DB, assuming USD->EUR pair exists or EUR->USD.
        
        $eurRateRecord = \App\Models\ExchangeRate::where(function($q) {
             $q->where('from_currency', 'USD')->where('to_currency', 'EUR');
        })->orWhere(function($q) {
             $q->where('from_currency', 'EUR')->where('to_currency', 'USD');
        })->first();

        // Default if not found
        $rateUsdToEur = 0.92; 

        if ($eurRateRecord) {
             if ($eurRateRecord->from_currency === 'USD' && $eurRateRecord->to_currency === 'EUR') {
                 $rateUsdToEur = (float) $eurRateRecord->rate;
             } elseif ($eurRateRecord->from_currency === 'EUR' && $eurRateRecord->to_currency === 'USD') {
                 // stored rate is EUR -> USD (e.g. 1.08)
                 // so USD -> EUR is 1 / 1.08 = 0.92
                 $rateUsdToEur = 1 / (float) $eurRateRecord->rate;
             }
        }
        
        $conversionRate = 1.0;
        if ($fromCurrency === 'USD' && $toCurrency === 'EUR') {
            $conversionRate = $rateUsdToEur;
        } elseif ($fromCurrency === 'EUR' && $toCurrency === 'USD') {
            $conversionRate = 1 / $rateUsdToEur;
        }
        
        $toAmount = $amount * $conversionRate;

        \Illuminate\Support\Facades\DB::transaction(function () use ($account, $fromBalance, $toCurrency, $fromCurrency, $amount, $toAmount, $conversionRate) {
// 1. Deduct from Available
            $fromBalance->decrement('balance', $amount);
            
// 2. Add to Locked (Holding for approval)
$lockedBalance = $account->balances()->firstOrCreate(
['wallet_type' => 'fiat', 'currency' => $fromCurrency, 'balance_type' => 'locked'],
                ['balance' => 0]
            );
$lockedBalance->increment('balance', $amount);

// Record Pending Transaction
\App\Models\Transaction::create([
'from_account_id' => $account->id,
'to_account_id' => $account->id, // Same account for internal fiat conversion
'type' => 'conversion',
'from_currency' => $fromCurrency,
'to_currency' => $toCurrency,
'amount' => $amount,
'exchange_rate' => $conversionRate,
'converted_amount' => $toAmount,
'status' => 'pending',
'description' => "Conversion Request: {$amount} {$fromCurrency} to {$toAmount} {$toCurrency}",
'reference_number' => \Illuminate\Support\Str::uuid(),
'created_by' => auth()->id(),
]);
        });

return back()->with('success', 'Fiat conversion submitted successfully. Pending Admin Approval.');
    }

    public function convertToCrypto(Request $request, \App\Models\Account $account)
    {
        $request->validate([
            'from_currency' => 'required|in:USD,EUR',
            'to_currency' => 'required|string', // e.g., BTC, ETH, USDT
            'amount' => 'required|numeric|min:0.01',
        ]);

        $user = $request->user();
        if ($account->user_id !== $user->id) {
            abort(403);
        }

        if ($account->account_type !== 'fiat') {
             return back()->withErrors(['error' => 'Source must be a fiat account.']);
        }

        $fromCurrency = $request->from_currency;
        $toCurrency = $request->to_currency;
        $amount = (float) $request->amount;

        // Check Balance (Available only)
        $fromBalance = $account->balances()
            ->where('currency', $fromCurrency)
            ->where('wallet_type', 'fiat')
            ->where('balance_type', 'available')
            ->first();

        if (!$fromBalance || $fromBalance->balance < $amount) {
             return back()->withErrors(['amount' => 'Insufficient balance.']);
        }

        // 1. Get Fiat -> USD Rate
        $fiatToUsdRate = 1.0;
        if ($fromCurrency === 'EUR') {
            // Simplified fetch, ideally centralized or cached
             $eurRateRecord = \App\Models\ExchangeRate::where(function($q) {
                 $q->where('from_currency', 'USD')->where('to_currency', 'EUR');
            })->orWhere(function($q) {
                 $q->where('from_currency', 'EUR')->where('to_currency', 'USD');
            })->first();

            $rateUsdToEur = 0.92; // Fallback
            if ($eurRateRecord) {
                 if ($eurRateRecord->from_currency === 'USD' && $eurRateRecord->to_currency === 'EUR') {
                     $rateUsdToEur = (float) $eurRateRecord->rate;
                 } elseif ($eurRateRecord->from_currency === 'EUR' && $eurRateRecord->to_currency === 'USD') {
                     $rateUsdToEur = 1 / (float) $eurRateRecord->rate;
                 }
            }
            $fiatToUsdRate = 1 / $rateUsdToEur; // EUR -> USD
        }

        // 2. Get Crypto Price in USD
        // We need Price of 1 Unit of Crypto in USD.
        // Exchange Rates usually stored as Pair: BTC/USD Rate: 60000.
        $cryptoRateRecord = \App\Models\ExchangeRate::where(function($q) use ($toCurrency) {
             $q->where('from_currency', $toCurrency)->where('to_currency', 'USD');
        })->orWhere(function($q) use ($toCurrency) {
             $q->where('from_currency', 'USD')->where('to_currency', $toCurrency);
        })->first();

        $cryptoPriceUsd = 1.0; // Default for stablecoins if missing, but dangerous.
        if ($toCurrency === 'USDT' || $toCurrency === 'USDC') {
            $cryptoPriceUsd = 1.0; // Approximate for demo
        } elseif ($cryptoRateRecord) {
             if ($cryptoRateRecord->from_currency === $toCurrency && $cryptoRateRecord->to_currency === 'USD') {
                 // BTC -> USD = 60000
                 $cryptoPriceUsd = (float) $cryptoRateRecord->rate;
             } elseif ($cryptoRateRecord->from_currency === 'USD' && $cryptoRateRecord->to_currency === $toCurrency) {
                 // USD -> BTC = 0.000016
                 $cryptoPriceUsd = 1 / (float) $cryptoRateRecord->rate;
             }
        } else {
             // Fallback or Error if rate not found for specific crypto
             // For safety in this demo, let's assume we have rates seeded.
             // If not found, we might want to return an error, but let's try to pass for now.
        }

        // Get Fee
        $feeSetting = \App\Models\SystemSetting::where('key', 'crypto_conversion_fee_percent')->first();
        $feePercent = $feeSetting ? (float)$feeSetting->value : 1.0;
        
        // Calculate Fee Amount (in Source Currency)
        $feeAmount = $amount * ($feePercent / 100);
        $netAmount = $amount - $feeAmount;

        // Calculate Crypto Amount based on Net Amount
        // (Net Fiat Amount * FiatToUsd) / CryptoPriceUsd
        $netUsdAmount = $netAmount * $fiatToUsdRate;
        $cryptoAmount = $netUsdAmount / $cryptoPriceUsd;

        $cryptoAccount = $user->cryptoAccount;
        if (!$cryptoAccount) {
             // Should verify user, normally created on reg
             return back()->withErrors(['error' => 'Crypto account not found.']);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($account, $fromBalance, $amount, $cryptoAccount, $toCurrency, $cryptoAmount, $fiatToUsdRate, $cryptoPriceUsd, $feePercent, $feeAmount, $fromCurrency) {
// 1. Deduct Fiat Available
             $fromBalance->decrement('balance', $amount);

// 2. Add to Fiat Locked (Holding for approval)
$lockedBalance = $account->balances()->firstOrCreate(
['wallet_type' => 'fiat', 'currency' => $fromCurrency, 'balance_type' => 'locked'],
                 ['balance' => 0]
             );
$lockedBalance->increment('balance', $amount);

// 3. Create Pending Transaction Record
             \App\Models\Transaction::create([
                 'from_account_id' => $account->id,
                 'to_account_id' => $cryptoAccount->id,
'type' => 'conversion', // or 'conversion_request' if we want to separate types, but 'conversion' + 'pending' works
                 'from_currency' => $fromCurrency,
                 'to_currency' => $toCurrency,
                 'amount' => $amount,
'exchange_rate' => $cryptoPriceUsd,
                 'converted_amount' => $cryptoAmount,
'status' => 'pending',
'description' => "Conversion Request: {$amount} {$fromCurrency} to {$cryptoAmount} {$toCurrency} (Fee: {$feePercent}%)",
'reference_number' => 'CNV-' . strtoupper(uniqid()),
                 'created_by' => auth()->id(),
             ]);
        });

return back()->with('success', "Conversion submitted successfully. Pending Admin Approval.");
    }

    public function convertCryptoAction(Request $request, \App\Models\Account $account)
    {
        $user = $request->user();
        if ($account->user_id !== $user->id && !$user->is_admin) {
             abort(403);
        }

        $validated = $request->validate([
             'from_currency' => 'required|string',
             'to_currency' => 'required|string|different:from_currency',
             'amount' => 'required|numeric|min:0.00000001',
             'wallet_type' => 'required|string|in:Spot,Funding,Earn',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $account) {
             $fromCurrency = $validated['from_currency'];
             $toCurrency = $validated['to_currency'];
             $amount = (float) $validated['amount'];
             $walletType = $validated['wallet_type']; // Use the correct wallet type (Spot, Funding, Earn)

// 1. Check Source Balance (Available)
             $sourceBalance = $account->balances()
                 ->where('wallet_type', $walletType)
                 ->where('currency', $fromCurrency)
->where('balance_type', 'available')
                 ->lockForUpdate()
                 ->first();
             
             if (!$sourceBalance || $sourceBalance->balance < $amount) {
                 throw \Illuminate\Validation\ValidationException::withMessages([
                     'amount' => ["Insufficient {$fromCurrency} balance in {$walletType} Wallet."],
                 ]);
             }
             
// 2. Determine Exchange Rate
             $pair = \App\Models\ExchangeRate::where('from_currency', $fromCurrency)
                 ->where('to_currency', $toCurrency)
                 ->first();
             
             $rate = 0;
             if ($pair) {
                 $rate = (float)$pair->rate;
} else {
                 $reversePair = \App\Models\ExchangeRate::where('from_currency', $toCurrency)
                     ->where('to_currency', $fromCurrency)
                     ->first();
                     
                 if ($reversePair) {
                     $rate = 1 / (float)$reversePair->rate;
} else {
                     $rateFromUsd = $this->getRateToUsd($fromCurrency);
                     $rateToUsd = $this->getRateToUsd($toCurrency);
                     
                     if ($rateToUsd > 0) {
                         $rate = $rateFromUsd / $rateToUsd;
                     } else {
                         throw \Illuminate\Validation\ValidationException::withMessages([
                             'to_currency' => ["Exchange rate not available for {$fromCurrency} to {$toCurrency}"],
                         ]);
                     }
                 }
             }

             // 3. Calculate Amounts
$grossReceiveAvailable = $amount * $rate;
             $feePercent = (float)(\App\Models\SystemSetting::where('key', 'trading_fee_percent')->value('value') ?? 0.1);
             $feeAmount = $grossReceiveAvailable * ($feePercent / 100);
             $netReceive = $grossReceiveAvailable - $feeAmount;

// 4. Update Balances (Lock funds)
             $sourceBalance->decrement('balance', $amount);
             
// Move to Locked in same wallet
$lockedBalance = $account->balances()->firstOrCreate(
['wallet_type' => $walletType, 'currency' => $fromCurrency, 'balance_type' => 'locked'],
['balance' => 0]
             );
$lockedBalance->increment('balance', $amount);

// 5. Record Transaction (Pending)
// Storing wallet type in description for Admin parsing: "[Spot] Conversion..."
$desc = "[{$walletType}] Conversion: {$amount} {$fromCurrency} to {$netReceive} {$toCurrency} (Fee: {$feePercent}%)";

             \App\Models\Transaction::create([
                'from_account_id' => $account->id,
                'to_account_id' => $account->id,
'type' => 'Convert Crypto',
                'from_currency' => $fromCurrency,
                'to_currency' => $toCurrency,
                'amount' => $amount,
                'converted_amount' => $netReceive,
                'exchange_rate' => $rate,
'status' => 'pending', // Requires Admin Approval
'description' => $desc,
                'reference_number' => 'CNV-' . strtoupper(uniqid()),
                'created_by' => $account->user_id,
            ]);

return redirect()->back();
        });
    }

    private function getRateToUsd($currency) {
        if ($currency === 'USD' || $currency === 'USDT' || $currency === 'USDC') return 1.0;
        
        $pair = \App\Models\ExchangeRate::where('from_currency', $currency)->where('to_currency', 'USD')->first();
        if ($pair) return (float)$pair->rate;
        
        $pairRev = \App\Models\ExchangeRate::where('from_currency', 'USD')->where('to_currency', $currency)->first();
        if ($pairRev) return 1 / (float)$pairRev->rate;
        
        return 0; // Not found
    }

    /**
     * Internal Transfer between Balance Types (e.g. Available <-> Withdrawable)
     */
    public function transferInternal(Request $request, \App\Models\Account $account)
    {
        $request->validate([
            'currency' => 'required|in:USD,EUR',
            'amount' => 'required|numeric|min:0.01',
            'direction' => 'required|in:available_to_withdrawable,withdrawable_to_available',
        ]);

        if ($account->user_id !== $request->user()->id) abort(403);
        if ($account->account_type !== 'fiat') return back()->withErrors(['error' => 'Only for fiat accounts.']);

        $currency = $request->currency;
        $amount = (float) $request->amount;
        $direction = $request->direction;

        $fromType = $direction === 'available_to_withdrawable' ? 'available' : 'withdrawable';
        $toType   = $direction === 'available_to_withdrawable' ? 'withdrawable' : 'available';

        \Illuminate\Support\Facades\DB::transaction(function () use ($account, $currency, $amount, $fromType, $toType) {
            
            // Get Source Balance
            $sourceBalance = $account->balances()->firstOrCreate(
                ['wallet_type' => 'fiat', 'currency' => $currency, 'balance_type' => $fromType],
                ['balance' => 0]
            );

            if ($sourceBalance->balance < $amount) {
                // Throw validation error to be caught by Laravel
                throw \Illuminate\Validation\ValidationException::withMessages(['amount' => "Insufficient {$fromType} balance."]);
            }

// Get Destination Balance (Not crediting yet, waiting for approval)
// But we need to lock the funds from source.
$sourceBalance->decrement('balance', $amount);
// Move to Locked (in same wallet type 'fiat' but balance_type 'locked')
// Note: This logic assumes 'locked' is a valid balance_type for fiat.
// When admin approves, it needs to move from 'fiat/locked' to 'fiat/withdrawable' (or available).
// However, to keep it simple and trackable, we can just lock it in 'locked' balance type.

$lockedBalance = $account->balances()->firstOrCreate(
['wallet_type' => 'fiat', 'currency' => $currency, 'balance_type' => 'locked'],
['balance' => 0]
            );
$lockedBalance->increment('balance', $amount);

// Record Internal Transaction (Pending)
            \App\Models\Transaction::create([
                'from_account_id' => $account->id,
                'to_account_id'   => $account->id,
                'type' => 'transfer', 
                'from_currency' => $currency,
                'to_currency'   => $currency,
                'amount' => $amount,
                'converted_amount' => $amount,
                'exchange_rate' => 1.0,
'status' => 'pending',
'description' => "Internal Transfer Request: {$amount} {$currency} from " . ucfirst($fromType) . " to " .
ucfirst($toType),
                'reference_number' => \Illuminate\Support\Str::uuid(),
                'created_by' => auth()->id(),
            ]);
        });

return back()->with('success', 'Transfer submitted successfully. Pending Admin Approval.');
    }

    /**
     * Withdraw Funds
     */
    public function withdraw(Request $request, \App\Models\Account $account)
    {
if ($account->user_id !== $request->user()->id) abort(403);
if ($account->account_type !== 'fiat') return back()->withErrors(['error' => 'Only for fiat accounts.']);
        $request->validate([
            'currency' => 'required|in:USD,EUR',
            'amount' => 'required|numeric|min:0.01',
'destination_type' => 'required|in:external,internal',
'destination_account' => 'required_if:destination_type,internal|nullable|string|exists:accounts,account_number',
'bank_details' => 'required_if:destination_type,external|nullable|string',
'description' => 'nullable|string|max:255',
], [
'destination_account.exists' => 'The destination account number does not exist.',
        ]);

        $currency = $request->currency;
        $amount = (float) $request->amount;
$user = $request->user();

\Illuminate\Support\Facades\DB::transaction(function () use ($account, $currency, $amount, $request, $user) {
            // Check Withdrawable Balance
            $balanceRecord = $account->balances()->where([
                'wallet_type' => 'fiat',
                'currency' => $currency,
                'balance_type' => 'withdrawable'
])->lockForUpdate()->first();

            if (!$balanceRecord || $balanceRecord->balance < $amount) {
// Check Available if user forgot to transfer (Optional, but user currently needs to transfer first)
                // For now, stick to Withdrawable
                throw \Illuminate\Validation\ValidationException::withMessages(['amount' => 'Insufficient withdrawable balance. Please transfer funds to Withdrawable first.']);
            }

// Deduct from Withdrawable Balance
            $balanceRecord->decrement('balance', $amount);

// Add to Locked Balance (funds are locked until admin approves/rejects)
            $lockedBalance = $account->balances()->firstOrCreate(
                ['wallet_type' => 'fiat', 'currency' => $currency, 'balance_type' => 'locked'],
                ['balance' => 0]
            );
            $lockedBalance->increment('balance', $amount);

$description = "Withdrawal of {$amount} {$currency}";
$targetAccountId = null;

if ($request->destination_type === 'internal') {
$targetAccount = \App\Models\Account::where('account_number', $request->destination_account)->first();
$targetAccountId = $targetAccount->id;
$description .= " to account {$targetAccount->account_number}";

// Don't credit target yet. Transaction is pending approval.
} else {
$description .= " to External Bank: " . $request->bank_details;
}

if ($request->description) {
$description .= " (Ref: " . $request->description . ")";
}
            // Create Transaction Record
            \App\Models\Transaction::create([
                'from_account_id' => $account->id,
'to_account_id' => $targetAccountId,
                'type' => 'withdrawal',
                'from_currency' => $currency,
'to_currency' => $currency, // Same currency for withdrawal
                'amount' => $amount,
'converted_amount' => $amount,
'status' => 'pending', // Needs Admin Approval
'description' => $description,
                'reference_number' => \Illuminate\Support\Str::uuid(),
'created_by' => $user->id,
]);

// Create Notification
\App\Models\Message::create([
'user_id' => $user->id,
'body' => "Withdrawal Pending: Your withdrawal request for {$amount} {$currency} has been submitted for approval.",
'is_from_admin' => true,
            ]);
        });

return back();
    }

    public function withdrawFundingToFiat(Request $request, \App\Models\Account $account)
    {
        $user = $request->user();
        if ($account->user_id !== $user->id) abort(403);

        $request->validate([
            'currency' => 'required|in:USD,EUR',
            'amount' => 'required|numeric|min:0.01',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $account, $user) {
            $currency = $request->currency;
            $amount = (float) $request->amount;

            // 1. Source: Funding Wallet Balance (USD/EUR)
            // The $account passed is the Crypto Account
            
            $fundingBalance = $account->balances()
->where(function ($q) {
                $q->where('wallet_type', 'funding')->orWhere('wallet_type', 'Funding');
                })
                ->where('currency', $currency)
->where('balance_type', 'available')
                ->lockForUpdate()
                ->first();

            if (!$fundingBalance || $fundingBalance->balance < $amount) {
                 throw \Illuminate\Validation\ValidationException::withMessages([
                     'amount' => ["Insufficient {$currency} balance in Funding Wallet."],
                 ]);
            }

// 2. Destination: User's Fiat Account
            $fiatAccount = $user->fiatAccount;
            if (!$fiatAccount) {
                 throw \Illuminate\Validation\ValidationException::withMessages([
                     'error' => ["Fiat account not found."],
                 ]);
            }

// 3. Move to Locked in Funding Wallet (Holding for approval)
            $fundingBalance->decrement('balance', $amount);
            
// Use same casing as source to avoid creating duplicate wallet rows
            $walletType = $fundingBalance->wallet_type;
            $fundingLocked = $account->balances()->firstOrCreate(
['wallet_type' => $walletType, 'currency' => $currency, 'balance_type' => 'locked'],
                ['balance' => 0]
            );
$fundingLocked->increment('balance', $amount);

// 4. Record Transaction (Pending)
             \App\Models\Transaction::create([
                'from_account_id' => $account->id, // Crypto Account
                'to_account_id' => $fiatAccount->id, // Fiat Account
'type' => 'Withdraw from Funding',
                'from_currency' => $currency,
                'to_currency' => $currency,
                'amount' => $amount,
                'converted_amount' => $amount,
                'exchange_rate' => 1.0,
'status' => 'pending',
                'description' => "Withdrawal from Funding Wallet to Fiat Balance",
                'reference_number' => \Illuminate\Support\Str::uuid(),
                'created_by' => $user->id,
            ]);
return back(); // No success popup requested
});
    }

    public function deposit(Request $request, \App\Models\Account $account)
    {
        $user = $request->user();
        if ($account->user_id !== $user->id && !$user->is_admin) {
             abort(403);
        }

        $request->validate([
            'currency' => 'required|string|in:USD,EUR',
            'amount' => 'required|numeric|min:1', // Assuming min deposit is 1
        ]);

        $currency = $request->currency;
        $amount = $request->amount;

        // Ensure we are adding to a Fiat account's available balance
        if ($account->account_type !== 'fiat') {
             return back()->withErrors(['error' => 'Deposits are only allowed for Fiat accounts directly.']);
        }

// Add to Pending Balance (User specified this change)
        $balance = $account->balances()->firstOrCreate(
['wallet_type' => 'fiat', 'currency' => $currency, 'balance_type' => 'pending'],
            ['balance' => 0]
        );

        $balance->increment('balance', $amount);

        // Record Transaction
        \App\Models\Transaction::create([
            'to_account_id' => $account->id,
            'type' => 'deposit',
            'to_currency' => $currency,
            'amount' => $amount,
            // from_currency matches to_currency for direct deposits
            'from_currency' => $currency,
            'converted_amount' => $amount, 
'status' => 'pending', // Transaction is pending approval
            'description' => "Deposit to Fiat Account",
            'reference_number' => \Illuminate\Support\Str::uuid(),
            'created_by' => $user->id,
        ]);

        // Create a notification message for the user
        \App\Models\Message::create([
            'user_id' => $user->id,
            'body' => "Transaction Pending: Your deposit of {$amount} {$currency} is currently pending approval.",
            'is_from_admin' => true,
        ]);

        return back();
    }
public function withdrawBlockchain(Request $request, \App\Models\Account $account)
{
$user = $request->user();
if ($account->user_id !== $user->id) abort(403);

$request->validate([
'amount' => 'required|numeric|min:0.00000001',
'currency' => 'required|string',
'address' => 'required|string',
'network' => 'required|string',
'memo' => 'nullable|string',
]);

return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $account, $user) {
$currency = $request->currency;
$amount = (float) $request->amount;
$address = $request->address;
$network = $request->network;
$memo = $request->memo;

// 1. Source: Funding Wallet Balance
$fundingBalance = $account->balances()
->where('wallet_type', 'funding')
->where('currency', $currency)
->lockForUpdate()
->first();

if (!$fundingBalance || $fundingBalance->balance < $amount) { throw
    \Illuminate\Validation\ValidationException::withMessages([ 'amount'=> ["Insufficient {$currency} balance in Funding
    Wallet."],
    ]);
    }

    // Deduct Balance Immediately (Locking funds)
    $fundingBalance->decrement('balance', $amount);

    $description = "Blockchain Withdrawal to {$network} Address: {$address}";
    if ($memo) {
    $description .= " (Memo: {$memo})";
    }

    // Create Transaction Record
    \App\Models\Transaction::create([
    'from_account_id' => $account->id,
    'to_account_id' => null, // External
    'type' => 'withdrawal',
    'from_currency' => $currency,
    'to_currency' => $currency,
    'amount' => $amount,
    'converted_amount' => $amount,
    'status' => 'pending', // Pending Admin Approval
    'description' => $description,
    'reference_number' => \Illuminate\Support\Str::uuid(),
    'created_by' => $user->id,
    ]);

    // Create Notification
    \App\Models\Message::create([
    'user_id' => $user->id,
    'body' => "Withdrawal Pending: Your blockchain withdrawal request for {$amount} {$currency} via {$network} has been
    submitted for approval.",
    'is_from_admin' => true,
    ]);
    });

return back();
    }
}

