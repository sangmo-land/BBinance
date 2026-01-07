<?php

namespace App\Filament\Resources\DemoAccounts\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\Action;
use App\Models\DemoTransaction;
use Illuminate\Support\Facades\DB;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class DemoAccountsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('account_number')
                    ->searchable(),
                TextColumn::make('user_name')
                    ->searchable(),
                TextColumn::make('currency')
                    ->searchable(),
                TextColumn::make('balance')
                    ->numeric()
                    ->sortable(),
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
                EditAction::make(),
                Action::make('addFunds')
                    ->label('Add Funds')
                    ->icon('heroicon-o-banknotes')
                    ->form([
                        \Filament\Forms\Components\TextInput::make('amount')
                            ->numeric()
                            ->required()
                            ->minValue(0.01),
                        \Filament\Forms\Components\TextInput::make('note')
                            ->label('Note')
                            ->maxLength(255),
                    ])
                    ->action(function ($record, array $data) {
                        DB::transaction(function () use ($record, $data) {
                            $amount = (float) $data['amount'];
                            $record->increment('balance', $amount);
                            DemoTransaction::create([
                                'account_id' => $record->id,
                                'type' => 'admin_credit',
                                'currency' => $record->currency,
                                'amount' => $amount,
                                'description' => $data['note'] ?? 'Admin credit',
                            ]);
                        });
                    }),
                Action::make('convertCurrency')
                    ->label('Convert')
                    ->icon('heroicon-o-arrow-path')
                    ->form([
                        \Filament\Forms\Components\Select::make('to_currency')
                            ->options([
                                'USD' => 'USD', 'EUR' => 'EUR', 'GBP' => 'GBP', 'BTC' => 'BTC', 'ETH' => 'ETH'
                            ])
                            ->required(),
                        \Filament\Forms\Components\TextInput::make('rate')
                            ->numeric()
                            ->required()
                            ->hint('Admin-defined rate'),
                        \Filament\Forms\Components\TextInput::make('amount')
                            ->numeric()
                            ->required()
                            ->minValue(0.00000001),
                    ])
                    ->action(function ($record, array $data) {
                        $amount = (float) $data['amount'];
                        if ($amount > $record->balance) {
                            return; // insufficient funds
                        }
                        $toCurrency = $data['to_currency'];
                        $rate = (float) $data['rate'];
                        DB::transaction(function () use ($record, $amount, $toCurrency, $rate) {
                            $record->decrement('balance', $amount);
                            $target = \App\Models\DemoAccount::firstOrCreate([
                                'user_name' => $record->user_name,
                                'currency' => $toCurrency,
                            ], [
                                'account_number' => $record->account_number . '-' . $toCurrency,
                                'balance' => 0,
                            ]);
                            $converted = $amount * $rate;
                            $target->increment('balance', $converted);
                            DemoTransaction::create([
                                'account_id' => $record->id,
                                'related_account_id' => $target->id,
                                'type' => 'conversion',
                                'currency' => $record->currency,
                                'amount' => $amount,
                                'description' => "Convert {$amount} {$record->currency} -> {$converted} {$toCurrency}",
                                'metadata' => ['rate' => $rate],
                            ]);
                        });
                    }),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
