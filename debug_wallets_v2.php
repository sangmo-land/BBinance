<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AccountBalance;
use App\Models\Transaction;

echo "--- Account Balances ---\n";
$balances = AccountBalance::all();
foreach ($balances as $b) {
    echo "ID: {$b->id} | Account: {$b->account_id} | Wallet: {$b->wallet_type} | Currency: {$b->currency} | Type: {$b->balance_type} | Balance: {$b->balance}\n";
}

echo "\n--- Recent Transactions ---\n";
$txs = Transaction::latest()->take(5)->get();
foreach ($txs as $tx) {
    echo "ID: {$tx->id} | Type: {$tx->type} | From: {$tx->from_currency} | Amount: {$tx->amount} | Status: {$tx->status} | Desc: {$tx->description}\n";
}
