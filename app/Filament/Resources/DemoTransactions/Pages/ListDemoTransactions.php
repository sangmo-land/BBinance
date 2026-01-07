<?php

namespace App\Filament\Resources\DemoTransactions\Pages;

use App\Filament\Resources\DemoTransactions\DemoTransactionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListDemoTransactions extends ListRecords
{
    protected static string $resource = DemoTransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
