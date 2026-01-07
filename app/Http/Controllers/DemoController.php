<?php

namespace App\Http\Controllers;

use App\Models\DemoAccount;
use App\Models\DemoTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DemoController extends Controller
{
    public function index()
    {
        $accounts = DemoAccount::orderBy('user_name')->get();
        $transactions = DemoTransaction::with(['account', 'relatedAccount'])
            ->latest()
            ->limit(25)
            ->get();

        return Inertia::render('DemoDashboard', [
            'accounts' => $accounts,
            'transactions' => $transactions,
        ]);
    }

    public function transfer(Request $request)
    {
        $data = $request->validate([
            'source_id' => 'required|exists:demo_accounts,id',
            'destination_id' => 'required|exists:demo_accounts,id|different:source_id',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $source = DemoAccount::findOrFail($data['source_id']);
        $dest = DemoAccount::findOrFail($data['destination_id']);

        if ($source->currency !== $dest->currency) {
            return back()->withErrors(['amount' => 'Transfers require matching currencies. Use admin conversion.']);
        }

        if ($source->balance < $data['amount']) {
            return back()->withErrors(['amount' => 'Insufficient funds']);
        }

        DB::transaction(function () use ($source, $dest, $data) {
            $amount = (float) $data['amount'];
            $source->decrement('balance', $amount);
            $dest->increment('balance', $amount);

            DemoTransaction::create([
                'account_id' => $source->id,
                'related_account_id' => $dest->id,
                'type' => 'transfer_out',
                'currency' => $source->currency,
                'amount' => $amount,
                'description' => 'User-initiated transfer',
            ]);

            DemoTransaction::create([
                'account_id' => $dest->id,
                'related_account_id' => $source->id,
                'type' => 'transfer_in',
                'currency' => $dest->currency,
                'amount' => $amount,
                'description' => 'User-initiated transfer received',
            ]);
        });

        return redirect()->route('demo.index')->with('status', 'Transfer completed');
    }
}
