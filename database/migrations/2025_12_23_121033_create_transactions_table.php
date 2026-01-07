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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_account_id')->nullable()->constrained('accounts')->onDelete('set null');
            $table->foreignId('to_account_id')->nullable()->constrained('accounts')->onDelete('set null');
            $table->string('type'); // transfer, deposit, withdrawal, conversion, admin_credit
            $table->string('from_currency', 10)->nullable();
            $table->string('to_currency', 10)->nullable();
            $table->decimal('amount', 20, 8);
            $table->decimal('exchange_rate', 20, 8)->nullable();
            $table->decimal('converted_amount', 20, 8)->nullable();
            $table->string('status')->default('completed'); // pending, completed, failed
            $table->text('description')->nullable();
            $table->string('reference_number')->unique();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['from_account_id', 'created_at']);
            $table->index(['to_account_id', 'created_at']);
            $table->index('reference_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
