<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::first();
echo "User ID: " . $user->id . "\n";
$fiatAccount = $user->fiatAccount;
if ($fiatAccount) {
    // Seed test data
    $fiatAccount->balances()->updateOrCreate(
        ['currency' => 'USD', 'balance_type' => 'available'],
        ['balance' => 1000]
    );
    $fiatAccount->balances()->updateOrCreate(
        ['currency' => 'USD', 'balance_type' => 'withdrawable'],
        ['balance' => 500]
    );

    echo "seeded.\n";

    echo "Fiat Account ID: " . $fiatAccount->id . "\n";
    echo "Fiat Account Main Balance: " . $fiatAccount->balance . " " . $fiatAccount->currency . "\n";
    $balances = $fiatAccount->balances()->get(); // Force reload
    foreach ($balances as $b) {
        echo "ID: {$b->id} | Wallet: {$b->wallet_type} | Cur: {$b->currency} | Type: {$b->balance_type} | Bal: {$b->balance}\n";
    }

    $map = $fiatAccount->balances->where('balance_type', 'available')->mapWithKeys(fn($b) => [$b->currency => $b->balance]);
    echo "Map Result (Frontend view):\n";
    print_r($map->toArray());
} else {
    echo "No Fiat Account.\n";
}
