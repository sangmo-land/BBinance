<?php

namespace App\Filament\Resources\DemoTransactions\Pages;

use App\Filament\Resources\DemoTransactions\DemoTransactionResource;
use Filament\Resources\Pages\CreateRecord;

class CreateDemoTransaction extends CreateRecord
{
    protected static string $resource = DemoTransactionResource::class;
}
