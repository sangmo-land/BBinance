import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ChatWidget({ user }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [hasUnread, setHasUnread] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setHasUnread(false);
        }
    }, [messages, isOpen]);

    useEffect(() => {
        // Initial fetch
        if (user) {
            fetchMessages();
            // Poll for messages every 5 seconds
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchMessages = async () => {
        try {
            const response = await axios.get(route('chat.index'));
            const newMsgs = response.data;
            
            // simple check for new messages
            setMessages(prev => {
                if (prev.length < newMsgs.length && !isOpen) {
                     setHasUnread(true);
                }
                return newMsgs;
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const response = await axios.post(route('chat.store'), {
                message: newMessage
            });
            setMessages([...messages, response.data]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[380px] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden flex flex-col transition-all duration-300 ease-in-out transform origin-bottom-right">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-indigo-700"></div>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Customer Support</h3>
                                <p className="text-blue-100 text-xs text-opacity-80">Online</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 h-[400px] overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-900/50 space-y-4">
                         {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                                     <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Welcome to Support!<br/>How can we help you today?
                                </p>
                            </div>
                         )}

                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex ${!msg.is_from_admin ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`
                                        max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
                                        ${!msg.is_from_admin 
                                            ? 'bg-blue-600 text-white rounded-br-sm' 
                                            : 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-zinc-600 rounded-bl-sm'
                                        }
                                    `}
                                >
                                    <p>{msg.body}</p>
                                    <p className={`text-[10px] mt-1 ${!msg.is_from_admin ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-zinc-800 border-t border-gray-100 dark:border-zinc-700">
                        <form onSubmit={sendMessage} className="relative flex items-center">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                disabled={isLoading}
                                className="w-full pl-4 pr-12 py-3 rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white dark:placeholder-gray-500"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !newMessage.trim()}
                                className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    group flex items-center justify-center w-14 h-14 rounded-full shadow-xl 
                    transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95
                    ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}
                `}
            >
                {isOpen ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {hasUnread && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                )}
            </button>
        </div>
    );
}
