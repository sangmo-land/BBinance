<?php

namespace App\Filament\Exports;

use App\Models\Transaction;
use Filament\Actions\Exports\ExportColumn;
use Filament\Actions\Exports\Exporter;
use Filament\Actions\Exports\Models\Export;

class TransactionExporter extends Exporter
{
    protected static ?string $model = Transaction::class;

    public static function getColumns(): array
    {
        return [
            ExportColumn::make('reference_number')
                ->label('Reference Number'),
            ExportColumn::make('type')
                ->label('Type'),
            ExportColumn::make('fromAccount.account_number')
                ->label('From Account'),
            ExportColumn::make('toAccount.account_number')
                ->label('To Account'),
            ExportColumn::make('amount')
                ->formatStateUsing(fn ($state, $record) => number_format($state, 2) . ' ' . ($record->from_currency ?? 'USD'))
                ->label('Amount'),
            ExportColumn::make('converted_amount')
                ->formatStateUsing(fn ($state, $record) => $state ? number_format($state, 2) . ' ' . ($record->to_currency ?? 'USD') : '—')
                ->label('Converted Amount'),
            ExportColumn::make('exchange_rate')
                ->label('Exchange Rate'),
            ExportColumn::make('status')
                ->label('Status'),
            ExportColumn::make('description')
                ->label('Description'),
            ExportColumn::make('creator.name')
                ->label('Created By'),
            ExportColumn::make('created_at')
                ->label('Created At'),
        ];
    }

    public static function getCompletedNotificationBody(Export $export): string
    {
        $count = $export->getRecordCount();

        return "Your transaction export has completed and {$count} " . str('record')->plural($count) . ' exported.';
    }
}
