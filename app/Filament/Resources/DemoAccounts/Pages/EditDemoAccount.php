<?php

namespace App\Filament\Resources\DemoAccounts\Pages;

use App\Filament\Resources\DemoAccounts\DemoAccountResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditDemoAccount extends EditRecord
{
    protected static string $resource = DemoAccountResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
