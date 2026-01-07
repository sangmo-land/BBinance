<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DemoAccount extends Model
{
    use HasFactory;

    protected $table = 'demo_accounts';

    protected $fillable = [
        'account_number',
        'user_name',
        'currency',
        'balance',
    ];

    public function transactions()
    {
        return $this->hasMany(DemoTransaction::class, 'account_id');
    }
}
