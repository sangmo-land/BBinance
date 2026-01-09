<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Account;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

public function canAccessPanel(Panel $panel): bool
    {
    return (bool) $this->is_admin;
    }
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
'civility',
        'name',
'spoken_language',
        'profession',
        'surname',
        'phone',
        'email',
'country_of_residence',
'date_of_birth',
'nationality',
'identity_card_front_path',
'identity_card_back_path',
        'password',
'is_admin',
'is_approved',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
'is_admin' => 'boolean',
'is_approved' => 'boolean',
        ];
    }
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::created(function ($user) {
            $user->accounts()->create([
                'account_type' => 'fiat',
                'currency' => 'USD',
                'balance' => 0,
            ]);

            $user->accounts()->create([
                'account_type' => 'crypto',
                'currency' => 'USDT',
                'balance' => 0,
            ]);
        });
    }

    public function accounts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Account::class);
    }

    public function fiatAccount(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Account::class)->where('account_type', 'fiat');
    }

    public function cryptoAccount(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Account::class)->where('account_type', 'crypto');
    }
}
