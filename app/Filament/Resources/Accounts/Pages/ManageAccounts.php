<?php

namespace App\Filament\Resources\Accounts\Pages;

use App\Filament\Resources\Accounts\AccountResource;
use Filament\Resources\Pages\CreateRecord;

class ManageAccounts extends CreateRecord
{
    protected static string $resource = AccountResource::class;
}
