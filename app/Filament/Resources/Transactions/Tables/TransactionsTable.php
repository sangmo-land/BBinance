<?php

namespace App\Filament\Resources\Transactions\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Forms\Components\Textarea;
use Filament\Tables\Table;
use Filament\Tables\Filters\SelectFilter;

class TransactionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('reference_number')
                    ->searchable()
                    ->copyable()
                    ->label('Reference')
                    ->weight('bold')
                    ->color('primary'),
                TextColumn::make('type')
                    ->searchable()
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'transfer' => 'info',
                        'admin_credit' => 'success',
                        'conversion' => 'warning',
                        'deposit' => 'primary',
                        'withdrawal' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('fromAccount.account_number')
                    ->searchable()
                    ->label('From Account')
                    ->default('—'),
                TextColumn::make('toAccount.account_number')
                    ->searchable()
                    ->label('To Account')
->formatStateUsing(function ($state, $record) {
                    // For blockchain withdrawals, extract network from description
                    if ($record->type === 'withdrawal' && !$record->to_account_id && $record->description) {
if (str_contains($record->description, 'External Bank:')) {
                            $parts = explode('External Bank:', $record->description);
                            return trim(end($parts));
                            }
if (preg_match('/to (\w+(?:\s+\w+)*)\s+Address:/i', $record->description, $matches)) {
                            return $matches[1] . ' Network';
                            }
                            }
                            return $state ?? '—';
                    })
                    ->default('—'),
                TextColumn::make('amount')
                    ->numeric(decimalPlaces: 2)
                    ->sortable()
                    ->label('Amount')
                    ->formatStateUsing(fn ($record) => 
                        number_format($record->amount, 2) . ' ' . ($record->from_currency ?? $record->to_currency ?? 'USD')
                    ),
                TextColumn::make('converted_amount')
                    ->numeric(decimalPlaces: 2)
                    ->sortable()
                    ->label('Converted')
                    ->formatStateUsing(fn ($record) => 
                        $record->converted_amount 
                            ? number_format($record->converted_amount, 2) . ' ' . ($record->to_currency ?? 'USD')
                            : '—'
                    )
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('exchange_rate')
                    ->numeric(decimalPlaces: 4)
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('status')
                    ->searchable()
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'completed' => 'success',
                        'pending' => 'warning',
                        'failed' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('description')
                    ->limit(30)
                    ->tooltip(fn ($record) => $record->description)
                    ->toggleable(),
                TextColumn::make('creator.name')
                    ->label('Created By')
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->label('Date'),
            ])
            ->filters([
                SelectFilter::make('type')
                    ->options([
                        'transfer' => 'Transfer',
                        'admin_credit' => 'Admin Credit',
                        'conversion' => 'Conversion',
                        'deposit' => 'Deposit',
                        'withdrawal' => 'Withdrawal',
                    ]),
                SelectFilter::make('status')
                    ->options([
                        'completed' => 'Completed',
                        'pending' => 'Pending',
                        'failed' => 'Failed',
                    ]),
            ])
            ->recordActions([
                ViewAction::make(),
                Action::make('approveDeposit')
                    ->label('Approve')
                    ->icon('heroicon-m-check')
                    ->color('success')
                    ->requiresConfirmation()
                    ->form([
                        Textarea::make('message')
                            ->label('Message to User')
                            ->placeholder('Optional message to the user')
                            ->rows(3),
                    ])
                    ->visible(fn ($record) => $record->status === 'pending' && $record->type === 'deposit')
                    ->action(function ($record, array $data) {
                        \Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
                            // 1. Update Transaction Status
                            $record->update(['status' => 'completed']);

                            // 2. Update Account Balances
                            $account = \App\Models\Account::find($record->to_account_id);
                            if ($account) {
                                // Decrement Pending Balance
                                $pendingBalance = $account->balances()
                                    ->where('wallet_type', 'fiat')
                                    ->where('currency', $record->to_currency)
                                    ->where('balance_type', 'pending')
                                    ->first();
                                
                                if ($pendingBalance) {
                                    $pendingBalance->decrement('balance', $record->amount);
                                }

                                // Increment Available Balance
                                $availableBalance = $account->balances()->firstOrCreate(
                                    ['wallet_type' => 'fiat', 'currency' => $record->to_currency, 'balance_type' => 'available'],
                                    ['balance' => 0]
                                );
                                $availableBalance->increment('balance', $record->amount);

                                // 3. Create Message if provided
                                if (!empty($data['message']) && $account->user_id) {
                                    \App\Models\Message::create([
                                        'user_id' => $account->user_id,
                                        'body' => $data['message'],
                                        'is_from_admin' => true,
                                    ]);
                                }
                            }
                        });

                        \Filament\Notifications\Notification::make()
                            ->title('Deposit Approved')
                            ->success()
                            ->send();
                    }),
                Action::make('rejectDeposit')
                    ->label('Reject')
                    ->icon('heroicon-m-x-mark')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->form([
                        Textarea::make('message')
                            ->label('Reason for Rejection')
                            ->placeholder('Explain why the deposit was rejected')
                            ->required()
                            ->rows(3),
                    ])
                    ->visible(fn ($record) => $record->status === 'pending' && $record->type === 'deposit')
                    ->action(function ($record, array $data) {
                        \Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
                            // 1. Update Transaction Status
                            $record->update(['status' => 'failed']);

                            // 2. Update Account Balances
                            $account = \App\Models\Account::find($record->to_account_id);
                            if ($account) {
                                // Decrement Pending Balance
                                $pendingBalance = $account->balances()
                                    ->where('wallet_type', 'fiat')
                                    ->where('currency', $record->to_currency)
                                    ->where('balance_type', 'pending')
                                    ->first();
                                
                                if ($pendingBalance) {
                                    $pendingBalance->decrement('balance', $record->amount);
                                }

                                // 3. Create Message (Required for Rejection)
                                if ($account->user_id) {
                                    \App\Models\Message::create([
                                        'user_id' => $account->user_id,
                                        'body' => $data['message'],
                                        'is_from_admin' => true,
                                    ]);
                                }
                            }
                        });

                        \Filament\Notifications\Notification::make()
                            ->title('Deposit Rejected')
                            ->danger()
                            ->send();
                    }),
