<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AccountBalance;

echo "Distinct Wallet Types: " . implode(', ', AccountBalance::distinct()->pluck('wallet_type')->toArray()) . "\n";

$account = App\Models\User::first()->accounts()->first(); // Assuming first account is the crypto account
if ($account) {
    echo "Account Balances for User " . $account->user_id . ":\n";
    foreach ($account->balances as $b) {
        echo "Wallet: {$b->wallet_type}, Currency: {$b->currency}, Type: {$b->balance_type}, Balance: {$b->balance}\n";
    }
}
