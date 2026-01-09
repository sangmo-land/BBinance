<?php

namespace Database\Seeders;

use App\Models\ExchangeRate;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ExchangeRateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define base rates (all relative to USD = 1.0)
        // Rate = How much of Currency X you get for 1 USD.
        $baseRates = [
            'USD' => 1.0,
            'EUR' => 0.92,
            'GBP' => 0.79,
            'JPY' => 149.50,
            'BTC' => 0.000016, // Bitcoin (~$60k)
            'ETH' => 0.00033,  // Ethereum (~$3k)
            'USDT' => 1.0,     // Tether
            'BNB' => 0.0016,   // BNB (~$600)
            'SOL' => 0.0066,   // Solana (~$150)
            'XRP' => 1.66,     // XRP (~$0.60)
            'USDC' => 1.0,     // USDC
            'ADA' => 2.0,      // Cardano (~$0.50)
            'AVAX' => 0.025,   // Avalanche (~$40)
            'DOGE' => 10.0,    // Dogecoin (~$0.10)
        ];

        // Generate canonical currency pair combinations (store only one direction)
        $currencies = array_keys($baseRates);
        $count = count($currencies);
        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count; $j++) {
                $a = $currencies[$i];
                $b = $currencies[$j];

                // Canonical order: from_currency < to_currency lexicographically
                $from = min($a, $b);
                $to = max($a, $b);

                $rate = $baseRates[$to] / $baseRates[$from];

                ExchangeRate::updateOrCreate(
                    [
                        'from_currency' => $from,
                        'to_currency' => $to,
                    ],
                    [
                        'rate' => $rate,
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
