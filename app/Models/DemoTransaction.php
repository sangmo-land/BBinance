<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DemoTransaction extends Model
{
    use HasFactory;

    protected $table = 'demo_transactions';

    protected $fillable = [
        'account_id',
        'related_account_id',
        'type',
        'currency',
        'amount',
        'metadata',
        'description',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function account()
    {
        return $this->belongsTo(DemoAccount::class, 'account_id');
    }

    public function relatedAccount()
    {
        return $this->belongsTo(DemoAccount::class, 'related_account_id');
    }
}
