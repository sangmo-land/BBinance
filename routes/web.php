<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\SitemapController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Public SEO endpoints
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap.index');
Route::get('/sitemap-mobile.xml', [SitemapController::class, 'mobile'])->name('sitemap.mobile');
Route::get('/sitemap-index.xml', [SitemapController::class, 'sitemapIndex'])->name('sitemap.index-file');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/transfer', [TransferController::class, 'create'])->name('transfer.create');
    Route::post('/transfer', [TransferController::class, 'store'])->name('transfer.store');

    // Ensure Filament admin dashboard explicit path works
    Route::redirect('/admin/dashboard', '/admin');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('transactions/export', [\App\Http\Controllers\Admin\TransactionExportController::class, 'export'])
            ->name('transactions.export');
    });
});

require __DIR__.'/auth.php';
