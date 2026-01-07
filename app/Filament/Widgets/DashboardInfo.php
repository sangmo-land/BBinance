<?php

namespace App\Filament\Widgets;

use Filament\Widgets\Widget;

class DashboardInfo extends Widget
{
protected static ?int $sort = 1;
    protected static ?string $pollingInterval = null;

    protected int | string | array $columnSpan = 'full';

    public function render(): \Illuminate\Contracts\View\View
    {
        return view('filament.widgets.dashboard-info');
    }
}
