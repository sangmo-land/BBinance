<?php

namespace App\Filament\Resources\Accounts\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\Action;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use App\Services\TransactionService;
use Filament\Notifications\Notification;

class AccountsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.name')
                    ->searchable()
                    ->sortable()
                    ->label('Account Holder'),
                TextColumn::make('account_number')
                    ->searchable()
                    ->copyable()
                    ->tooltip('Click to copy'),
                TextColumn::make('account_type')
                    ->searchable()
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'standard' => 'info',
                        'savings' => 'success',
                        'crypto' => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('currency')
                    ->searchable()
                    ->badge()
                    ->color('primary'),
                TextColumn::make('balance')
                    ->numeric(decimalPlaces: 2)
                    ->sortable()
->money(fn ($record) => match ($record->account_type) {
                    'fiat' => 'USD',
                    'crypto' => 'USDT',
                    default => $record->currency,
                    })
                    ->getStateUsing(function ($record) {
                    if ($record->account_type === 'fiat') {
                    $totalUsd = 0;
                    foreach ($record->balances as $balance) {
                    $rate = \App\Models\ExchangeRate::getRateBidirectional($balance->currency, 'USD');
                    if ($rate !== null) {
                    $totalUsd += $balance->balance * $rate;
                    }
                    }
                    return $totalUsd;
                    }
                    if ($record->account_type === 'crypto') {
                    $totalUsdt = 0;
                    foreach ($record->balances as $balance) {
                    $rate = \App\Models\ExchangeRate::getRateBidirectional($balance->currency, 'USDT');
                    if ($rate !== null) {
                    $totalUsdt += $balance->balance * $rate;
                    }
                    }
                    return $totalUsdt;
                    }
                    return $record->balance;
                    })
                    ->label('Balance'),
                IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                Action::make('add_funds')
                    ->label('Add Funds')
                    ->icon('heroicon-o-plus-circle')
                    ->color('success')
                    ->form([
                        Select::make('currency')
                            ->label('Currency')
                            ->options(fn ($record) => match ($record->account_type) {
                                'fiat' => [
                                    'USD' => 'USD',
                                    'EUR' => 'EUR',
                                ],
                                'crypto' => [
                                    'EUR' => 'EUR',
                                    'USD' => 'USD',
                                    'BTC' => 'BTC',
                                    'ETH' => 'ETH',
                                    'USDT' => 'USDT',
                                    'BNB' => 'BNB',
                                    'USDC' => 'USDC',
                                ],
                                default => [],
                            })
                            ->default(fn ($record) => $record->account_type === 'fiat' ? $record->currency : 'USDT')
                            ->visible(fn ($record) => in_array($record->account_type, ['fiat', 'crypto']))
                            ->required(fn ($record) => in_array($record->account_type, ['fiat', 'crypto']))
                            ->helperText(fn ($record) => match ($record->account_type) {
                                'crypto' => 'Funds will be added to the funding wallet available balance.',
                                default => 'Funds will be added to the available balance of the chosen currency.',
                            }),
                        TextInput::make('amount')
                            ->required()
                            ->numeric()
                            ->minValue(0.01)
                            ->label('Amount to Add')
                            ->prefix(fn ($get) => match ($get('currency')) {
                                'EUR' => '€',
                                'GBP' => '£',
                                'BTC' => '₿',
                                'ETH' => 'Ξ',
                                'USDT' => '₮',
                                'USD' => '$',
                                default => '',
                            }),
                        Textarea::make('description')
                            ->label('Description')
                            ->default('Admin credit')
                            ->rows(2),
                    ])
                    ->action(function ($record, array $data) {
                        $transactionService = app(TransactionService::class);
                        $currency = $data['currency'] ?? $record->currency;
                        
                        $walletType = match ($record->account_type) {
                            'crypto' => 'funding',
                            'fiat' => 'fiat',
                            default => null,
                        };

                        $transactionService->addFunds(
                            $record,
                            $data['amount'],
                            $data['description'] ?? 'Admin credit',
                            auth()->id(),
                            $currency,
                            $walletType
                        );
                        
                        Notification::make()
                            ->title('Funds Added Successfully')
                            ->success()
                            ->body("Added {$data['amount']} {$currency} to account {$record->account_number}")
                            ->send();
                    }),
Action::make('remove_funds')
->label('Remove Funds')
->icon('heroicon-o-minus-circle')
->color('danger')
->form([
Select::make('currency')
->label('Currency')
->options(fn ($record) => match ($record->account_type) {
'fiat' => [
'USD' => 'USD',
'EUR' => 'EUR',
],
'crypto' => [
'EUR' => 'EUR',
'USD' => 'USD',
'BTC' => 'BTC',
'ETH' => 'ETH',
'USDT' => 'USDT',
'BNB' => 'BNB',
'USDC' => 'USDC',
],
default => [],
})
->default(fn ($record) => $record->account_type === 'fiat' ? $record->currency : 'USDT')
->visible(fn ($record) => in_array($record->account_type, ['fiat', 'crypto']))
->required(fn ($record) => in_array($record->account_type, ['fiat', 'crypto']))
->helperText(fn ($record) => match ($record->account_type) {
'crypto' => 'Funds will be removed from the spot wallet available balance.',
default => 'Funds will be removed from the available balance of the chosen currency.',
}),
TextInput::make('amount')
->required()
->numeric()
->minValue(0.01)
->label('Amount to Remove')
->prefix(fn ($get) => match ($get('currency')) {
'EUR' => '€',
'GBP' => '£',
'BTC' => '₿',
'ETH' => 'Ξ',
'USDT' => '₮',
'USD' => '$',
default => '',
}),
Textarea::make('description')
->label('Description')
->default('Admin debit')
->rows(2),
])
->requiresConfirmation()
->modalHeading('Remove Funds')
->modalDescription('Are you sure you want to remove funds from this account? This action cannot be undone.')
->modalSubmitActionLabel('Remove Funds')
->action(function ($record, array $data) {
try {
$transactionService = app(TransactionService::class);
$currency = $data['currency'] ?? $record->currency;

$walletType = match ($record->account_type) {
'crypto' => 'spot',
'fiat' => 'fiat',
default => null,
};

$transactionService->removeFunds(
$record,
$data['amount'],
$data['description'] ?? 'Admin debit',
auth()->id(),
$currency,
$walletType
);

Notification::make()
->title('Funds Removed Successfully')
->success()
->body("Removed {$data['amount']} {$currency} from account {$record->account_number}")
->send();
} catch (\Exception $e) {
Notification::make()
->title('Error Removing Funds')
->danger()
->body($e->getMessage())
->send();
}
}),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
