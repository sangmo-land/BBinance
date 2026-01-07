import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ChatWidget({ user }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [hasUnread, setHasUnread] = useState(false);

    // Admin specific state
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    const isAdmin = !!user?.is_admin;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setHasUnread(false);
        }
    }, [messages, isOpen, selectedUser]);

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
        try {
            const response = await axios.get(route("chat.admin.conversations"));
            const newConvos = response.data;
            setConversations(newConvos);
            // Logic to check for new messages in conversations could go here
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    const fetchMessages = async () => {
        try {
            const url =
                isAdmin && selectedUser
                    ? route("chat.admin.messages", selectedUser.id)
                    : route("chat.index");

            const response = await axios.get(url);
            const newMsgs = response.data;

            setMessages((prev) => {
                // If we have more messages than before, and window is closed, mark unread
                // Note: simplified logic.
                if (
                    prev.length > 0 &&
                    newMsgs.length > prev.length &&
                    !isOpen
                ) {
                    setHasUnread(true);
                }
                return newMsgs;
            });
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const url =
                isAdmin && selectedUser
                    ? route("chat.admin.reply", selectedUser.id)
                    : route("chat.store");

            const response = await axios.post(url, {
                message: newMessage,
            });
            setMessages([...messages, response.data]);
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    // Render Admin Conversation List
    const renderAdminList = () => (
        <div className="flex-1 h-[400px] overflow-y-auto bg-gray-50 dark:bg-zinc-900/50">
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
                            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                {u.name}
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
                <div className="mb-4 w-[350px] sm:w-[380px] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden flex flex-col transition-all duration-300 ease-in-out transform origin-bottom-right">
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
                            <div className="flex-1 h-[400px] overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-900/50 space-y-4">
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
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) =>
                                            setNewMessage(e.target.value)
                                        }
                                        placeholder="Type a message..."
                                        disabled={isLoading}
                                        className="w-full pl-4 pr-12 py-3 rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white dark:placeholder-gray-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            isLoading || !newMessage.trim()
                                        }
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
                        <svg
                            className="w-7 h-7 text-white"
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
