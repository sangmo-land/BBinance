<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function show(Request $request, \App\Models\Account $account)
    {
        $user = $request->user();

        // Authorization: Ensure user owns the account or is admin
        if ($account->user_id !== $user->id && !$user->is_admin) {
            abort(403);
        }

        $account->load('balances');

        return \Inertia\Inertia::render('AccountDetails', [
            'account' => $account,
        ]);
    }
}
