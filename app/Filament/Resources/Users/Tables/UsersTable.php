<?php

namespace App\Filament\Resources\Users\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use App\Mail\UserApprovedNotification;
use Illuminate\Support\Facades\Mail;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
TextColumn::make('spoken_language')
                ->searchable()
                ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('profession')
                ->searchable()
                ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('email')
                    ->searchable()
                    ->sortable(),
                IconColumn::make('is_admin')
                    ->boolean()
                    ->sortable(),
IconColumn::make('is_approved')
->boolean()
->sortable()
->action(function ($record, $column) {
    $name = $column->getName();
    $newValue = ! $record->$name;
    $record->update([
        $name => $newValue,
    ]);

    if ($newValue === true) {
        try {
            Mail::to($record)->send(new UserApprovedNotification($record));
        } catch (\Exception $e) {
            // Log error or notify admin via toast
        }
    }
}),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
