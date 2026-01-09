<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks to truncate tables
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Transaction::truncate();
        Account::truncate();
        User::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create admin user
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'sangmo@mail.com',
            'password' => Hash::make('password'),
            'is_admin' => true,
        ]);

        // Create demo users
        // Note: User::created event listener in User model creates default accounts (Fiat USD, Crypto USDT)
        
        $john = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('password'),
        ]);

        // John's Default Accounts are created by User Observer/boot method
        // We refresh relations to ensure we have the created accounts
        $john->refresh();
        $johnFiat = $john->fiatAccount;
        if($johnFiat) $johnFiat->update(['balance' => 5000.00]);
        
        $johnCrypto = $john->cryptoAccount;
        if($johnCrypto) $johnCrypto->update(['currency' => 'BTC', 'balance' => 0.5]);


        $jane = User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => Hash::make('password'),
        ]);
        
        $jane->refresh();
        $janeFiat = $jane->fiatAccount;
        if($janeFiat) $janeFiat->update(['balance' => 10000.00]);
        
        $janeCrypto = $jane->cryptoAccount;
        if($janeCrypto) $janeCrypto->update(['currency' => 'ETH', 'balance' => 5.0]);


        $alice = User::create([
            'name' => 'Alice Johnson',
            'email' => 'alice@example.com',
            'password' => Hash::make('password'),
        ]);

        $alice->refresh();
        $aliceFiat = $alice->fiatAccount;
        if($aliceFiat) $aliceFiat->update(['balance' => 2500.00]);
        // Alice keeps USDT default

        // Create some transactions
        if ($johnFiat) {
            Transaction::create([
                'to_account_id' => $johnFiat->id,
                'type' => 'admin_credit',
                'to_currency' => 'USD',
                'amount' => 5000.00,
                'status' => 'completed',
                'description' => 'Initial account funding',
                'created_by' => $admin->id,
            ]);
        }

        if ($johnFiat && $janeFiat) {
            Transaction::create([
                'from_account_id' => $johnFiat->id,
                'to_account_id' => $janeFiat->id,
                'type' => 'transfer',
                'from_currency' => 'USD',
                'to_currency' => 'USD',
                'amount' => 100.00,
                'exchange_rate' => 1.0,
                'status' => 'completed',
                'description' => 'Payment for dinner',
                'created_by' => $john->id,
            ]);
        }

        if ($johnCrypto && $janeCrypto) {
            Transaction::create([
                'from_account_id' => $johnCrypto->id,
                'to_account_id' => $janeCrypto->id,
                'type' => 'transfer',
                'from_currency' => 'BTC', // BTC
                'to_currency' => 'ETH', // ETH
                'amount' => 0.01,
                'exchange_rate' => 15.5, // 1 BTC = 15.5 ETH (Example rate)
                'status' => 'completed',
                'description' => 'Crypto transfer',
                'created_by' => $john->id,
            ]);
        }
    }
}
