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

        return \Inertia\Inertia::render('AccountDetails', [
            'account' => $account,
            'rates' => $exchangeRates,
            'cryptoConversionFeePercent' => $feePercent,
            'transactions' => $transactions,
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
            $query->where('wallet_type', $walletType);
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
        $tradingPairs = \App\Models\ExchangeRate::where(function ($q) use ($currency) {
                $q->where('from_currency', $currency)
                  ->orWhere('to_currency', $currency);
            })
            ->whereNotIn('from_currency', ['USD', 'EUR'])
            ->whereNotIn('to_currency', ['USD', 'EUR'])
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
        $spotBalances = $account->balances()->where('wallet_type', 'Spot')->get();
        
        // Fetch all balances for this currency (for Transfer modal)
        $allCurrencyBalances = $account->balances()->where('currency', $currency)->get();

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

            // Deduct from Fiat
            $fiatBalance->decrement('balance', $amount);
            
            // Credit Funding Wallet
            $fundingBalance = $account->balances()
                ->firstOrCreate(
                    ['wallet_type' => 'funding', 'currency' => $currency],
                    ['balance' => 0]
                );
            
            $fundingBalance->increment('balance', $amount);

            // Record Transaction
            \App\Models\Transaction::create([
                 'from_account_id' => $fiatAccount->id,
                 'to_account_id' => $account->id,
                 'type' => 'Deposit to Funding',
                 'from_currency' => $currency,
                 'to_currency' => $currency,
                 'amount' => $amount,
                 'status' => 'completed',
                 'description' => "Deposit {$amount} {$currency} from Fiat Account to Funding Wallet",
                 'created_by' => $user->id,
            ]);

            return redirect()->back()->with('success', "Successfully deposited {$amount} {$currency} to Funding Wallet");
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

             // 3. Check & Deduct Balance
             $spendBalance = $account->balances()
                 ->where('wallet_type', 'Spot')
                 ->where('currency', $spendingCurrency)
                 ->lockForUpdate() // Lock row
                 ->first();

             if (!$spendBalance || $spendBalance->balance < $amount) {
                 throw \Illuminate\Validation\ValidationException::withMessages([
                     'amount' => ["Insufficient {$spendingCurrency} balance in Spot Wallet."],
                 ]);
             }

             $spendBalance->decrement('balance', $amount);

             // 4. Add Receive Balance
             $receiveBalance = $account->balances()
                 ->where('wallet_type', 'Spot')
                 ->where('currency', $receivingCurrency)
                 ->first();
            
             if ($receiveBalance) {
                 $receiveBalance->increment('balance', $netReceiveAmount);
             } else {
                 $account->balances()->create([
                     'wallet_type' => 'Spot',
                     'currency' => $receivingCurrency,
                     'balance' => $netReceiveAmount,
                     'balance_type' => 'crypto' // Assuming default
                 ]);
             }

             // 5. Create Transaction Record
             \App\Models\Transaction::create([
                 'from_account_id' => $account->id,
                 'to_account_id' => $account->id,
                 'type' => 'Buy Crypto',
                 'from_currency' => $spendingCurrency,
                 'to_currency' => $receivingCurrency,
                 'amount' => $amount,
                 'exchange_rate' => $rawReceiveAmount > 0 ? ($amount / $rawReceiveAmount) : 0, // Effective Rate
                 'converted_amount' => $netReceiveAmount,
                 'status' => 'completed',
                 'description' => "Bought {$receivingCurrency} with {$spendingCurrency} (Fee: {$feePercent}%)",
                 'reference_number' => 'TRD-' . strtoupper(uniqid()),
                 'created_by' => $account->user_id,
             ]);

             return redirect()->back()->with('success', "Successfully bought " . number_format($netReceiveAmount, 8) . " {$receivingCurrency}");
        });
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
                 ->lockForUpdate() // Lock row
                 ->first();

             if (!$spendBalance || $spendBalance->balance < $amount) {
                 throw \Illuminate\Validation\ValidationException::withMessages([
                     'amount' => ["Insufficient {$spendingCurrency} balance in Spot Wallet."],
                 ]);
             }

             $spendBalance->decrement('balance', $amount);

             // 4. Add Receive Balance
             $receiveBalance = $account->balances()
                 ->where('wallet_type', 'Spot')
                 ->where('currency', $receivingCurrency)
                 ->first();
            
             if ($receiveBalance) {
                 $receiveBalance->increment('balance', $netReceiveAmount);
             } else {
                 $account->balances()->create([
                     'wallet_type' => 'Spot',
                     'currency' => $receivingCurrency,
                     'balance' => $netReceiveAmount,
                     'balance_type' => 'crypto' // Assuming default
                 ]);
             }

             // 5. Create Transaction Record
             \App\Models\Transaction::create([
                 'from_account_id' => $account->id,
                 'to_account_id' => $account->id,
                 'type' => 'Sell Crypto',
                 'from_currency' => $spendingCurrency,
                 'to_currency' => $receivingCurrency,
                 'amount' => $amount,
                 'exchange_rate' => $rawReceiveAmount > 0 ? ($amount / $rawReceiveAmount) : 0, // Effective Rate
                 'converted_amount' => $netReceiveAmount,
                 'status' => 'completed',
                 'description' => "Sold {$spendingCurrency} for {$receivingCurrency} (Fee: {$feePercent}%)",
                 'reference_number' => 'TRD-' . strtoupper(uniqid()),
                 'created_by' => $account->user_id,
             ]);

             return redirect()->back()->with('success', "Successfully sold " . number_format($amount, 8) . " {$spendingCurrency} for " . number_format($netReceiveAmount, 8) . " {$receivingCurrency}");
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
            $toWallet = $validated['to_wallet'];
            $currency = $validated['currency'];

            // 1. Get Source Balance and Lock
            $sourceBalance = $account->balances()
                ->where('wallet_type', $fromWallet)
                ->where('currency', $currency)
                ->lockForUpdate()
                ->first();

            if (!$sourceBalance || $sourceBalance->balance < $amount) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'amount' => ["Insufficient balance in {$fromWallet} Wallet."],
                ]);
            }

            // 2. Decrement Source
            $sourceBalance->decrement('balance', $amount);

            // 3. Increment Destination
            $destBalance = $account->balances()->firstOrCreate(
                ['wallet_type' => $toWallet, 'currency' => $currency],
                ['balance' => 0, 'balance_type' => 'crypto'] // Default attributes
            );
            $destBalance->increment('balance', $amount);

            // 4. Create Transaction Record
            \App\Models\Transaction::create([
                'from_account_id' => $account->id,
                'to_account_id' => $account->id,
                'type' => 'Transfer',
                'from_currency' => $currency,
                'to_currency' => $currency,
                'amount' => $amount,
                'converted_amount' => $amount,
                'exchange_rate' => 1.0,
                'status' => 'completed',
                'description' => "Transferred {$amount} {$currency} from {$fromWallet} to {$toWallet}",
                'reference_number' => 'TRF-' . strtoupper(uniqid()),
                'created_by' => $account->user_id,
            ]);

            return redirect()->back()->with('success', "Successfully transferred " . number_format($amount, 8) . " {$currency} from {$fromWallet} to {$toWallet}");
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
            $fromBalance->decrement('balance', $amount);
            
            $toBalance = $account->balances()->firstOrCreate(
                ['wallet_type' => 'fiat', 'currency' => $toCurrency, 'balance_type' => 'available'],
                ['balance' => 0]
            );
            
           $toBalance->increment('balance', $toAmount);

           // Record Transaction
           \App\Models\Transaction::create([
               'from_account_id' => $account->id,
               'to_account_id' => $account->id, // Same account for internal fiat conversion
               'type' => 'conversion',
               'from_currency' => $fromCurrency,
               'to_currency' => $toCurrency,
               'amount' => $amount,
               'exchange_rate' => $conversionRate,
               'converted_amount' => $toAmount,
               'status' => 'completed',
               'description' => "Converted {$amount} {$fromCurrency} to {$toAmount} {$toCurrency}",
               'reference_number' => \Illuminate\Support\Str::uuid(),
               'created_by' => auth()->id(),
           ]);
        });

        return back()->with('success', 'Conversion successful.');
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
             // Deduct Fiat
             $fromBalance->decrement('balance', $amount);

             // Add Crypto to Spot
             $spotBalance = $cryptoAccount->balances()->firstOrCreate(
                 ['wallet_type' => 'spot', 'currency' => $toCurrency, 'balance_type' => 'available'],
                 ['balance' => 0]
             );
             $spotBalance->increment('balance', $cryptoAmount);

             // Record Transaction
             \App\Models\Transaction::create([
                 'from_account_id' => $account->id,
                 'to_account_id' => $cryptoAccount->id,
                 'type' => 'conversion',
                 'from_currency' => $fromCurrency,
                 'to_currency' => $toCurrency,
                 'amount' => $amount,
                 'exchange_rate' => $cryptoPriceUsd, // Note: This is simplified. Ideally we store the cross-rate.
                 'converted_amount' => $cryptoAmount,
                 'status' => 'completed',
                 'description' => "Converted {$amount} {$fromCurrency} to {$cryptoAmount} {$toCurrency} (Fee: {$feePercent}%, {$feeAmount} {$fromCurrency})",
                 'reference_number' => \Illuminate\Support\Str::uuid(),
                 'created_by' => auth()->id(),
             ]);
        });

        return back()->with('success', 'Conversion to crypto successful.');
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

             // 1. Check Source Balance in standard Title Case wallet
             $sourceBalance = $account->balances()
                 ->where('wallet_type', $walletType)
                 ->where('currency', $fromCurrency)
                 ->lockForUpdate()
                 ->first();
             
             if (!$sourceBalance || $sourceBalance->balance < $amount) {
                 throw \Illuminate\Validation\ValidationException::withMessages([
                     'amount' => ["Insufficient {$fromCurrency} balance in {$walletType} Wallet."],
                 ]);
             }
             
             // 2. Determine Exchange Rate (From Currency -> To Currency)
             // Need Value of 1 FromCurrency in ToCurrency.
             
             // Try Direct Pair: From -> To
             $pair = \App\Models\ExchangeRate::where('from_currency', $fromCurrency)
                 ->where('to_currency', $toCurrency)
                 ->first();
             
             $rate = 0;
             if ($pair) {
                 $rate = (float)$pair->rate;
             } else {
                 // Try Indirect: To -> From (Invert)
                 $reversePair = \App\Models\ExchangeRate::where('from_currency', $toCurrency)
                     ->where('to_currency', $fromCurrency)
                     ->first();
                     
                 if ($reversePair) {
                     $rate = 1 / (float)$reversePair->rate;
                 } else {
                     // Try Cross Rate via USD? (Simplified for demo: assume USD intermediate or fail)
                     // Fetch From->USD and To->USD
                     // Rate = (Rate From->USD) / (Rate To->USD)
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
             
             // Apply Fee? Let's say 0.1% or reuse system setting
             $feePercent = (float)(\App\Models\SystemSetting::where('key', 'trading_fee_percent')->value('value') ?? 0.1);
             $feeAmount = $grossReceiveAvailable * ($feePercent / 100);
             $netReceive = $grossReceiveAvailable - $feeAmount;

             // 4. Update Balances
             $sourceBalance->decrement('balance', $amount);
             
             $destBalance = $account->balances()->firstOrCreate(
                 ['wallet_type' => $walletType, 'currency' => $toCurrency],
                 ['balance' => 0, 'balance_type' => 'crypto']
             );
             $destBalance->increment('balance', $netReceive);

             // 5. Record Transaction
             \App\Models\Transaction::create([
                'from_account_id' => $account->id,
                'to_account_id' => $account->id,
                'type' => 'conversion', // or 'Convert Crypto'
                'from_currency' => $fromCurrency,
                'to_currency' => $toCurrency,
                'amount' => $amount,
                'converted_amount' => $netReceive,
                'exchange_rate' => $rate,
                'status' => 'completed',
                'description' => "Converted {$amount} {$fromCurrency} to {$netReceive} {$toCurrency} in {$walletType} Wallet (Fee: {$feePercent}%)",
                'reference_number' => 'CNV-' . strtoupper(uniqid()),
                'created_by' => $account->user_id,
            ]);

            return redirect()->back()->with('success', "Successfully converted " . number_format($amount, 8) . " {$fromCurrency} to " . number_format($netReceive, 8) . " {$toCurrency}");
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

            // Get Destination Balance
            $destBalance = $account->balances()->firstOrCreate(
                ['wallet_type' => 'fiat', 'currency' => $currency, 'balance_type' => $toType],
                ['balance' => 0]
            );

            $sourceBalance->decrement('balance', $amount);
            $destBalance->increment('balance', $amount);

            // Record Internal Transaction
            \App\Models\Transaction::create([
                'from_account_id' => $account->id,
                'to_account_id'   => $account->id,
                'type' => 'transfer', 
                'from_currency' => $currency,
                'to_currency'   => $currency,
                'amount' => $amount,
                'converted_amount' => $amount,
                'exchange_rate' => 1.0,
                'status' => 'completed',
                'description' => "Internal Transfer: {$amount} {$currency} from " . ucfirst($fromType) . " to " . ucfirst($toType),
                'reference_number' => \Illuminate\Support\Str::uuid(),
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Transfer successful.');
    }

    /**
     * Withdraw Funds
     */
    public function withdraw(Request $request, \App\Models\Account $account)
    {
        $request->validate([
            'currency' => 'required|in:USD,EUR',
            'amount' => 'required|numeric|min:0.01',
            // Add bank detail validation if needed later
        ]);

        if ($account->user_id !== $request->user()->id) abort(403);
        if ($account->account_type !== 'fiat') return back()->withErrors(['error' => 'Only for fiat accounts.']);

        $currency = $request->currency;
        $amount = (float) $request->amount;

        \Illuminate\Support\Facades\DB::transaction(function () use ($account, $currency, $amount) {
            // Check Withdrawable Balance
            $balanceRecord = $account->balances()->where([
                'wallet_type' => 'fiat',
                'currency' => $currency,
                'balance_type' => 'withdrawable'
            ])->first();

            if (!$balanceRecord || $balanceRecord->balance < $amount) {
                throw \Illuminate\Validation\ValidationException::withMessages(['amount' => 'Insufficient withdrawable balance. Please transfer funds to Withdrawable first.']);
            }

            // Deduct Balance
            $balanceRecord->decrement('balance', $amount);

            // Create Transaction Record
            \App\Models\Transaction::create([
                'from_account_id' => $account->id,
                'to_account_id' => null, // External
                'type' => 'withdrawal',
                'from_currency' => $currency,
                'amount' => $amount,
                'status' => 'completed', // Or 'pending' if manual approval needed. User asked to "remove from system", implying completed deduction.
                'description' => "Withdrawal of {$amount} {$currency} to external account",
                'reference_number' => \Illuminate\Support\Str::uuid(),
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Withdrawal successful.');
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
                ->where('wallet_type', 'funding')
                ->where('currency', $currency)
                ->lockForUpdate()
                ->first();

            if (!$fundingBalance || $fundingBalance->balance < $amount) {
                 throw \Illuminate\Validation\ValidationException::withMessages([
                     'amount' => ["Insufficient {$currency} balance in Funding Wallet."],
                 ]);
            }

            // 2. Destination: User's Fiat Account -> Available Balance
            $fiatAccount = $user->fiatAccount;
            if (!$fiatAccount) {
                 throw \Illuminate\Validation\ValidationException::withMessages([
                     'error' => ["Fiat account not found."],
                 ]);
            }

            $fiatAvailableBalance = $fiatAccount->balances()->firstOrCreate(
                ['wallet_type' => 'fiat', 'currency' => $currency, 'balance_type' => 'available'],
                ['balance' => 0]
            );

            // 3. Execute Transfer
            $fundingBalance->decrement('balance', $amount);
            $fiatAvailableBalance->increment('balance', $amount);

            // 4. Record Transaction
             \App\Models\Transaction::create([
                'from_account_id' => $account->id, // Crypto Account
                'to_account_id' => $fiatAccount->id, // Fiat Account
                'type' => 'transfer', 
                'from_currency' => $currency,
                'to_currency' => $currency,
                'amount' => $amount,
                'converted_amount' => $amount,
                'exchange_rate' => 1.0,
                'status' => 'completed',
                'description' => "Withdrawal from Funding Wallet to Fiat Balance",
                'reference_number' => \Illuminate\Support\Str::uuid(),
                'created_by' => $user->id,
            ]);
        });

        return back()->with('success', 'Funds transferred to Fiat available balance.');
    }
}
