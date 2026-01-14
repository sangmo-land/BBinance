<?php

use App\Models\Account;
use App\Models\AccountBalance;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$accountId = 4;
$currency = 'USDT';

$account = Account::find($accountId);

if (!$account) {
    echo "Account $accountId not found.\n";
    exit;
}

echo "Account found: " . $account->account_number . "\n";

$balances = AccountBalance::where('account_id', $accountId)
    ->where('currency', $currency)
    ->get();

echo "Balances for $currency:\n";
foreach ($balances as $balance) {
    echo "ID: {$balance->id}, Wallet Type: '{$balance->wallet_type}', Balance: {$balance->balance}, Type: {$balance->balance_type}\n";
}

$walletTypeParam = 'spot';
$normalized = ucfirst(strtolower($walletTypeParam));
echo "\nNormalized 'spot': '$normalized'\n";

$queryFiltered = AccountBalance::where('account_id', $accountId)
    ->where('currency', $currency)
    ->where('wallet_type', $normalized)
    ->get();

echo "Filtered with '$normalized': Count: " . $queryFiltered->count() . "\n";

// Check case sensitivity issues by trying 'spot' lowercase
$queryFilteredLower = AccountBalance::where('account_id', $accountId)
    ->where('currency', $currency)
    ->where('wallet_type', 'spot')
    ->get();

echo "Filtered with 'spot': Count: " . $queryFilteredLower->count() . "\n";
