<?php

namespace App\Filament\Resources\Transactions\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class TransactionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('from_account_id')
                    ->relationship('fromAccount', 'id'),
                Select::make('to_account_id')
                    ->relationship('toAccount', 'id'),
                TextInput::make('type')
                    ->required(),
                TextInput::make('from_currency'),
                TextInput::make('to_currency'),
                TextInput::make('amount')
                    ->required()
                    ->numeric(),
                TextInput::make('exchange_rate')
                    ->numeric(),
                TextInput::make('converted_amount')
                    ->numeric(),
                TextInput::make('status')
                    ->required()
                    ->default('completed'),
                Textarea::make('description')
                    ->columnSpanFull(),
                TextInput::make('reference_number')
                    ->required(),
                TextInput::make('created_by')
                    ->numeric(),
            ]);
    }
}
