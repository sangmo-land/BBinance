<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Hash;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
Section::make('Personal Information')
->schema([
Select::make('civility')
->options([
'Mr.' => 'Mr.',
'Mrs.' => 'Mrs.',
'Ms.' => 'Ms.',
'Dr.' => 'Dr.',
'Prof.' => 'Prof.',
]),
TextInput::make('name')
->required()
->maxLength(255),
TextInput::make('surname')
->maxLength(255),
TextInput::make('phone')
->tel()
->maxLength(20),
TextInput::make('spoken_language')
->maxLength(255),
TextInput::make('profession')
->maxLength(255),
DatePicker::make('date_of_birth'),
TextInput::make('nationality'),
TextInput::make('country_of_residence'),
])->columns(2),

Section::make('Account Details')
->schema([
TextInput::make('email')
->email()
->required()
->maxLength(255),
TextInput::make('password')
->password()
->autocomplete('new-password')
->dehydrateStateUsing(fn ($state) => Hash::make($state))
->dehydrated(fn ($state) => filled($state))
->required(fn (string $context): bool => $context === 'create'),
Toggle::make('is_admin')
->label('Admin')
->required(),
Toggle::make('is_approved')
->label('Approved')
->default(false)
->required(),
]),
Section::make('Identity Verification')
->schema([
FileUpload::make('identity_card_front_path')
->label('Identity Card Front')
->image()
->disk('public')
->directory('identity_cards')
->visibility('public')
->openable()
->downloadable(),
FileUpload::make('identity_card_back_path')
->label('Identity Card Back')
->image()
->disk('public')
->directory('identity_cards')
->visibility('public')
->openable()
->downloadable(),
])->columns(2),
            ]);
    }
}