Action::make('approveWithdrawal')
                ->label('Approve Withdrawal')
                ->icon('heroicon-m-check')
                ->color('success')
                ->requiresConfirmation()
                ->form([
                Textarea::make('message')
                ->label('Message to User')
                ->placeholder('Withdrawal has been processed...')
                ->rows(3),
                ])
                ->visible(fn ($record) => $record->status === 'pending' && $record->type === 'withdrawal')
                ->action(function ($record, array $data) {
                \Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
                $record->update(['status' => 'completed']);
                
                // If Internal withdrawal, credit the target account
                if ($record->to_account_id) {
                $targetAccount = \App\Models\Account::find($record->to_account_id);
                if ($targetAccount) {
                // Credit to Available Balance directly? Or Pending? Typically available for internal.
                $availableBalance = $targetAccount->balances()->firstOrCreate(
                ['wallet_type' => 'fiat', 'currency' => $record->to_currency, 'balance_type' => 'available'],
                ['balance' => 0]
                );
                $availableBalance->increment('balance', $record->amount);
                }
                }
                
                // Send Message
                $user = $record->fromAccount->user ?? null;
                if ($user && !empty($data['message'])) {
                \App\Models\Message::create([
                'user_id' => $user->id,
                'body' => $data['message'],
                'is_from_admin' => true,
                ]);
                }
                });
                
                \Filament\Notifications\Notification::make()
->title('Withdrawal Approved')
->success()
->send();
}),
Action::make('approveConversion')
->label('Approve Conversion')
->icon('heroicon-m-check')
->color('success')
->requiresConfirmation()
->form([
Textarea::make('message')
->label('Message to User')
->placeholder('Optional message')
->rows(2),
])
->visible(fn ($record) => $record->status === 'pending' && in_array($record->type, ['conversion', 'Convert Crypto']))
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$fromAccount = \App\Models\Account::find($record->from_account_id);
$toAccount = \App\Models\Account::find($record->to_account_id);

if (!$fromAccount || !$toAccount) {
throw new \Exception("Account not found.");
}

// Determine Source Wallet & Currency
$sourceWallet = 'fiat'; // Default assumption
// Check for wallet type in description for 'Convert Crypto'
if (preg_match('/^\[(Spot|Funding|Earn)\]/', $record->description, $matches)) {
$sourceWallet = $matches[1];
} elseif ($record->type === 'Convert Crypto') {
// Fallback if description parse fails but it's crypto convert
$sourceWallet = 'Spot';
}

// 1. Deduct from Source Locked
// We need to find the specific locked balance.
$lockedBalance = $fromAccount->balances()
->where('wallet_type', $sourceWallet)
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

