import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ChatWidget({ user }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const [hasUnread, setHasUnread] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Admin specific state
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const selectedUserRef = useRef(null);

    // Cache helpers
    const CACHE_KEY = `chat_storage_${user?.id}`;

    const getCachedData = (key) => {
        try {
            const store = localStorage.getItem(CACHE_KEY);
            if (store) {
                const parsed = JSON.parse(store);
                // Return cache if it exists and is not expired (optional: add timestamp check)
                return parsed[key];
            }
        } catch (e) {
            console.error("Cache read error", e);
        }
        return null;
    };

    const setCachedData = (key, data) => {
        try {
            const store = localStorage.getItem(CACHE_KEY);
            const parsed = store ? JSON.parse(store) : {};
            parsed[key] = data;
            // Limit to last 100 items if it's a message list to save space
            if (Array.isArray(data) && data.length > 100) {
                parsed[key] = data.slice(-100);
            }
            localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        } catch (e) {
            console.error("Cache write error", e);
        }
    };

    // Keep ref in sync with state for async checks
    useEffect(() => {
        selectedUserRef.current = selectedUser;

        // When user changes, try to load from cache first for instant feedback
        let cacheKey = null;
        if (isAdmin && selectedUser) {
            cacheKey = `msgs_user_${selectedUser.id}`;
        } else if (!isAdmin) {
            cacheKey = "msgs_support";
        }

        if (cacheKey) {
            const cached = getCachedData(cacheKey);
            if (cached && Array.isArray(cached)) {
                setMessages(cached);
            } else {
                setMessages([]);
            }
        } else {
            setMessages([]);
        }
    }, [selectedUser]);

    const isAdmin = !!user?.is_admin;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const markMessagesAsRead = async (targetUserId = null) => {
        try {
            await axios.post(route("chat.mark-read"), {
                user_id: targetUserId,
            });
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            // Don't auto-clear hasUnread here, let the fetch logic handle it based on actual data
        }
    }, [messages, isOpen, selectedUser]);

    // Effect to mark messages as read when viewing them
    useEffect(() => {
        if (!isOpen) return;

        if (!isAdmin) {
            // User mode: Mark all admin messages as read if unread
            const hasUnreadMessages = messages.some(
                (m) => m.is_from_admin && !m.read_at
            );
            if (hasUnreadMessages) {
                markMessagesAsRead();
                // Optimistic update
                setMessages((prev) =>
                    prev.map((m) =>
                        m.is_from_admin
                            ? { ...m, read_at: new Date().toISOString() }
                            : m
                    )
                );
            }
        } else if (isAdmin && selectedUser) {
            // Admin mode: Mark messages from this user as read
            const hasUnreadMessages = messages.some(
                (m) => !m.is_from_admin && !m.read_at
            );
            if (hasUnreadMessages) {
                markMessagesAsRead(selectedUser.id);
                setMessages((prev) =>
                    prev.map((m) =>
                        !m.is_from_admin
                            ? { ...m, read_at: new Date().toISOString() }
                            : m
                    )
                );
            }
        }
    }, [isOpen, selectedUser, messages]);

    useEffect(() => {
        if (!user) return;

        let interval;
        if (isOpen) {
            if (isAdmin && !selectedUser) {
                fetchConversations();
                interval = setInterval(fetchConversations, 5000);
            } else {
                fetchMessages();
                interval = setInterval(fetchMessages, 5000);
            }
        } else {
            // Poll for notifications in background
            const checkFunc = isAdmin ? fetchConversations : fetchMessages;
            checkFunc();
            interval = setInterval(checkFunc, 10000);
        }

        return () => clearInterval(interval);
    }, [user, isOpen, selectedUser, isAdmin]);

    const fetchConversations = async () => {
        // Load cached conversations on first run (optional, but good for UI)
        if (conversations.length === 0) {
            const cachedConvos = getCachedData("conversations");
            if (cachedConvos) setConversations(cachedConvos);
        }

        try {
            const response = await axios.get(route("chat.admin.conversations"));
            const newConvos = response.data;
            setConversations(newConvos);
            setCachedData("conversations", newConvos);

            // Check for any unread messages across all conversations
            if (response.data.some((u) => u.unread_count > 0)) {
                setHasUnread(true);
                // Calculate total unread count for admin
                const totalUnread = response.data.reduce(
                    (acc, curr) => acc + (curr.unread_count || 0),
                    0
                );
                setUnreadCount(totalUnread);
            } else {
                setHasUnread(false);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    const fetchMessages = async () => {
        // Capture the user we are intending to fetch for
        const targetUser = selectedUser;

        try {
            const url =
                isAdmin && targetUser
                    ? route("chat.admin.messages", targetUser.id)
                    : route("chat.index");

            const response = await axios.get(url);

            // Race condition check:
            // If we are admin, ensure the selected user hasn't changed while the request was in flight.
            if (isAdmin) {
                // If currently selected user (in ref) is different from the one we fetched for (targetUser)
                // or if we deselected a user (ref is null) but fetched for one
                if (selectedUserRef.current?.id !== targetUser?.id) {
                    return;
                }
            }

            const newMsgs = response.data;

            // For regular users, check if there are any unread messages from admin
            if (!isAdmin) {
                const unreadMsgs = newMsgs.filter(
                    (m) => m.is_from_admin && !m.read_at
                );
                const hasUnreadMsgs = unreadMsgs.length > 0;
                setHasUnread(hasUnreadMsgs);
                setUnreadCount(unreadMsgs.length);
            }

            setMessages((prev) => {
                // Merge strategies to prevent optimistic messages from flickering
                const serverIds = new Set(newMsgs.map((m) => m.id));
                const localMsgs = prev.filter(
                    (m) => m.isOptimistic && !serverIds.has(m.id)
                );
                return [...newMsgs, ...localMsgs];
            });

            // Update Cache
            let cacheKey = null;
            if (isAdmin && targetUser) {
                cacheKey = `msgs_user_${targetUser.id}`;
            } else if (!isAdmin) {
                cacheKey = "msgs_support";
            }
            if (cacheKey) setCachedData(cacheKey, newMsgs);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        const messageBody = newMessage.trim();
        if (!messageBody) return;

        // Optimistic UI Update
        const tempId = Date.now();
        const optimisticMessage = {
            id: tempId,
            body: messageBody,
            created_at: new Date().toISOString(),
            is_from_admin: isAdmin,
            read_at: null,
            isOptimistic: true, // Mark as local-only initially
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setNewMessage(""); // Clear input immediately

        // Keep focus on input
        setTimeout(() => inputRef.current?.focus(), 0);

        try {
            const url =
                isAdmin && selectedUser
                    ? route("chat.admin.reply", selectedUser.id)
                    : route("chat.store");

            const response = await axios.post(url, {
                message: messageBody,
            });

            // Replace optimistic message with real message from server
            // But KEEP isOptimistic=true until the next poll confirms it to avoid flickering
            // if the poll happens between now and DB commit visibility
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === tempId
                        ? { ...response.data, isOptimistic: true }
                        : msg
                )
            );
        } catch (error) {
            console.error("Error sending message:", error);
            // Rollback optimistic update
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
            setNewMessage(messageBody); // Restore text
        }
    };

    if (!user) return null;

    // Render Admin Conversation List
    const renderAdminList = () => (
        <div className="h-96 overflow-y-auto bg-gray-50 dark:bg-zinc-900/50">
            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                    No active conversations
                </div>
            ) : (
                conversations.map((u) => (
                    <div
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className="p-4 border-b border-gray-100 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-2">
                                {u.name}
                                {u.unread_count > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        {u.unread_count}
                                    </span>
                                )}
                            </span>
                            <span className="text-xs text-gray-400">
                                {u.messages &&
                                    u.messages[0] &&
                                    new Date(
                                        u.messages[0].created_at
                                    ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {u.messages && u.messages[0]
                                ? u.messages[0].body
                                : "No messages"}
                        </p>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[380px] max-h-[80vh] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden flex flex-col transition-all duration-300 ease-in-out transform origin-bottom-right">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            {isAdmin && !selectedUser ? (
                                // Admin List Header
                                <div>
                                    <h3 className="text-white font-bold text-sm">
                                        Support Queue
                                    </h3>
                                    <p className="text-blue-100 text-xs text-opacity-80">
                                        {conversations.length} Active
                                    </p>
                                </div>
                            ) : (
                                // Chat Header (User or Admin inside chat)
                                <>
                                    {isAdmin && (
                                        <button
                                            onClick={() =>
                                                setSelectedUser(null)
                                            }
                                            className="mr-2 text-white/80 hover:text-white"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 19l-7-7 7-7"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                            {isAdmin && selectedUser ? (
                                                <span className="text-white font-bold">
                                                    {selectedUser.name.charAt(
                                                        0
                                                    )}
                                                </span>
                                            ) : (
                                                <svg
                                                    className="w-6 h-6 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-indigo-700"></div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm">
                                            {isAdmin && selectedUser
                                                ? selectedUser.name
                                                : "Customer Support"}
                                        </h3>
                                        <p className="text-blue-100 text-xs text-opacity-80">
                                            {isAdmin ? "Chatting" : "Online"}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Content Switcher */}
                    {isAdmin && !selectedUser ? (
                        renderAdminList()
                    ) : (
                        <>
                            {/* Messages Area */}
                            <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-900/50 space-y-4">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                                            <svg
                                                className="w-8 h-8 text-blue-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {isAdmin ? (
                                                "Start chatting..."
                                            ) : (
                                                <>
                                                    Welcome to Support!
                                                    <br />
                                                    How can we help you today?
                                                </>
                                            )}
                                        </p>
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${
                                            // Logic flip: If admin is viewing, "my" messages (from admin) are BLUE and on RIGHT.
                                            // If user is viewing, "my" messages (from user) are BLUE and on RIGHT.
                                            (isAdmin && msg.is_from_admin) ||
                                            (!isAdmin && !msg.is_from_admin)
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}
                                    >
                                        <div
                                            className={`
                                                max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
                                                ${
                                                    (isAdmin &&
                                                        msg.is_from_admin) ||
                                                    (!isAdmin &&
                                                        !msg.is_from_admin)
                                                        ? "bg-blue-600 text-white rounded-br-sm"
                                                        : "bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-zinc-600 rounded-bl-sm"
                                                }
                                            `}
                                        >
                                            <p>{msg.body}</p>
                                            <p
                                                className={`text-[10px] mt-1 ${
                                                    (isAdmin &&
                                                        msg.is_from_admin) ||
                                                    (!isAdmin &&
                                                        !msg.is_from_admin)
                                                        ? "text-blue-100"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                {new Date(
                                                    msg.created_at
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white dark:bg-zinc-800 border-t border-gray-100 dark:border-zinc-700">
                                <form
                                    onSubmit={sendMessage}
                                    className="relative flex items-center"
                                >
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) =>
                                            setNewMessage(e.target.value)
                                        }
                                        placeholder="Type a message..."
                                        className="w-full pl-4 pr-12 py-3 rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white dark:placeholder-gray-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                            />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    group flex items-center justify-center w-14 h-14 rounded-full shadow-xl 
                    transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95
                    ${
                        isOpen
                            ? "bg-gray-800 rotate-90"
                            : "bg-gradient-to-r from-blue-600 to-indigo-700"
                    }
                `}
            >
                {isOpen ? (
                    <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                ) : (
                    <div className="relative">
                        {/* Always show Chat Bubble as main icon */}
                        <svg
                            className={`w-7 h-7 text-white ${
                                hasUnread ? "animate-pulse" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>

                        {/* Bell Icon Overlay (Small, top right of chat bubble) */}
                        {hasUnread && (
                            <div className="absolute -top-3 -right-3">
                                <div className="relative">
                                    <svg
                                        className="w-5 h-5 text-yellow-400 drop-shadow-md animate-[wiggle_1s_ease-in-out_infinite]"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>

                                    {/* Red Count Badge (Top right of the bell) */}
                                    <span className="absolute -top-2 -right-2 flex items-center justify-center h-4 w-4 bg-red-600 rounded-full text-[9px] font-bold text-white border border-white dark:border-zinc-800 shadow-sm z-10">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </button>
        </div>
    );
}
