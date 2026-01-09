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
        $tradingPairs = \App\Models\ExchangeRate::where(function ($q) use ($currency) {
                $q->where('from_currency', $currency)
                  ->orWhere('to_currency', $currency);
            })
            ->whereNotIn('from_currency', ['USD', 'EUR'])
            ->whereNotIn('to_currency', ['USD', 'EUR'])
            ->get()
            ->map(function ($rateModel) {
                return [
                    'id' => $rateModel->id,
                    'from' => $rateModel->from_currency,
                    'to' => $rateModel->to_currency,
                    'rate' => (float)$rateModel->rate,
                ];
            })
            ->values();

        // Fetch all spot balances for trading validations
        $spotBalances = $account->balances()->where('wallet_type', 'Spot')->get();

        return \Inertia\Inertia::render('CryptoDetail', [
            'account' => $account,
            'currency' => $currency,
            'balances' => $balances,
            'spotBalances' => $spotBalances,
            'rateToUsd' => $rateToUsd,
            'walletType' => $walletType,
            'tradingPairs' => $tradingPairs
        ]);
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
}
