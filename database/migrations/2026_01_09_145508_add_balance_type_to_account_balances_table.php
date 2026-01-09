<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Manage Temp Index
        try {
            Schema::table('account_balances', function (Blueprint $table) {
                // Try to drop it if it exists from failed run
                $table->dropIndex('temp_account_id_index');
            });
        } catch (\Exception $e) {}

        Schema::table('account_balances', function (Blueprint $table) {
            $table->index('account_id', 'temp_account_id_index');
        });

        // 2. Add Column and Manage Constraints
        Schema::table('account_balances', function (Blueprint $table) {
            if (!Schema::hasColumn('account_balances', 'balance_type')) {
                $table->string('balance_type')->default('available')->after('currency'); 
            }
            
            try {
                $table->dropUnique(['account_id', 'wallet_type', 'currency']);
            } catch (\Exception $e) {}

            try {
                $table->unique(['account_id', 'wallet_type', 'currency', 'balance_type'], 'balances_unique_idx');
            } catch (\Exception $e) {}
        });
        
        // 3. Cleanup
        Schema::table('account_balances', function (Blueprint $table) {
            $table->dropIndex('temp_account_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('account_balances', function (Blueprint $table) {
             // Revert steps
             $table->index('account_id', 'temp_account_id_index');
        });

        Schema::table('account_balances', function (Blueprint $table) {
             $table->dropUnique(['account_id', 'wallet_type', 'currency', 'balance_type']);
             $table->unique(['account_id', 'wallet_type', 'currency']);
             $table->dropColumn('balance_type');
        });

        Schema::table('account_balances', function (Blueprint $table) {
            $table->dropIndex('temp_account_id_index');
        });
    }
};
