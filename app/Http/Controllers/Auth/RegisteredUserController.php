<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

use Illuminate\Support\Facades\Log;
use App\Mail\RegistrationAckNotification;
use App\Mail\NewUserAdminNotification;
use Illuminate\Support\Facades\Mail;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
Log::info('Registration attempt started', ['email' => $request->email]);

        try {
$request->validate([
'civility' => 'required|string|max:20',
'name' => 'required|string|max:255',
'surname' => 'required|string|max:255',
'phone' => 'required|string|max:20',
'spoken_language' => 'required|string|max:255',
'profession' => 'required|string|max:255',
'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
'country_of_residence' => 'required|string|max:255',
'date_of_birth' => 'required|date',
'nationality' => 'required|string|max:255',
'identity_card_front' => 'required|image|max:5120', // 5MB max
'identity_card_back' => 'required|image|max:5120',
'password' => ['required', 'confirmed', Rules\Password::defaults()],
]);

Log::info('Validation passed');

$identityCardFrontPath = $request->file('identity_card_front')->store('identity_cards', 'public');
$identityCardBackPath = $request->file('identity_card_back')->store('identity_cards', 'public');

Log::info('Files stored', ['front' => $identityCardFrontPath, 'back' => $identityCardBackPath]);
$user = User::create([
'civility' => $request->civility,
'name' => $request->name,
'surname' => $request->surname,
'phone' => $request->phone,
'spoken_language' => $request->spoken_language,
'profession' => $request->profession,
'email' => $request->email,
'country_of_residence' => $request->country_of_residence,
'date_of_birth' => $request->date_of_birth,
'nationality' => $request->nationality,
'identity_card_front_path' => $identityCardFrontPath,
'identity_card_back_path' => $identityCardBackPath,
'password' => Hash::make($request->password),
]);

        Log::info('User created', ['id' => $user->id]);
        event(new Registered($user));

        // Send User Acknowledgement Email
        try {
            Mail::to($user)->send(new RegistrationAckNotification($user));
        } catch (\Exception $e) {
            Log::error('Failed to send registration ack email: ' . $e->getMessage());
        }

        // Send Admin Notification Email
        // Find admins to notify (e.g., all admins or a specific one)
        // For efficiency, we might queue this or just send to all users with is_admin = true
        $admins = User::where('is_admin', true)->get();
        foreach ($admins as $admin) {
            try {
                Mail::to($admin)->send(new NewUserAdminNotification($user));
            } catch (\Exception $e) {
                Log::error('Failed to send admin notification email: ' . $e->getMessage());
            }
        }

        // Auth::login($user);

return redirect(route('login'))->with('status', 'Registration successful! Your account is pending approval by an
administrator.');
} catch (\Exception $e) {
Log::error('Registration failed: ' . $e->getMessage());
Log::error($e->getTraceAsString());
throw $e;
}
    }
}
