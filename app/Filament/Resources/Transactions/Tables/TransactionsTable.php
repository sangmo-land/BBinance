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
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'conversion')
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$fromAccount = \App\Models\Account::find($record->from_account_id);
$toAccount = \App\Models\Account::find($record->to_account_id);

if (!$fromAccount || !$toAccount) {
throw new \Exception("Account not found.");
}

// 1. Deduct from Fiat Locked
$lockedBalance = $fromAccount->balances()
->where('wallet_type', 'fiat')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

// 2. Add to Crypto Spot (Available)
$spotBalance = $toAccount->balances()->firstOrCreate(
['wallet_type' => 'spot', 'currency' => $record->to_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$spotBalance->increment('balance', $record->converted_amount);

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
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'conversion')
->action(function ($record, array $data) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
$fromAccount = \App\Models\Account::find($record->from_account_id);

if ($fromAccount) {
// 1. Deduct from Fiat Locked
$lockedBalance = $fromAccount->balances()
->where('wallet_type', 'fiat')
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

// 2. Refund to Fiat Available
$availableBalance = $fromAccount->balances()
->where('wallet_type', 'fiat')
->where('currency', $record->from_currency)
->where('balance_type', 'available')
->first();

if (!$availableBalance) {
$availableBalance = $fromAccount->balances()->create([
'wallet_type' => 'fiat',
'currency' => $record->from_currency,
'balance_type' => 'available',
'balance' => 0
]);
}
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
->success()
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

Action::make('approveConvertCrypto')
->label('Approve Convert')
->icon('heroicon-m-check')
->color('success')
->requiresConfirmation()
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'Convert Crypto')
->action(function ($record) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record) {
$account = \App\Models\Account::find($record->from_account_id);

// Parse Wallet: "[Spot] Conversion..."
$walletType = 'Spot';
if (preg_match('/^\[(.*?)\]/', $record->description, $matches)) {
$walletType = $matches[1];
}

// 1. Remove Source Locked
$lockedBalance = $account->balances()
->where('wallet_type', $walletType)
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

// 2. Add Destination Available
$destBalance = $account->balances()->firstOrCreate(
['wallet_type' => $walletType, 'currency' => $record->to_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$destBalance->increment('balance', $record->converted_amount);

$record->update(['status' => 'completed']);
});
\Filament\Notifications\Notification::make()->title('Conversion Approved')->success()->send();
}),

Action::make('rejectConvertCrypto')
->label('Reject Convert')
->icon('heroicon-m-x-mark')
->color('danger')
->requiresConfirmation()
->visible(fn ($record) => $record->status === 'pending' && $record->type === 'Convert Crypto')
->action(function ($record) {
\Illuminate\Support\Facades\DB::transaction(function () use ($record) {
$account = \App\Models\Account::find($record->from_account_id);

$walletType = 'Spot';
if (preg_match('/^\[(.*?)\]/', $record->description, $matches)) {
$walletType = $matches[1];
}

// 1. Remove Source Locked
$lockedBalance = $account->balances()
->where('wallet_type', $walletType)
->where('currency', $record->from_currency)
->where('balance_type', 'locked')
->first();

if ($lockedBalance) {
$lockedBalance->decrement('balance', $record->amount);
}

// 2. Refund Source Available
$availBalance = $account->balances()->firstOrCreate(
['wallet_type' => $walletType, 'currency' => $record->from_currency, 'balance_type' => 'available'],
['balance' => 0]
);
$availBalance->increment('balance', $record->amount);

$record->update(['status' => 'failed']);
});
\Filament\Notifications\Notification::make()->title('Conversion Rejected')->danger()->send();
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
