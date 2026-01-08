<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\UserApprovedNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Request;

class UserApprovalController extends Controller
{
    public function approve(Request $request, User $user)
    {
        if (!$request->hasValidSignature()) {
            abort(403, 'Invalid or expired signature.');
        }

        if ($user->is_approved) {
            return "User is already approved.";
        }

        $user->update(['is_approved' => true]);

        // Send approval email
        try {
            Mail::to($user)->send(new UserApprovedNotification($user));
        } catch (\Exception $e) {
            // log error
        }

        return "User {$user->name} has been approved successfully. You can close this window.";
    }
}
