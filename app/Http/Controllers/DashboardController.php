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
                'GBP' => 0.79,
                'JPY' => 149.50,
                'BTC' => 0.000024,
                'ETH' => 0.00042,
                'SOL' => 0.0095,
                'USDT' => 1.0,
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
                'GBP' => 0.79,
                'JPY' => 149.50,
                'BTC' => 0.000024,
                'ETH' => 0.00042,
                'SOL' => 0.0095,
                'USDT' => 1.0,
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
        
        // Accounts: Admin sees all with pagination; users see their own
        if ($user->is_admin) {
            $accounts = Account::query()
                ->with(['user', 'balances'])
                ->orderBy('created_at', 'desc')
                ->paginate(9)
                ->onEachSide(1);
        } else {
            $accounts = Account::where('user_id', $user->id)
                ->with(['user', 'balances'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // Process accounts to add calculated totals for Crypto accounts
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

        if ($user->is_admin) {
            $accounts->through($processor);
        } else {
            $accounts->transform($processor);
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
        
        // Calculate stats with currency conversion to USD
        if ($user->is_admin) {
            // For admin: sum all accounts converted to USD
            $allAccounts = Account::query()->get();
            $totalBalanceUSD = $allAccounts->sum(function ($account) {
                return $this->convertToUSD((float) $account->balance, $account->currency);
            });
            $accountCount = Account::query()->count();
        } else {
            // For user: sum their accounts converted to USD
            $totalBalanceUSD = $accounts->sum(function ($account) {
                return $this->convertToUSD((float) $account->balance, $account->currency);
            });
            $accountCount = count($accounts);
        }

        // Convert total to EUR and BTC for display
        $totalBalanceEUR = $this->convertFromUSD($totalBalanceUSD, 'EUR');
        $totalBalanceBTC = $this->convertFromUSD($totalBalanceUSD, 'BTC');
        
        return Inertia::render('Dashboard', [
            'accounts' => $accounts,
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
