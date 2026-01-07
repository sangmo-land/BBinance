<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'sangmo@mail.com',
            'password' => Hash::make('password'),
            'is_admin' => true,
        ]);

        // Create demo users
        $john = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('password'),
        ]);

        $jane = User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => Hash::make('password'),
        ]);

        $alice = User::create([
            'name' => 'Alice Johnson',
            'email' => 'alice@example.com',
            'password' => Hash::make('password'),
        ]);

        // Create accounts for John
        $johnUSD = Account::create([
            'user_id' => $john->id,
            'account_type' => 'standard',
            'currency' => 'USD',
            'balance' => 5000.00,
        ]);

        $johnEUR = Account::create([
            'user_id' => $john->id,
            'account_type' => 'savings',
            'currency' => 'EUR',
            'balance' => 3000.00,
        ]);

        $johnBTC = Account::create([
            'user_id' => $john->id,
            'account_type' => 'crypto',
            'currency' => 'BTC',
            'balance' => 0.5,
        ]);

        // Create accounts for Jane
        $janeUSD = Account::create([
            'user_id' => $jane->id,
            'account_type' => 'standard',
            'currency' => 'USD',
            'balance' => 10000.00,
        ]);

        $janeETH = Account::create([
            'user_id' => $jane->id,
            'account_type' => 'crypto',
            'currency' => 'ETH',
            'balance' => 5.0,
        ]);

        // Create accounts for Alice
        $aliceUSD = Account::create([
            'user_id' => $alice->id,
            'account_type' => 'standard',
            'currency' => 'USD',
            'balance' => 2500.00,
        ]);

        $aliceGBP = Account::create([
            'user_id' => $alice->id,
            'account_type' => 'savings',
            'currency' => 'GBP',
            'balance' => 1500.00,
        ]);

        // Create some transactions
        Transaction::create([
            'to_account_id' => $johnUSD->id,
            'type' => 'admin_credit',
            'to_currency' => 'USD',
            'amount' => 5000.00,
            'status' => 'completed',
            'description' => 'Initial account funding',
            'created_by' => $admin->id,
        ]);

        Transaction::create([
            'from_account_id' => $johnUSD->id,
            'to_account_id' => $janeUSD->id,
            'type' => 'transfer',
            'from_currency' => 'USD',
            'to_currency' => 'USD',
            'amount' => 500.00,
            'exchange_rate' => 1.0,
            'converted_amount' => 500.00,
            'status' => 'completed',
            'description' => 'Payment for services',
            'created_by' => $john->id,
            'created_at' => now()->subDays(5),
        ]);

        Transaction::create([
            'from_account_id' => $janeUSD->id,
            'to_account_id' => $aliceUSD->id,
            'type' => 'transfer',
            'from_currency' => 'USD',
            'to_currency' => 'USD',
            'amount' => 1000.00,
            'exchange_rate' => 1.0,
            'converted_amount' => 1000.00,
            'status' => 'completed',
            'description' => 'Monthly rent',
            'created_by' => $jane->id,
            'created_at' => now()->subDays(3),
        ]);

        Transaction::create([
            'from_account_id' => $johnUSD->id,
            'to_account_id' => $johnEUR->id,
            'type' => 'conversion',
            'from_currency' => 'USD',
            'to_currency' => 'EUR',
            'amount' => 1000.00,
            'exchange_rate' => 0.92,
            'converted_amount' => 920.00,
            'status' => 'completed',
            'description' => 'Currency conversion USD to EUR',
            'created_by' => $john->id,
            'created_at' => now()->subDays(2),
        ]);

        $this->command->info('Demo data created successfully!');
        $this->command->info('Login credentials:');
        $this->command->info('Admin: sangmo@mail.com / password');
        $this->command->info('User 1: john@example.com / password');
        $this->command->info('User 2: jane@example.com / password');
        $this->command->info('User 3: alice@example.com / password');
    }
}
