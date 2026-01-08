<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

Route::get('/debug-schema', function () {
    $columns = Schema::getColumnListing('users');
    return response()->json([
        'columns' => $columns,
        'has_civility' => Schema::hasColumn('users', 'civility'),
        'has_back_path' => Schema::hasColumn('users', 'identity_card_back_path'),
    ]);
});

Route::get('/debug-create-user', function () {
    try {
        $user = User::create([
            'civility' => 'Mr.',
            'name' => 'Debug',
            'surname' => 'User',
            'email' => 'debug-' . time() . '@example.com',
            'country_of_residence' => 'Nowhere',
            'date_of_birth' => '2000-01-01',
            'nationality' => 'Narnian',
            'identity_card_front_path' => 'path/to/front.jpg',
            'identity_card_back_path' => 'path/to/back.jpg',
            'password' => bcrypt('password'),
            'is_admin' => false,
        ]);
        return response()->json(['success' => true, 'user' => $user]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()]);
    }
});
