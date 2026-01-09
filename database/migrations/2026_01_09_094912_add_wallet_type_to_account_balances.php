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
        Schema::table('account_balances', function (Blueprint $table) {
            $table->string('wallet_type')->default('spot')->after('account_id'); // spot, funding, earning
            
            // Drop old unique index if exists and add new one
            $table->dropUnique(['account_id', 'currency']);
            $table->unique(['account_id', 'wallet_type', 'currency']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('account_balances', function (Blueprint $table) {
            $table->dropUnique(['account_id', 'wallet_type', 'currency']);
            $table->dropColumn('wallet_type');
            $table->unique(['account_id', 'currency']);
        });
    }
};
