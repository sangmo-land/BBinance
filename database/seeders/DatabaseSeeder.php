<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DemoAccount;
use App\Models\DemoTransaction;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $accounts = [
            ['account_number' => 'BB-1001', 'user_name' => 'Alice', 'currency' => 'USD', 'balance' => 5000],
            ['account_number' => 'BB-1002', 'user_name' => 'Bob', 'currency' => 'USD', 'balance' => 3200],
            ['account_number' => 'BB-2001', 'user_name' => 'Charlie', 'currency' => 'EUR', 'balance' => 2500],
            ['account_number' => 'BB-3001', 'user_name' => 'Dana', 'currency' => 'BTC', 'balance' => 0.25],
            ['account_number' => 'BB-3002', 'user_name' => 'Evan', 'currency' => 'ETH', 'balance' => 3.5],
        ];

        foreach ($accounts as $data) {
            DemoAccount::query()->updateOrCreate(
                ['account_number' => $data['account_number']],
                $data
            );
        }

        $alice = DemoAccount::where('account_number', 'BB-1001')->first();
        $bob = DemoAccount::where('account_number', 'BB-1002')->first();

        if ($alice && $bob) {
            DemoTransaction::create([
                'account_id' => $alice->id,
                'related_account_id' => $bob->id,
                'type' => 'transfer_out',
                'currency' => 'USD',
                'amount' => 200,
                'description' => 'Initial demo transfer from Alice to Bob',
                'metadata' => ['demo' => true],
            ]);

            DemoTransaction::create([
                'account_id' => $bob->id,
                'related_account_id' => $alice->id,
                'type' => 'transfer_in',
                'currency' => 'USD',
                'amount' => 200,
                'description' => 'Initial demo transfer received from Alice',
                'metadata' => ['demo' => true],
            ]);
        }
        
        $this->call([
            ExchangeRateSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
