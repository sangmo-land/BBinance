<?php

namespace App\Filament\Resources\DemoAccounts\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class DemoAccountForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('account_number')
                    ->required(),
                TextInput::make('user_name')
                    ->required(),
                TextInput::make('currency')
                    ->required()
                    ->default('USD'),
                TextInput::make('balance')
                    ->required()
                    ->numeric()
                    ->default(0),
            ]);
    }
}
