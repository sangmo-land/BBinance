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
                    ->money(fn ($record) => $record->currency)
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
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
