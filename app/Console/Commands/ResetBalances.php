<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Transaction;

class ResetBalances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bbinance:reset-balances {--force : Force the operation to run without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset all user balances and currencies to zero and clear transactions.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (! $this->option('force') && ! $this->confirm('Are you sure you want to reset all balances and clear transactions? This cannot be undone.')) {
            $this->info('Operation cancelled.');
            return;
        }

        $this->info('Starting reset...');

        try {
            DB::beginTransaction();

            // 1. Reset Account Balances
            $updatedBalances = AccountBalance::query()->update(['balance' => 0]);
            $this->info("Reset {$updatedBalances} entries in AccountBalance table.");

            // 2. Reset Main Account Balances
            $updatedAccounts = Account::query()->update(['balance' => 0]);
            $this->info("Reset {$updatedAccounts} entries in Accounts table.");

            // 3. Clear Transactions
            // Use delete() to ensure transaction safety (truncate commits implicitly in MySQL)
            Transaction::query()->delete();
            
            $this->info("Transactions table cleared.");

            DB::commit();
            $this->info('All balances reset to zero and transactions cleared successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('An error occurred: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
