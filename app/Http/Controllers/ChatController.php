<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
// --- USER METHODS ---
    public function index()
    {
        return response()->json(
            Message::where('user_id', Auth::id())
                ->orderBy('created_at', 'asc')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = Message::create([
            'user_id' => Auth::id(),
            'body' => $request->message,
            'is_from_admin' => false,
        ]);

return response()->json($message);
        }
        
        // --- ADMIN METHODS ---
        public function adminConversations()
        {
        if (!Auth::user()->is_admin) {
        return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Get users who have messages, sorted by most recent message
        $users = User::whereHas('messages')
        ->with(['messages' => function($q) {
        $q->latest()->limit(1);
        }])
        ->get()
        ->sortByDesc(function($user) {
        return $user->messages->first()?->created_at;
        })
        ->values();
        
        return response()->json($users);
        }
        
        public function adminMessages($userId)
        {
        if (!Auth::user()->is_admin) {
        return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        return response()->json(
        Message::where('user_id', $userId)
        ->orderBy('created_at', 'asc')
        ->get()
        );
        }
        
        public function adminReply(Request $request, $userId)
        {
        if (!Auth::user()->is_admin) {
        return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $request->validate([
        'message' => 'required|string|max:1000',
        ]);
        
        $message = Message::create([
        'user_id' => $userId,
        'body' => $request->message,
        'is_from_admin' => true,
        ]);
        return response()->json($message);
    }
}
