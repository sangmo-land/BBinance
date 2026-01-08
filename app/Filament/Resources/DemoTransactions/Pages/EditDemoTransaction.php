<?php

namespace App\Filament\Resources\DemoTransactions\Pages;

use App\Filament\Resources\DemoTransactions\DemoTransactionResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditDemoTransaction extends EditRecord
{
    protected static string $resource = DemoTransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
protected function getRedirectUrl(): string
    {
        return '/admin/demo-transactions';
    }
}