// Use specific wallet check first, then fallback to looser check if needed
if (!$lockedBalance && $sourceWallet === 'fiat') {
// Try 'Spot' just in case logic was mixed
$lockedBalance = $fromAccount->balances()
->where('wallet_type', 'Spot')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();
}
if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
} else {
// Log or throw warning? Proceeding assumes balance was locked but maybe manually adjusted?
// Safer to require it, but for now we proceed with transaction record.
}

// 2. Add to Target Available
// Target Wallet Logic:
// - If Source is Fiat and Target Not Fiat -> Spot (Crypto)
// - If Source is Fiat and Target Fiat -> Fiat
// - If Source is Spot/Funding -> Same as Source (usually)
$targetWallet = $sourceWallet;
if ($sourceWallet === 'fiat') {
// Check if target currency is crypto (heuristic: not USD/EUR)
if (!in_array($record->to_currency, ['USD', 'EUR', 'GBP'])) {
$targetWallet = 'Spot';
} else {
$targetWallet = 'fiat';
}
} elseif ($sourceWallet === 'Spot' || $sourceWallet === 'Funding') {
// For crypto to crypto conversions (e.g. BTC -> ETH) in Spot/Funding
// The target wallet should be the same as the source wallet (e.g. convert in Spot -> get result in Spot)
$targetWallet = $sourceWallet;
// However, if the user explicitly requested conversion to a different wallet, we might check it here.
// But currently `convertCryptoAction` keeps it in same wallet.
}

// Special Case: Handling the 'convertToCrypto' flow which might have used 'fiat' wallet but target is Crypto Account.
// The convertToCrypto method sets to_account_id to the user's Crypto Account ID.
// So relying on `$toAccount` is correct. We just need to ensure correct Wallet Type.
// If it was 'Fiat' -> 'Crypto', the toAccount is CryptoAccount. The wallet type should be 'Spot'.
// If `$toAccount->account_type === 'crypto'` then force targetWallet to 'Spot' (or 'Funding' etc if we support it).
// Default for Crypto Accounts is usually Spot for conversions.

if ($toAccount->account_type === 'crypto') {
$targetWallet = 'Spot';
}

$targetBalance = $toAccount->balances()->firstOrCreate(
['wallet_type' => $targetWallet, 'currency' => $record->to_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$targetBalance->increment('balance', $record->converted_amount);

// 3. Update Transaction
$record->update(['status' => 'completed']);

// 4. Message
if (!empty($data['message']) && $fromAccount->user_id) {
\App\Models\Message::create([
'user_id' => $fromAccount->user_id,
'body' => $data['message'],
'is_from_admin' => true,
]);
}
});

\Filament\Notifications\Notification::make()
->title('Conversion Approved')
->success()
->send();
}),

Action::make('rejectConversion')
->label('Reject Conversion')
->icon('heroicon-m-x-mark')
->color('danger')
->requiresConfirmation()
->form([
Textarea::make('message')
->label('Reason for Rejection')
->required()
->rows(2),
                ])
->visible(fn ($record) => $record->status === 'pending' && in_array($record->type, ['conversion', 'Convert Crypto']))
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$fromAccount = \App\Models\Account::find($record->from_account_id);

if ($fromAccount) {
// Determine Source Wallet
$sourceWallet = 'fiat';
if (preg_match('/^\[(Spot|Funding|Earn)\]/', $record->description, $matches)) {
$sourceWallet = $matches[1];
} elseif ($record->type === 'Convert Crypto') {
$sourceWallet = 'Spot';
}

// 1. Deduct from Locked
$lockedBalance = $fromAccount->balances()
->where('wallet_type', $sourceWallet)
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

// 2. Refund to Available
$availableBalance = $fromAccount->balances()->firstOrCreate(
['wallet_type' => $sourceWallet, 'currency' => $record->from_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$availableBalance->increment('balance', $record->amount);
}

// 3. Update Transaction
$record->update(['status' => 'failed']);

// 4. Message
if (!empty($data['message']) && $fromAccount->user_id) {
\App\Models\Message::create([
'user_id' => $fromAccount->user_id,
'body' => $data['message'],
'is_from_admin' => true,
]);
}
});

\Filament\Notifications\Notification::make()
->title('Conversion Rejected')
->success() // Should technically be success notification that rejection succeeded
->send();
}),

