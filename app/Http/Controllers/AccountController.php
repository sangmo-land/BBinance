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
}
