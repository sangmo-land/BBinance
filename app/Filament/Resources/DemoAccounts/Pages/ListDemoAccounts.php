<?php

namespace App\Filament\Resources\DemoAccounts\Pages;

use App\Filament\Resources\DemoAccounts\DemoAccountResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListDemoAccounts extends ListRecords
{
    protected static string $resource = DemoAccountResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