Action::make('approveTransfer')
->label('Approve Transfer')
->icon('heroicon-m-check')
->color('success')
->requiresConfirmation()
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'transfer')
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record) {
$account = \App\Models\Account::find($record->from_account_id);

// Parse description for balance types
// "Internal Transfer: 100 USD from available to withdrawable"
if (preg_match('/from (\w+) to (\w+)/', $record->description, $matches)) {
$fromType = $matches[1];
$toType = $matches[2];
} else {
// Fallback or Error?
// Taking a safe guess or failing.
// Let's try to assume available -> withdrawable if not parseable,
// but safer to fail/throw.
throw new \Exception("Could not determine transfer direction from description.");
}

// 1. Deduct from Locked (held pending approval)
$lockedBalance = $account->balances()
->where('wallet_type', 'fiat')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();
if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}
// 2. Add to Target Balance Type
$targetBalance = $account->balances()->firstOrCreate(
['wallet_type' => 'fiat', 'currency' => $record->to_currency, 'balance_type' => $toType],
['balance' => 0]
);
$targetBalance->increment('balance', $record->amount);

// 3. Mark Completed
$record->update(['status' => 'completed']);
});

\Filament\Notifications\Notification::make()
->title('Transfer Approved')
->success()
->send();
}),
Action::make('approveFundingWithdrawal')
->label('Approve Funding Withdrawal')
->icon('heroicon-m-check')
->color('success')
->requiresConfirmation()
->form([
Textarea::make('message')
->label('Message to User')
->placeholder('Withdrawal has been processed...')
->rows(3),
])
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'Withdraw from Funding')
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$account = \App\Models\Account::find($record->from_account_id);
$fiatAccount = \App\Models\Account::find($record->to_account_id);

if (!$account || !$fiatAccount) {
throw new \Exception("Account not found.");
}

// 1. Deduct from Funding Locked
$fundingLocked = $account->balances()
->where('wallet_type', 'funding')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($fundingLocked) {
$fundingLocked->decrement('balance', $record->amount);
}

// 2. Add to Fiat Available
$fiatAvailable = $fiatAccount->balances()->firstOrCreate(
['wallet_type' => 'fiat', 'currency' => $record->to_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$fiatAvailable->increment('balance', $record->amount);

// 3. Mark Completed
$record->update(['status' => 'completed']);

// 4. Send Message
if (!empty($data['message']) && $fiatAccount->user_id) {
\App\Models\Message::create([
'user_id' => $fiatAccount->user_id,
'body' => $data['message'],
'is_from_admin' => true,
]);
}
});

\Filament\Notifications\Notification::make()
->title('Funding Withdrawal Approved')
->success()
->send();
}),

Action::make('rejectFundingWithdrawal')
->label('Reject Funding Withdrawal')
->icon('heroicon-m-x-mark')
->color('danger')
->requiresConfirmation()
->form([
Textarea::make('message')
->label('Reason for Rejection')
->required()
->rows(2),
])
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'Withdraw from Funding')
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$account = \App\Models\Account::find($record->from_account_id);

if ($account) {
// 1. Deduct from Locked
$fundingLocked = $account->balances()
->where('wallet_type', 'funding')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($fundingLocked) {
$fundingLocked->decrement('balance', $record->amount);
}

// 2. Refund to Available
$fundingAvailable = $account->balances()->firstOrCreate(
['wallet_type' => 'funding', 'currency' => $record->from_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$fundingAvailable->increment('balance', $record->amount);
}

// 3. Mark Failed
$record->update(['status' => 'failed']);

// 4. Send Message
if (!empty($data['message']) && $account->user_id) {
\App\Models\Message::create([
'user_id' => $account->user_id,
'body' => $data['message'],
'is_from_admin' => true,
]);
}
});

\Filament\Notifications\Notification::make()
->title('Funding Withdrawal Rejected')
->success()
->send();
}),

Action::make('rejectTransfer')
->label('Reject Transfer')
->icon('heroicon-m-x-mark')
->color('danger')
->requiresConfirmation()
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'transfer')
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record) {
$account = \App\Models\Account::find($record->from_account_id);

if (preg_match('/from (\w+) to (\w+)/', $record->description, $matches)) {
$fromType = $matches[1];
} else {
throw new \Exception("Could not determine transfer direction.");
}

// 1. Deduct from Locked
$lockedBalance = $account->balances()
->where('wallet_type', 'fiat')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

// 2. Refund to Source Balance Type (fromType)
$sourceBalance = $account->balances()->firstOrCreate(
['wallet_type' => 'fiat', 'currency' => $record->from_currency, 'balance_type' => $fromType],
['balance' => 0]
);
$sourceBalance->increment('balance', $record->amount);

// 3. Mark Failed
$record->update(['status' => 'failed']);
});

