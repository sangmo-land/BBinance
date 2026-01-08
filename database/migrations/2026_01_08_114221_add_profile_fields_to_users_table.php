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
        Schema::table('users', function (Blueprint $table) {
            $table->string('civility')->after('id')->nullable();
            $table->string('surname')->after('name')->nullable();
            $table->string('country_of_residence')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('nationality')->nullable();
            $table->string('identity_card_front_path')->nullable();
            $table->string('identity_card_back_path')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'civility',
                'surname',
                'country_of_residence',
                'date_of_birth',
                'nationality',
                'identity_card_front_path',
                'identity_card_back_path',
            ]);
        });
    }
};
