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
}
