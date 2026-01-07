<?php

namespace App\Filament\Resources\DemoAccounts;

use App\Filament\Resources\DemoAccounts\Pages\CreateDemoAccount;
use App\Filament\Resources\DemoAccounts\Pages\EditDemoAccount;
use App\Filament\Resources\DemoAccounts\Pages\ListDemoAccounts;
use App\Filament\Resources\DemoAccounts\Schemas\DemoAccountForm;
use App\Filament\Resources\DemoAccounts\Tables\DemoAccountsTable;
use App\Models\DemoAccount;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class DemoAccountResource extends Resource
{
    protected static ?string $model = DemoAccount::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return DemoAccountForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return DemoAccountsTable::configure($table);
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
            'index' => ListDemoAccounts::route('/'),
            'create' => CreateDemoAccount::route('/create'),
            'edit' => EditDemoAccount::route('/{record}/edit'),
        ];
    }
}
