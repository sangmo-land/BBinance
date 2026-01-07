<?php

namespace Database\Seeders;

use App\Models\ExchangeRate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExchangeRateCanonicalizeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Wrap in transaction for consistency
        DB::transaction(function () {
            $rates = ExchangeRate::query()->get();

            foreach ($rates as $rate) {
                $from = strtoupper($rate->from_currency);
                $to = strtoupper($rate->to_currency);

                if ($from === $to) {
                    // Normalize same-currency to canonical and continue
                    $rate->from_currency = $from;
                    $rate->to_currency = $to;
                    $rate->rate = 1.0;
                    $rate->is_active = true;
                    $rate->save();
                    continue;
                }

                // Determine canonical order
                $canonFrom = min($from, $to);
                $canonTo = max($from, $to);

                if ($from !== $canonFrom || $to !== $canonTo) {
                    // This is an inverse record; check if canonical exists
                    $existing = ExchangeRate::query()
                        ->where('from_currency', $canonFrom)
                        ->where('to_currency', $canonTo)
                        ->first();

                    if ($existing) {
                        // Canonical exists; remove inverse
                        $rate->delete();
                    } else {
                        // Convert this record to canonical by swapping and inverting rate
                        $rate->from_currency = $canonFrom;
                        $rate->to_currency = $canonTo;
                        $rate->rate = 1 / (float) $rate->rate;
                        $rate->save();
                    }
                } else {
                    // Already canonical; ensure uppercase normalization
                    $rate->from_currency = $canonFrom;
                    $rate->to_currency = $canonTo;
                    $rate->save();
                }
            }
        });
    }
}
