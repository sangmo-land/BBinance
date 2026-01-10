<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\ExchangeRate;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    private function convertToUSD(float $amount, string $currency): float
    {
        if ($currency === 'USD') {
            return $amount;
        }

        $rate = ExchangeRate::getRateBidirectional($currency, 'USD');
        
        if ($rate === null) {
            // Fallback: use hardcoded rates if DB rate not found
            $rates = [
                'USD' => 1.0,
                'EUR' => 0.92,
                'BTC' => 0.000024,
                'ETH' => 0.00042,
                'USDT' => 1.0,
                'BNB' => 0.0016,
                'USDC' => 1.0,
            ];
            
            $fromRate = $rates[$currency] ?? 1.0;
            $toRate = $rates['USD'] ?? 1.0;
            $rate = $toRate / $fromRate;
        }

        return $amount * $rate;
    }

    private function convertFromUSD(float $usdAmount, string $targetCurrency): float
    {
        if ($targetCurrency === 'USD') {
            return $usdAmount;
        }

        $rate = ExchangeRate::getRateBidirectional('USD', $targetCurrency);
        
        if ($rate === null) {
            // Fallback: use hardcoded rates if DB rate not found
            $rates = [
                'USD' => 1.0,
                'EUR' => 0.92,
                'BTC' => 0.000024,
                'ETH' => 0.00042,
                'USDT' => 1.0,
                'BNB' => 0.0016,
                'USDC' => 1.0,
            ];
            
            $fromRate = $rates['USD'] ?? 1.0;
            $toRate = $rates[$targetCurrency] ?? 1.0;
            $rate = $toRate / $fromRate;
        }

        return $usdAmount * $rate;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $accounts = null;
        $groupedUsers = null;
        
        // Define processor for crypto calculations
        $processor = function ($account) {
            if ($account->account_type === 'crypto') {
                $totalUsd = $account->balances->sum(function ($balance) {
                    return $this->convertToUSD((float) $balance->balance, $balance->currency);
                });
                
                $account->total_btc_value = $this->convertFromUSD($totalUsd, 'BTC');
                $account->total_usdt_value = $this->convertFromUSD($totalUsd, 'USDT');
            }
            return $account;
        };

        // Accounts: Admin sees users grouped; users see their own accounts flat
        if ($user->is_admin) {
            $groupedUsers = \App\Models\User::with(['accounts.balances'])
                ->whereHas('accounts') // Only show users with accounts
                ->orderBy('created_at', 'desc')
                ->paginate(5)
                ->onEachSide(1);

            // Process accounts for each user in the admin view
            $groupedUsers->through(function ($u) use ($processor) {
                foreach ($u->accounts as $account) {
                    $processor($account);
                }
                return $u;
            });
            
            // For admin stats, we still use full account query
            $allAccounts = Account::query()->get();
            $totalBalanceUSD = $allAccounts->sum(function ($account) {
                return $this->convertToUSD((float) $account->balance, $account->currency);
            });
            $accountCount = Account::query()->count();

        } else {
            $accounts = Account::where('user_id', $user->id)
                ->with(['user', 'balances'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            $accounts->transform($processor);

            // For user stats
            $totalBalanceUSD = $accounts->sum(function ($account) {
                return $this->convertToUSD((float) $account->balance, $account->currency);
            });
            $accountCount = count($accounts);
        }
        
        // Recent transactions (last 5): Admin sees global, users see their activity
        $transactionsQuery = Transaction::query()
            ->with(['fromAccount', 'toAccount'])
            ->orderBy('created_at', 'desc');

        if (! $user->is_admin) {
            $transactionsQuery->where(function ($query) use ($user) {
                $query->whereHas('fromAccount', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->orWhereHas('toAccount', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            });
        }

        $transactions = $transactionsQuery->limit(5)->get();

        // Convert total to EUR and BTC for display
        $totalBalanceEUR = $this->convertFromUSD($totalBalanceUSD, 'EUR');
        $totalBalanceBTC = $this->convertFromUSD($totalBalanceUSD, 'BTC');
        
        return Inertia::render('Dashboard', [
            'accounts' => $accounts,
            'groupedUsers' => $groupedUsers,
            'transactions' => $transactions,
            'isAdmin' => (bool) $user->is_admin,
            'stats' => [
                'totalBalance' => [
                    'usd' => (float) $totalBalanceUSD,
                    'eur' => (float) $totalBalanceEUR,
                    'btc' => (float) $totalBalanceBTC,
                ],
                'accountCount' => (int) $accountCount,
                'recentTransactionCount' => count($transactions),
            ],
        ]);
    }
}
