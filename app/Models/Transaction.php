<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'from_account_id',
        'to_account_id',
        'type',
        'from_currency',
        'to_currency',
        'amount',
        'exchange_rate',
        'converted_amount',
        'status',
        'description',
        'reference_number',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:8',
        'exchange_rate' => 'decimal:8',
        'converted_amount' => 'decimal:8',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($transaction) {
            if (!$transaction->reference_number) {
                $transaction->reference_number = 'TXN' . strtoupper(uniqid());
            }
        });
    }

    public function fromAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'from_account_id');
    }

    public function toAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFormattedAmountAttribute(): string
    {
        $currency = $this->from_currency ?? $this->to_currency ?? 'USD';
        return number_format($this->amount, 2) . ' ' . $currency;
    }
}
