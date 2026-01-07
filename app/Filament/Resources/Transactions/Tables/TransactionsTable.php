<?php

namespace App\Filament\Resources\Transactions\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Actions\Action;
use Filament\Tables\Columns\TextColumn;
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
