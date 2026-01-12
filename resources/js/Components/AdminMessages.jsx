import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";

export default function AdminMessages({ messages }) {
    const [visibleMessages, setVisibleMessages] = useState([]);
    const [minimizedIds, setMinimizedIds] = useState(new Set());

    useEffect(() => {
        if (messages && messages.length > 0) {
            setVisibleMessages(messages);
        } else {
            setVisibleMessages([]);
        }
    }, [messages]);

    const handleDismiss = (id) => {
        // Optimistically remove from UI
        // setVisibleMessages(prev => prev.filter(m => m.id !== id));
        
        // Mark as read in backend
        router.post(route('messages.read', id), {}, {
            preserveScroll: true,
            // preserveState: true, // Let state refresh from props
        });
    };

    const toggleMinimize = (id) => {
        const newSet = new Set(minimizedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setMinimizedIds(newSet);
    };

    if (!visibleMessages || visibleMessages.length === 0) return null;

    return (
        <div className="fixed top-32 right-4 z-50 flex flex-col gap-3 w-80 max-w-[90vw]">
            {visibleMessages.map((msg) => {
                const isMinimized = minimizedIds.has(msg.id);
                return (
                    <div 
                        key={msg.id}
                        className={`bg-white rounded-lg shadow-xl border-l-4 border-blue-500 overflow-hidden transform transition-all duration-300 ease-in-out ${isMinimized ? 'opacity-90' : 'hover:scale-102'}`}
                    >
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Admin Message
                                </h3>
                                <button 
                                    onClick={() => toggleMinimize(msg.id)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                    title={isMinimized ? "Expand" : "Minimize"}
                                >
                                    {isMinimized ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            
                            {!isMinimized && (
                                <div className="animate-fade-in-down">
                                    <p className="text-sm text-gray-600 mb-3 leading-relaxed whitespace-pre-wrap">
                                        {msg.body}
                                    </p>
                                    <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-2 border-gray-100">
                                        <span>{new Date(msg.created_at).toLocaleString()}</span>
                                        <button 
                                            onClick={() => handleDismiss(msg.id)}
                                            className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                                        >
                                            Mark as Read
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
