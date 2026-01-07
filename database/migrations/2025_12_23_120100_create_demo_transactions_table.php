<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('demo_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('demo_accounts')->cascadeOnDelete();
            $table->foreignId('related_account_id')->nullable()->constrained('demo_accounts')->nullOnDelete();
            $table->string('type'); // transfer_in, transfer_out, admin_credit, admin_debit, conversion
            $table->string('currency', 10);
            $table->decimal('amount', 18, 2);
            $table->json('metadata')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_transactions');
    }
};
