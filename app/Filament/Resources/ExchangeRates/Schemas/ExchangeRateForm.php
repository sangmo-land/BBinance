<?php

namespace App\Filament\Resources\ExchangeRates\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ExchangeRateForm
{
    public static function configure(Schema $schema): Schema
    {
        $currencies = ['USD', 'EUR', 'GBP', 'JPY', 'BTC', 'ETH', 'SOL', 'USDT'];

        return $schema
            ->components([
                Select::make('from_currency')
                    ->label('From Currency')
                    ->options(array_combine($currencies, $currencies))
                    ->required()
                    ->searchable(),

                Select::make('to_currency')
                    ->label('To Currency')
                    ->options(array_combine($currencies, $currencies))
                    ->required()
                    ->searchable()
                    ->different('from_currency')
                    ->helperText('Must be different from source currency'),

                TextInput::make('rate')
                    ->label('Exchange Rate')
                    ->numeric()
                    ->required()
                    ->step('0.00000001')
                    ->minValue(0.00000001)
                    ->helperText('Rate to convert from source to target currency'),

                Toggle::make('is_active')
                    ->label('Active')
                    ->default(true)
                    ->helperText('Only active rates are used for conversions'),
            ]);
    }
}