\Filament\Notifications\Notification::make()
->title('Transfer Rejected')
->success() // Action succeeded
->send();
}),
Action::make('approveBuyCrypto')
->label('Approve Buy Crypto')
->icon('heroicon-m-check')
->color('success')
->requiresConfirmation()
->form([
Textarea::make('message')
->label('Message')
->rows(2)
])
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'Buy Crypto')
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$account = \App\Models\Account::find($record->from_account_id);

$lockedBalance = $account->balances()
->where('wallet_type', 'Spot')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

$cryptoBalance = $account->balances()->firstOrCreate(
['wallet_type' => 'Spot', 'currency' => $record->to_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$cryptoBalance->increment('balance', $record->converted_amount);

$record->update(['status' => 'completed']);

if (!empty($data['message']) && $account->user_id) {
\App\Models\Message::create([
'user_id' => $account->user_id,
'body' => $data['message'],
'is_from_admin' => true,
]);
}
});

\Filament\Notifications\Notification::make()
->title('Trade Approved')
->success()
->send();
}),

Action::make('rejectBuyCrypto')
->label('Reject Buy Crypto')
->icon('heroicon-m-x-mark')
->color('danger')
->requiresConfirmation()
->form([
Textarea::make('message')
->label('Reason')
->required()
->rows(2)
])
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'Buy Crypto')
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$account = \App\Models\Account::find($record->from_account_id);

$lockedBalance = $account->balances()
->where('wallet_type', 'Spot')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

$availBalance = $account->balances()
->where('wallet_type', 'Spot')
->where('currency', $record->from_currency)
->where('balance_type', 'available')
->first();

if (!$availBalance) {
$availBalance = $account->balances()->create([
'wallet_type' => 'Spot',
'currency' => $record->from_currency,
'balance_type' => 'available',
'balance' => 0
]);
}
$availBalance->increment('balance', $record->amount);

$record->update(['status' => 'failed']);

if (!empty($data['message']) && $account->user_id) {
\App\Models\Message::create([
'user_id' => $account->user_id,
'body' => $data['message'],
'is_from_admin' => true,
]);
}
});

\Filament\Notifications\Notification::make()
->title('Trade Rejected')
->danger()
->send();
}),

Action::make('approveSellCrypto')
->label('Approve Sell Crypto')
->icon('heroicon-m-check')
->color('success')
->requiresConfirmation()
->form([
Textarea::make('message')
->label('Message to User (Optional)')
->rows(2)
])
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'Sell Crypto')
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$account = \App\Models\Account::find($record->from_account_id);

// 1. Remove from Locked Crypto
$lockedBalance = $account->balances()
->where('wallet_type', 'Spot')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

// 2. Add to Available Fiat (receiving currency)
$fiatBalance = $account->balances()->firstOrCreate(
['wallet_type' => 'Spot', 'currency' => $record->to_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$fiatBalance->increment('balance', $record->converted_amount);

// 3. Mark Completed
$record->update(['status' => 'completed']);

if (!empty($data['message']) && $account->user_id) {
\App\Models\Message::create([
'user_id' => $account->user_id,
'body' => $data['message'],
'is_from_admin' => true,
]);
}
});

\Filament\Notifications\Notification::make()
->title('Sell Approved')
->success()
->send();
}),

Action::make('rejectSellCrypto')
->label('Reject Sell Crypto')
->icon('heroicon-m-x-mark')
->color('danger')
->requiresConfirmation()
->form([
Textarea::make('message')
->label('Reason')
->required()
->rows(2)
])
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'Sell Crypto')
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$account = \App\Models\Account::find($record->from_account_id);

// 1. Remove from Locked Crypto
$lockedBalance = $account->balances()
->where('wallet_type', 'Spot')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

// 2. Refund to Available Crypto
$availBalance = $account->balances()
->where('wallet_type', 'Spot')
->where('currency', $record->from_currency)
->where('balance_type', 'available')
->first();

if (!$availBalance) {
$availBalance = $account->balances()->create([
'wallet_type' => 'Spot',
'currency' => $record->from_currency,
'balance_type' => 'available',
'balance' => 0
]);
}
$availBalance->increment('balance', $record->amount);

