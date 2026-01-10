<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\SitemapController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Public SEO endpoints
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap.index');
Route::get('/sitemap-mobile.xml', [SitemapController::class, 'mobile'])->name('sitemap.mobile');
Route::get('/sitemap-index.xml', [SitemapController::class, 'sitemapIndex'])->name('sitemap.index-file');

Route::get('/contacts', function () {
return Inertia::render('Contact');
})->name('contacts');
// Admin Approval Link (Signed)
Route::get('/admin/users/{user}/approve', [\App\Http\Controllers\Admin\UserApprovalController::class, 'approve'])
->middleware('signed')
->name('admin.users.approve-link');
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
// Chat endpoints
    Route::get('/chat/messages', [ChatController::class, 'index'])->name('chat.index');
    Route::post('/chat/messages', [ChatController::class, 'store'])->name('chat.store');
    Route::post('/chat/mark-read', [ChatController::class, 'markRead'])->name('chat.mark-read');

// Chat endpoints (Admin)
    Route::get('/chat/admin/conversations', [ChatController::class,
    'adminConversations'])->name('chat.admin.conversations');
    Route::get('/chat/admin/messages/{userId}', [ChatController::class, 'adminMessages'])->name('chat.admin.messages');
    Route::post('/chat/admin/messages/{userId}', [ChatController::class, 'adminReply'])->name('chat.admin.reply');
    
    Route::get('/accounts/{account}', [\App\Http\Controllers\AccountController::class, 'show'])->name('accounts.show');
    Route::get('/accounts/{account}/crypto/{currency}', [\App\Http\Controllers\AccountController::class, 'showCryptoDetail'])->name('accounts.crypto-detail');
    Route::post('/accounts/{account}/convert-fiat', [\App\Http\Controllers\AccountController::class, 'convertFiat'])->name('accounts.convert-fiat');
    Route::post('/accounts/{account}/convert-to-crypto', [\App\Http\Controllers\AccountController::class, 'convertToCrypto'])->name('accounts.convert-to-crypto');
    Route::post('/accounts/{account}/convert-crypto-action', [\App\Http\Controllers\AccountController::class, 'convertCryptoAction'])->name('accounts.convert-crypto-action');
    Route::post('/accounts/{account}/buy-crypto', [\App\Http\Controllers\AccountController::class, 'buyCrypto'])->name('accounts.buy-crypto');
    Route::post('/accounts/{account}/sell-crypto', [\App\Http\Controllers\AccountController::class, 'sellCrypto'])->name('accounts.sell-crypto');
    Route::post('/accounts/{account}/transfer-crypto', [\App\Http\Controllers\AccountController::class, 'transferCrypto'])->name('accounts.transfer-crypto');
    Route::post('/accounts/{account}/transfer-internal', [\App\Http\Controllers\AccountController::class, 'transferInternal'])->name('accounts.transfer-internal');
    Route::post('/accounts/{account}/deposit-fiat-funding', [\App\Http\Controllers\AccountController::class, 'depositFiatToFunding'])->name('accounts.deposit-fiat-funding');
    Route::post('/accounts/{account}/withdraw', [\App\Http\Controllers\AccountController::class, 'withdraw'])->name('accounts.withdraw');

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
