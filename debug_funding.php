<?php
use App\Models\Account;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$accountId = 4;
$account = Account::find($accountId);

if (!$account) {
    echo "Account $accountId not found\n";
    exit;
}

echo "Account ID: " . $account->id . "\n";
echo "Account Number: " . $account->account_number . "\n";
echo "Type: " . $account->account_type . "\n";

$balances = $account->balances;
echo "Total Balances Count: " . $balances->count() . "\n";

foreach ($balances as $b) {
    echo "Wallet: {$b->wallet_type}, Currency: {$b->currency}, Balance: {$b->balance}, Type: {$b->balance_type}\n";
}

$funding = $account->balances()
    ->where('wallet_type', 'funding')
    ->whereIn('currency', ['USD', 'EUR'])
    ->get()
    ->pluck('balance', 'currency');

echo "\nDebug Funding Fetch:\n";
print_r($funding->toArray());
