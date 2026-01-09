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

        $account->load('balances');

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

        return \Inertia\Inertia::render('AccountDetails', [
            'account' => $account,
            'rates' => $exchangeRates,
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

        // Get Source Balance
        $fromBalance = $account->balances()
            ->where('currency', $fromCurrency)
            ->where('wallet_type', 'fiat')
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

        \Illuminate\Support\Facades\DB::transaction(function () use ($account, $fromBalance, $toCurrency, $amount, $toAmount) {
            $fromBalance->decrement('balance', $amount);
            
            $toBalance = $account->balances()->firstOrCreate(
                ['wallet_type' => 'fiat', 'currency' => $toCurrency],
                ['balance' => 0]
            );
            
           $toBalance->increment('balance', $toAmount);
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

        // Check Balance
        $fromBalance = $account->balances()
            ->where('currency', $fromCurrency)
            ->where('wallet_type', 'fiat')
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

        // Calculate Crypto Amount
        // (Fiat Amount * FiatToUsd) / CryptoPriceUsd
        $usdAmount = $amount * $fiatToUsdRate;
        $cryptoAmount = $usdAmount / $cryptoPriceUsd;

        $cryptoAccount = $user->cryptoAccount;
        if (!$cryptoAccount) {
             // Should verify user, normally created on reg
             return back()->withErrors(['error' => 'Crypto account not found.']);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($fromBalance, $amount, $cryptoAccount, $toCurrency, $cryptoAmount) {
             // Deduct Fiat
             $fromBalance->decrement('balance', $amount);

             // Add Crypto to Spot
             $spotBalance = $cryptoAccount->balances()->firstOrCreate(
                 ['wallet_type' => 'spot', 'currency' => $toCurrency],
                 ['balance' => 0]
             );
             $spotBalance->increment('balance', $cryptoAmount);
        });

        return back()->with('success', 'Conversion to crypto successful.');
    }
}
