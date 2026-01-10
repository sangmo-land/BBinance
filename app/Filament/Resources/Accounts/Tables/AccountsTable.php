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
                            ->options([
                                'USD' => 'USD',
                                'EUR' => 'EUR',
                            ])
                            ->default(fn ($record) => $record->currency)
                            ->visible(fn ($record) => $record->account_type === 'fiat')
                            ->required(fn ($record) => $record->account_type === 'fiat')
                            ->helperText('Funds will be added to the available balance of the chosen currency.'),
                        TextInput::make('amount')
                            ->required()
                            ->numeric()
                            ->minValue(0.01)
                            ->label('Amount to Add')
                            ->prefix(fn ($get) => match ($get('currency')) {
                                'EUR' => '€',
                                default => '$',
                            }),
                        Textarea::make('description')
                            ->label('Description')
                            ->default('Admin credit')
                            ->rows(2),
                    ])
                    ->action(function ($record, array $data) {
                        $transactionService = app(TransactionService::class);
                        $currency = $data['currency'] ?? $record->currency;

                        $transactionService->addFunds(
                            $record,
                            $data['amount'],
                            $data['description'] ?? 'Admin credit',
                            auth()->id(),
                            $currency
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
