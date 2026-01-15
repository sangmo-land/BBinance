<?php

namespace App\Filament\Resources\Accounts\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class AccountForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->required()
                    ->searchable()
                    ->preload(),
                TextInput::make('account_number')
                    ->required()
                    ->unique(ignoreRecord: true)
->default(fn () => 'ACC' . strtoupper(uniqid())),
                Select::make('account_type')
                    ->required()
                    ->options([
                        'fiat' => 'Fiat',
                        'crypto' => 'Crypto',
                    ])
                    ->default('fiat'),
                Select::make('currency')
                    ->required()
                    ->options([
                        'USD' => 'USD - US Dollar',
                        'EUR' => 'EUR - Euro',
                        'GBP' => 'GBP - British Pound',
                        'JPY' => 'JPY - Japanese Yen',
                        'BTC' => 'BTC - Bitcoin',
                        'ETH' => 'ETH - Ethereum',
                        'SOL' => 'SOL - Solana',
                        'USDT' => 'USDT - Tether',
                    ])
                    ->searchable()
                    ->default('USD'),
                TextInput::make('balance')
->disabled()
                    ->dehydrated(false)
                    ->formatStateUsing(function ($record) {
                    if (! $record) {
                    return 0;
                    }
                    
                    if ($record->account_type === 'fiat') {
                    $totalUsd = 0;
                    foreach ($record->balances as $balance) {
                    $rate = \App\Models\ExchangeRate::getRateBidirectional($balance->currency, 'USD');
                    if ($rate !== null) {
                    $totalUsd += $balance->balance * $rate;
                    }
                    }
                    return number_format($totalUsd, 2);
                    }
                    
                    if ($record->account_type === 'crypto') {
                    $totalUsdt = 0;
                    foreach ($record->balances as $balance) {
                    $rate = \App\Models\ExchangeRate::getRateBidirectional($balance->currency, 'USDT');
                    if ($rate !== null) {
                    $totalUsdt += $balance->balance * $rate;
                    }
                    }
                    return number_format($totalUsdt, 2);
                    }
                    
                    return $record->balance;
                    })
                    ->default(0)
->prefix(fn ($record) => match ($record?->account_type) {
                    'fiat' => 'USD',
                    'crypto' => 'USDT',
                    default => $record?->currency ?? '$',
                    }),
                Toggle::make('is_active')
                    ->default(true)
                    ->required(),
            ]);
    }
}