// 3. Mark Failed
$record->update(['status' => 'failed']);

if (!empty($data['message']) && $account->user_id) {
\App\Models\Message::create([
'user_id' => $account->user_id,
'body' => $data['message'],
'is_from_admin' => true,
]);
}
});

\Filament\Notifications\Notification::make()
->title('Sell Rejected')
->danger()
->send();
}),

Action::make('approveTransfer')
->label('Approve Transfer')
->icon('heroicon-m-check')
->color('success')
->requiresConfirmation()
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'Transfer')
->action(function ($record) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record) {
$account = \App\Models\Account::find($record->from_account_id);

// Parse Wallets from Description: "Transfer [Spot->Funding]: ..."
$desc = $record->description;
$fromWallet = 'Spot';
$toWallet = 'Funding';

if (preg_match('/\[(.*?)\->(.*?)\]/', $desc, $matches)) {
$fromWallet = $matches[1];
$toWallet = $matches[2];
}

// 1. Remove from Locked (Source)
$lockedBalance = $account->balances()
->where('wallet_type', $fromWallet)
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

// 2. Add to Destination Available
$destBalance = $account->balances()->firstOrCreate(
['wallet_type' => $toWallet, 'currency' => $record->to_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$destBalance->increment('balance', $record->amount);

$record->update(['status' => 'completed']);
});

\Filament\Notifications\Notification::make()->title('Transfer Approved')->success()->send();
}),

Action::make('rejectTransfer')
->label('Reject Transfer')
->icon('heroicon-m-x-mark')
->color('danger')
->requiresConfirmation()
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'Transfer')
->action(function ($record) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record) {
$account = \App\Models\Account::find($record->from_account_id);

$desc = $record->description;
$fromWallet = 'Spot';

if (preg_match('/\[(.*?)\->(.*?)\]/', $desc, $matches)) {
$fromWallet = $matches[1];
}

// 1. Remove from Locked
$lockedBalance = $account->balances()
->where('wallet_type', $fromWallet)
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

// 2. Refund to Available
$availBalance = $account->balances()->firstOrCreate(
['wallet_type' => $fromWallet, 'currency' => $record->from_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$availBalance->increment('balance', $record->amount);

$record->update(['status' => 'failed']);
});
\Filament\Notifications\Notification::make()->title('Transfer Rejected')->danger()->send();
}),


                Action::make('rejectWithdrawal')
->label('Reject Withdrawal')
                ->icon('heroicon-m-x-mark')
                ->color('danger')
                ->requiresConfirmation()
                ->form([
                Textarea::make('message')
                ->label('Reason for Rejection')
                ->required()
                ->rows(3),
                ])
                ->visible(fn ($record) => $record->status === 'pending' && $record->type === 'withdrawal')
                ->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$record->update(['status' => 'failed']);
// REFUND LOGIC
$sourceAccount = $record->fromAccount;
if ($sourceAccount) {
$currency = $record->from_currency;

// Check if Crypto (Blockchain) or Fiat Withdrawal
// We can infer from currency or logic.
$isFiat = in_array($currency, ['USD', 'EUR']);

if ($isFiat) {
// FIAT Refund -> 'withdrawable' balance
$withdrawableBalance = $sourceAccount->balances()->where([
'wallet_type' => 'fiat',
'currency' => $currency,
'balance_type' => 'withdrawable'
])->first();

if ($withdrawableBalance) {
$withdrawableBalance->increment('balance', $record->amount);
}
} else {
// CRYPTO Refund -> 'funding' balance (as used in withdrawBlockchain)
$fundingBalance = $sourceAccount->balances()->firstOrCreate(
['wallet_type' => 'funding', 'currency' => $currency],
['balance' => 0]
);
$fundingBalance->increment('balance', $record->amount);
}
}

// Send Message
$user = $sourceAccount->user ?? null;
if ($user) {
\App\Models\Message::create([
'user_id' => $user->id,
'body' => $data['message'],
'is_from_admin' => true,
]);
}
});

\Filament\Notifications\Notification::make()
->title('Withdrawal Rejected & Refunded')
->danger()
->send();
                }),
            ])
            ->toolbarActions([
                Action::make('exportCsv')
                    ->label('Export CSV')
                    ->icon('heroicon-m-arrow-down-tray')
                    ->url(fn () => route('admin.transactions.export', request()->query()))
                    ->openUrlInNewTab(),
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
