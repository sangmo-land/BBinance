<?php

use App\Models\User;
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
        $users = User::all();
        
        foreach ($users as $user) {
            // Ensure Fiat Account
            $fiat = $user->accounts()->where('account_type', 'fiat')->first();
           
            // Check for legacy 'standard' account and convert to 'fiat'
            if (!$fiat) {
                 $standard = $user->accounts()->where('account_type', 'standard')->first();
                 if ($standard) {
                     $standard->update(['account_type' => 'fiat']);
                 } else {
                     $user->accounts()->create([
                        'account_type' => 'fiat',
                        'currency' => 'USD',
                        'balance' => 0,
                     ]);
                 }
            }

            // Ensure Crypto Account
            $crypto = $user->accounts()->where('account_type', 'crypto')->first();
            if (!$crypto) {
                 $user->accounts()->create([
                    'account_type' => 'crypto',
                    'currency' => 'USDT',
                    'balance' => 0,
                 ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
