<?php

namespace App\Filament\Pages;

use App\Models\Message;
use App\Models\User;
use Filament\Pages\Page;
use Livewire\Attributes\Computed;

class Support extends Page
{
    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-chat-bubble-left-right';
    protected static ?string $navigationLabel = 'Support Chat';
    
    protected string $view = 'filament.pages.support';

    public $selectedUserId = null;
    public $messageBody = '';

    public function mount()
    {
        $firstUser = User::whereHas('messages')->first(); // simpler first check
        if ($firstUser) {
            $this->selectedUserId = $firstUser->id;
        }
    }

    #[Computed]
    public function users()
    {
        return User::whereHas('messages')
            ->with(['messages' => function($q) {
                $q->latest()->limit(1);
            }])
            ->get()
            ->sortByDesc(function($user) {
                return $user->messages->first()?->created_at;
            });
    }

    #[Computed]
    public function selectedMessages()
    {
        if (!$this->selectedUserId) return [];
        
        return Message::where('user_id', $this->selectedUserId)
            ->orderBy('created_at', 'asc')
            ->get();
    }
    
    public function selectUser($userId)
    {
        $this->selectedUserId = $userId;
    }

    public function sendMessage()
    {
        $this->validate([
            'messageBody' => 'required|string',
            'selectedUserId' => 'required|exists:users,id'
        ]);

        Message::create([
            'user_id' => $this->selectedUserId,
            'body' => $this->messageBody,
            'is_from_admin' => true,
        ]);

        $this->messageBody = '';
    }
}
