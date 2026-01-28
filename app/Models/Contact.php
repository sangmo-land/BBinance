<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $fillable = [
        'email',
        'phone',
        'office_name',
        'street_address',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the active contact information.
     */
    public static function getActive(): ?self
    {
        return static::where('is_active', true)->first();
    }
}
