<?php

namespace App\Filament\Resources\DemoAccounts\Pages;

use App\Filament\Resources\DemoAccounts\DemoAccountResource;
use Filament\Resources\Pages\CreateRecord;

class CreateDemoAccount extends CreateRecord
{
    protected static string $resource = DemoAccountResource::class;
}
