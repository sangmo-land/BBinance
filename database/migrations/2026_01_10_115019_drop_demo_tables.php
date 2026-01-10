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
        Schema::dropIfExists('demo_transactions');
        Schema::dropIfExists('demo_accounts');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We do not want to recreate them automatically as logic is being removed
    }
};
