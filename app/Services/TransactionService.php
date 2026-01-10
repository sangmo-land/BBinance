<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Exception;

class TransactionService
{
    /**
     * Process a transfer between accounts
     */
    public function transfer(Account $fromAccount, Account $toAccount, float $amount, ?int $userId = null): Transaction
    {
        return DB::transaction(function () use ($fromAccount, $toAccount, $amount, $userId) {
            // Check if source account has sufficient balance
            if ($fromAccount->balance < $amount) {
                throw new Exception('Insufficient balance');
            }

            // Deduct from source account
            $fromAccount->decrement('balance', $amount);

            // Determine if currency conversion is needed
            $exchangeRate = 1;
            $convertedAmount = $amount;

            if ($fromAccount->currency !== $toAccount->currency) {
                $exchangeRate = $this->getExchangeRate($fromAccount->currency, $toAccount->currency);
                $convertedAmount = $amount * $exchangeRate;
            }

            // Add to destination account
            $toAccount->increment('balance', $convertedAmount);

            // Create transaction record
            return Transaction::create([
                'from_account_id' => $fromAccount->id,
                'to_account_id' => $toAccount->id,
                'type' => 'transfer',
                'from_currency' => $fromAccount->currency,
                'to_currency' => $toAccount->currency,
                'amount' => $amount,
                'exchange_rate' => $exchangeRate,
                'converted_amount' => $convertedAmount,
                'status' => 'completed',
                'description' => "Transfer from {$fromAccount->account_number} to {$toAccount->account_number}",
                'created_by' => $userId,
            ]);
        });
    }

    /**
     * Add funds to an account (Admin operation)
     */
    public function addFunds(Account $account, float $amount, string $description = 'Admin credit', ?int $userId = null, ?string $currency = null): Transaction
    {
        $currency = $currency ?? $account->currency;

        return DB::transaction(function () use ($account, $amount, $description, $userId, $currency) {
            // Add to account balance (legacy/primary) only if currency matches
            if ($currency === $account->currency) {
                $account->increment('balance', $amount);
            }

            // Update detailed AccountBalance
            $walletType = match ($account->account_type) {
                'fiat' => 'fiat',
                'crypto' => 'spot',
                default => null,
            };

            if ($walletType) {
                 $balanceRecord = \App\Models\AccountBalance::firstOrCreate(
                    [
                        'account_id' => $account->id,
                        'wallet_type' => $walletType,
                        'currency' => $currency,
                        'balance_type' => 'available'
                    ],
                    ['balance' => 0]
                 );
                 $balanceRecord->increment('balance', $amount);
            }

            // Create transaction record
            return Transaction::create([
                'to_account_id' => $account->id,
                'type' => 'admin_credit',
                'to_currency' => $currency,
                'amount' => $amount,
                'status' => 'completed',
                'description' => $description,
                'created_by' => $userId,
            ]);
        });
    }

    /**
     * Convert between currencies within same account or to different account
     */
    public function convert(Account $fromAccount, string $toCurrency, float $amount, ?Account $toAccount = null, ?int $userId = null): Transaction
    {
        return DB::transaction(function () use ($fromAccount, $toCurrency, $amount, $toAccount, $userId) {
            // Check if source account has sufficient balance
            if ($fromAccount->balance < $amount) {
                throw new Exception('Insufficient balance');
            }

            // Get exchange rate
            $exchangeRate = $this->getExchangeRate($fromAccount->currency, $toCurrency);
            $convertedAmount = $amount * $exchangeRate;

            // Deduct from source account
            $fromAccount->decrement('balance', $amount);

            // If no target account specified, find or create one in the target currency for the same user
            if (!$toAccount) {
                $toAccount = Account::firstOrCreate([
                    'user_id' => $fromAccount->user_id,
                    'currency' => $toCurrency,
                ], [
                    'account_type' => $fromAccount->account_type,
                    'balance' => 0,
                ]);
            }

            // Add to destination account
            $toAccount->increment('balance', $convertedAmount);

            // Create transaction record
            return Transaction::create([
                'from_account_id' => $fromAccount->id,
                'to_account_id' => $toAccount->id,
                'type' => 'conversion',
                'from_currency' => $fromAccount->currency,
                'to_currency' => $toCurrency,
                'amount' => $amount,
                'exchange_rate' => $exchangeRate,
                'converted_amount' => $convertedAmount,
                'status' => 'completed',
                'description' => "Converted {$amount} {$fromAccount->currency} to {$convertedAmount} {$toCurrency}",
                'created_by' => $userId,
            ]);
        });
    }

    /**
     * Get exchange rate between currencies (from database, fallback to demo rates)
     */
    private function getExchangeRate(string $fromCurrency, string $toCurrency): float
    {
        // Same currency, no conversion needed
        if ($fromCurrency === $toCurrency) {
            return 1.0;
        }

        // Try to get rate from database first (supports inverse lookup)
        $dbRate = \App\Models\ExchangeRate::getRateBidirectional($fromCurrency, $toCurrency);
        
        if ($dbRate !== null) {
            return $dbRate;
        }

        // Fallback to demo exchange rates if not found in database
        \Log::warning("Exchange rate not found in database for {$fromCurrency} to {$toCurrency}, using fallback");
        
        // Demo exchange rates - in a real app, this would come from an API
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

        $fromRate = $rates[strtoupper($fromCurrency)] ?? 1;
        $toRate = $rates[strtoupper($toCurrency)] ?? 1;

        return $toRate / $fromRate;
    }

    /**
     * Get available currencies
     */
    public static function getAvailableCurrencies(): array
    {
        return [
            'Fiat' => ['USD', 'EUR', 'GBP', 'JPY'],
            'Crypto' => ['BTC', 'ETH', 'SOL', 'USDT'],
        ];
    }
}
