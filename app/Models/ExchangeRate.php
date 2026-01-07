<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    protected $fillable = [
        'from_currency',
        'to_currency',
        'rate',
        'is_active',
    ];

    protected $casts = [
        'rate' => 'decimal:8',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (ExchangeRate $rate) {
            // Normalize currency codes to uppercase
            $from = strtoupper($rate->from_currency);
            $to = strtoupper($rate->to_currency);

            // Prevent same-currency pairs; force rate to 1 and mark active
            if ($from === $to) {
                $rate->from_currency = $from;
                $rate->to_currency = $to;
                $rate->rate = 1.0;
                $rate->is_active = true;
                return;
            }

            // Canonicalize so that from_currency < to_currency lexicographically
            if ($from > $to) {
                // Swap and invert the rate to keep canonical order
                $rate->from_currency = $to;
                $rate->to_currency = $from;
                $rate->rate = 1 / (float) $rate->rate;
            } else {
                $rate->from_currency = $from;
                $rate->to_currency = $to;
            }
        });
    }

    /**
     * Scope to get active rates only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get rate for specific currency pair
     */
    public static function getRate(string $fromCurrency, string $toCurrency): ?float
    {
        $rate = static::active()
            ->where('from_currency', $fromCurrency)
            ->where('to_currency', $toCurrency)
            ->first();

        return $rate ? (float) $rate->rate : null;
    }

    /**
     * Get rate for a pair in either direction, inverting if needed.
     */
    public static function getRateBidirectional(string $fromCurrency, string $toCurrency): ?float
    {
        $from = strtoupper($fromCurrency);
        $to = strtoupper($toCurrency);

        if ($from === $to) {
            return 1.0;
        }

        // Try direct
        $direct = static::getRate($from, $to);
        if ($direct !== null) {
            return $direct;
        }

        // Try inverse and invert
        $inverse = static::getRate($to, $from);
        if ($inverse !== null) {
            return 1 / $inverse;
        }

        return null;
    }
}
