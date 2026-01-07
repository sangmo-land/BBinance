<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransferController extends Controller
{
    protected $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    public function create(Request $request)
    {
        $user = $request->user();
        
        // Get all accounts for dropdown
        $userAccounts = Account::where('user_id', $user->id)
            ->where('is_active', true)
            ->with('user')
            ->get();
        
        $allAccounts = Account::where('is_active', true)
            ->with('user')
            ->get();
        
        return Inertia::render('Transfer', [
            'userAccounts' => $userAccounts,
            'allAccounts' => $allAccounts,
            'currencies' => TransactionService::getAvailableCurrencies(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id|different:from_account_id',
            'amount' => 'required|numeric|min:0.01',
        ]);

        try {
            $fromAccount = Account::findOrFail($validated['from_account_id']);
            $toAccount = Account::findOrFail($validated['to_account_id']);
            
            // Verify user owns the source account unless admin
            if (!$request->user()->is_admin && $fromAccount->user_id !== $request->user()->id) {
                return back()->withErrors(['from_account_id' => 'You do not own this account']);
            }

            $transaction = $this->transactionService->transfer(
                $fromAccount,
                $toAccount,
                $validated['amount'],
                $request->user()->id
            );

            return redirect()->route('dashboard')
                ->with('success', 'Transfer completed successfully! Reference: ' . $transaction->reference_number);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
