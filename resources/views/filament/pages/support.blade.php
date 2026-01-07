<x-filament-panels::page>
    <div class="flex h-[calc(100vh-12rem)] overflow-hidden bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        <!-- Sidebar -->
        <div class="w-1/3 min-w-[250px] border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div class="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <h3 class="font-bold text-gray-700 dark:text-gray-200">Conversations</h3>
            </div>
            <div class="flex-1 overflow-y-auto" wire:poll.5s>
                @foreach($this->users as $user)
                    <div 
                        wire:click="selectUser({{ $user->id }})"
                        class="cursor-pointer p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors {{ $selectedUserId === $user->id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : '' }}"
                    >
                        <div class="flex justify-between items-start">
                            <span class="font-semibold text-sm text-gray-800 dark:text-gray-200">{{ $user->name }}</span>
                            <span class="text-xs text-gray-500">{{ $user->messages->first()?->created_at->diffForHumans() }}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1 truncate">{{ $user->messages->first()?->body }}</p>
                    </div>
                @endforeach
                @if($this->users->isEmpty())
                    <div class="p-8 text-center text-gray-400 text-sm">
                        No conversations yet.
                    </div>
                @endif
            </div>
        </div>

        <!-- Chat Area -->
        <div class="flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-950">
            @if($selectedUserId)
                <!-- Header -->
                <div class="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shadow-sm z-10">
                    <div class="flex items-center space-x-3">
                         @php $activeUser = \App\Models\User::find($selectedUserId); @endphp
                         <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                            {{ substr($activeUser->name ?? 'U', 0, 1) }}
                         </div>
                        <div>
                             <h3 class="font-bold text-gray-700 dark:text-gray-200 text-sm">{{ $activeUser->name ?? 'Unknown' }}</h3>
                             <p class="text-xs text-gray-500">{{ $activeUser->email ?? '' }}</p>
                        </div>
                    </div>
                </div>

                <!-- Messages -->
                <div class="flex-1 overflow-y-auto p-4 space-y-4" id="chat-scroll" wire:poll.3s>
                    @foreach($this->selectedMessages as $message)
                        <div class="flex {{ $message->is_from_admin ? 'justify-end' : 'justify-start' }}">
                            <div class="max-w-[70%] rounded-2xl px-4 py-2 shadow-sm text-sm {{ $message->is_from_admin ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-sm' }}">
                                <p>{{ $message->body }}</p>
                                <p class="text-[10px] mt-1 {{ $message->is_from_admin ? 'text-blue-200' : 'text-gray-400' }}">
                                    {{ $message->created_at->format('H:i') }}
                                </p>
                            </div>
                        </div>
                    @endforeach
                    <script>
                        // Auto scroll to bottom
                         function scrollToBottom() {
                             const el = document.getElementById('chat-scroll');
                             if(el) {
                                 el.scrollTop = el.scrollHeight;
                             }
                        }
                        
                        document.addEventListener("livewire:poll", scrollToBottom);
                         // Also on load
                        setTimeout(scrollToBottom, 100);
                        // And on click
                        document.addEventListener('livewire:initialized', () => {
                             Livewire.on('messageSent', scrollToBottom);
                        });
                    </script>
                </div>

                <!-- Input -->
                <div class="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                    <form wire:submit="sendMessage" class="flex gap-2">
                        <input 
                            wire:model="messageBody"
                            type="text" 
                            class="flex-1 rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white px-3 py-2"
                            placeholder="Type a reply..."
                        >
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                            Send
                        </button>
                    </form>
                </div>
            @else
                <div class="flex-1 flex items-center justify-center text-gray-400 flex-col">
                    <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>Select a conversation to start chatting.</p>
                </div>
            @endif
        </div>
    </div>
</x-filament-panels::page>
