<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $admin = User::where('is_admin', true)->first(['email', 'phone']);
        
        $unreadMessages = [];
        if ($request->user()) {
            $unreadMessages = \App\Models\Message::where('user_id', $request->user()->id)
                ->where('is_from_admin', true)
                ->whereNull('read_at')
                ->latest()
                ->get();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'unreadMessages' => $unreadMessages,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'), // Or 'errors' bag if using validate()
            ],
            'adminContact' => [
                'email' => $admin?->email ?? 'support@bbinance.com',
                'phone' => $admin?->phone ?? '+1 (555) 123-4567',
            ],
        ];
    }
}
