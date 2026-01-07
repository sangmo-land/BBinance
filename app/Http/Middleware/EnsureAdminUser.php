<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If user is not logged in, let Filament handle it (will show admin login)
        if (!auth()->check()) {
            return $next($request);
        }

        // If user is logged in but not an admin, redirect to admin login
        if (!auth()->user()->is_admin) {
            // Log out the regular user from the web guard
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            return redirect('/admin/login')->with('error', 'You must be an administrator to access this area.');
        }

        return $next($request);
    }
}
