<?php

use App\Models\Transaction;
use App\Models\Account;
use App\Models\AccountBalance;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Debugging Last Transfer Transaction ---\n";

// Get last 'transfer' transaction
$txn = Transaction::where('type', 'transfer')->orderBy('created_at', 'desc')->first();

if (!$txn) {
    echo "No 'transfer' transactions found.\n";
    exit;
}

echo "Transaction ID: {$txn->id}\n";
echo "Reference: {$txn->reference_number}\n";
echo "Description: {$txn->description}\n";
echo "Amount: {$txn->amount} {$txn->from_currency}\n";
echo "Status: {$txn->status}\n";
echo "Account ID: {$txn->from_account_id}\n";

$account = Account::find($txn->from_account_id);
if (!$account) {
    echo "Account not found!\n";
    exit;
}

echo "Account Type: {$account->account_type}\n";

echo "\n--- Account Balances ---\n";
$balances = AccountBalance::where('account_id', $account->id)->get();

foreach ($balances as $b) {
    echo "Wallet: '{$b->wallet_type}' | Currency: {$b->currency} | Type: '{$b->balance_type}' | Balance: {$b->balance}\n";
}

echo "\n--- REGEX Check ---\n";
if (preg_match('/from (\w+) to (\w+)/', $txn->description, $matches)) {
    echo "Matched: From '{$matches[1]}' To '{$matches[2]}'\n";
    echo "From Lower: " . strtolower($matches[1]) . "\n";
    echo "To Lower: " . strtolower($matches[2]) . "\n";
} else {
    echo "REGEX FAILED to match description!\n";
}
