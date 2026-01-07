<?php

namespace App\Filament\Resources\DemoTransactions\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class DemoTransactionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('account_id')
                    ->required()
                    ->numeric(),
                TextInput::make('related_account_id')
                    ->numeric(),
                TextInput::make('type')
                    ->required(),
                TextInput::make('currency')
                    ->required(),
                TextInput::make('amount')
                    ->required()
                    ->numeric(),
                Textarea::make('metadata')
                    ->columnSpanFull(),
                Textarea::make('description')
                    ->columnSpanFull(),
            ]);
    }
}
