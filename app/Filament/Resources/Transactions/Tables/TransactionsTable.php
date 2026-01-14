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
