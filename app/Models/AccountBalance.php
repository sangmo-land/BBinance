<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountBalance extends Model
{
    protected $fillable = [
        'account_id',
        'currency',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:12',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
