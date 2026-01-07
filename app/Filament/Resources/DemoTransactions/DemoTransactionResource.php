<?php

namespace App\Filament\Resources\DemoTransactions;

use App\Filament\Resources\DemoTransactions\Pages\CreateDemoTransaction;
use App\Filament\Resources\DemoTransactions\Pages\EditDemoTransaction;
use App\Filament\Resources\DemoTransactions\Pages\ListDemoTransactions;
use App\Filament\Resources\DemoTransactions\Schemas\DemoTransactionForm;
use App\Filament\Resources\DemoTransactions\Tables\DemoTransactionsTable;
use App\Models\DemoTransaction;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class DemoTransactionResource extends Resource
{
    protected static ?string $model = DemoTransaction::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return DemoTransactionForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return DemoTransactionsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListDemoTransactions::route('/'),
            'create' => CreateDemoTransaction::route('/create'),
            'edit' => EditDemoTransaction::route('/{record}/edit'),
        ];
    }
}
