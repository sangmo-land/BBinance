import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ChatWidget from "@/Components/ChatWidget";

export default function AppLayout({ children }) {
    const { auth } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const currentRoute = usePage().url;
    const userMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const mobileBtnRef = useRef(null);

    // Close user dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target)
            ) {
                setUserMenuOpen(false);
            }
        };

        if (userMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [userMenuOpen]);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target) &&
                mobileBtnRef.current &&
                !mobileBtnRef.current.contains(event.target)
            ) {
                setMobileMenuOpen(false);
            }
        };

        if (mobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [mobileMenuOpen]);

    const isActive = (path) =>
        currentRoute === path || currentRoute.startsWith(path + "/");

    const NavLink = ({ href, children, icon }) => {
        const active = isActive(href);
        return (
            <Link
                href={href}
                className={`
                    group relative inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg
                    transition-all duration-200 ease-in-out
                    ${
                        active
                            ? "text-blue-700 bg-blue-50"
                            : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
                    }
                `}
            >
                {icon && <span className="mr-2">{icon}</span>}
                <span>{children}</span>
                {active && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-blue-700 rounded-full"></span>
                )}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-0">
                        {/* Logo & Brand */}
                        <div className="flex items-center space-x-8">
                            <Link href="/" className="flex items-center group">
                                <div className="relative flex-shrink-0 flex items-center">
                                    {/* Animated background glow */}
                                    <div className="absolute inset-0 bg-blue-400 rounded-lg blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

                                    {/* Logo */}
                                    <div className="relative transform group-hover:scale-105 transition-transform duration-200">
                                        <img
                                            src="/images/logo.png"
                                            className="h-12 w-auto"
                                            alt="Logo"
                                        />
                                    </div>
                                </div>
                            </Link>

                            {/* Desktop Navigation Links */}
                            {auth?.user && (
                                <div className="hidden md:flex md:items-center md:space-x-1">
                                    <NavLink
                                        href={
                                            auth?.user?.is_admin
                                                ? "/admin/dashboard"
                                                : "/dashboard"
                                        }
                                        icon={
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
                                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                                />
                                            </svg>
                                        }
                                    >
                                        Dashboard
                                    </NavLink>
                                    <NavLink
                                        href="/transfer"
                                        icon={
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
                                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                                />
                                            </svg>
                                        }
                                    >
                                        Transfer
                                    </NavLink>
                                </div>
                            )}
                        </div>

                        {/* Right side - User Menu & Mobile Toggle */}
                        <div className="flex items-center space-x-3">
                            {auth?.user ? (
                                <div className="hidden md:flex md:items-center md:space-x-3">
                                    {/* User info with dropdown */}
                                    <div className="relative" ref={userMenuRef}>
                                        <button
                                            onClick={() =>
                                                setUserMenuOpen(!userMenuOpen)
                                            }
                                            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                                    {auth.user.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {auth.user.name}
                                                </span>
                                            </div>
                                            <svg
                                                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                                                    userMenuOpen
                                                        ? "rotate-180"
                                                        : ""
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {userMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none">
                                                <div className="px-4 py-3">
                                                    <p className="text-xs text-gray-500">
                                                        Signed in as
                                                    </p>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {auth.user.email}
                                                    </p>
                                                </div>
                                                <div className="py-1">
                                                    <Link
                                                        href="/logout"
                                                        method="post"
                                                        as="button"
                                                        className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                                                    >
                                                        <svg
                                                            className="mr-3 h-4 w-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                            />
                                                        </svg>
                                                        Sign out
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="hidden md:flex items-center space-x-3">
                                    <Link
                                        href="/login"
                                        className="text-sm font-semibold text-gray-700 hover:text-blue-700 transition-colors duration-200"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
                                    >
                                        Get started
                                    </Link>
                                </div>
                            )}

                            {/* Mobile menu button */}
                            <button
                                ref={mobileBtnRef}
                                type="button"
                                onClick={() =>
                                    setMobileMenuOpen(!mobileMenuOpen)
                                }
                                className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                            >
                                <span className="sr-only">Open main menu</span>
                                {mobileMenuOpen ? (
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div
                        ref={mobileMenuRef}
                        className="md:hidden border-t border-gray-200 bg-white animate-fadeIn"
                    >
                        {auth?.user ? (
                            <>
                                <div className="px-4 pt-2 pb-3 space-y-1">
                                    <Link
                                        href={
                                            isActive("/dashboard") &&
                                            auth?.user?.is_admin
                                                ? "/admin/dashboard"
                                                : "/dashboard"
                                        }
                                        className={`
                                            flex items-center px-3 py-2 rounded-lg text-base font-semibold transition-colors duration-200
                                            ${
                                                isActive("/dashboard")
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                                            }
                                        `}
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                            />
                                        </svg>
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/transfer"
                                        className={`
                                            flex items-center px-3 py-2 rounded-lg text-base font-semibold transition-colors duration-200
                                            ${
                                                isActive("/transfer")
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                                            }
                                        `}
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                            />
                                        </svg>
                                        Transfer
                                    </Link>
                                </div>

                                {/* Mobile User Info */}
                                <div className="pt-4 pb-3 border-t border-gray-200">
                                    <div className="px-4 flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                                            {auth.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-base font-semibold text-gray-900">
                                                {auth.user.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {auth.user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 px-4">
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="flex items-center w-full px-3 py-2 rounded-lg text-base font-semibold text-red-700 hover:bg-red-50 transition-colors duration-200"
                                        >
                                            <svg
                                                className="w-5 h-5 mr-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                />
                                            </svg>
                                            Sign out
                                        </Link>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="px-4 py-3 space-y-1">
                                <Link
                                    href="/login"
                                    className="flex items-center px-3 py-2 rounded-lg text-base font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors duration-200"
                                >
                                    <svg
                                        className="w-5 h-5 mr-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                        />
                                    </svg>
                                    Sign in
                                </Link>
                                <Link
                                    href="/register"
                                    className="flex items-center px-3 py-2 rounded-lg text-base font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors duration-200"
                                >
                                    <svg
                                        className="w-5 h-5 mr-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                        />
                                    </svg>
                                    Get started
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 border-t border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Company Info */}
                        <div className="md:col-span-1">
                            <div className="flex items-center mb-4">
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-md">
                                    <svg
                                        className="h-6 w-6 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                                    </svg>
                                </div>
                                <span className="ml-3 text-xl font-bold text-white">
                                    HSBC
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Secure, reliable digital banking for the modern
                                world.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
                                Quick Links
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="/dashboard"
                                        className="text-sm hover:text-blue-400 transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/transfer"
                                        className="text-sm hover:text-blue-400 transition-colors"
                                    >
                                        Transfer
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
                                Legal
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <a
                                        href="#"
                                        className="text-sm hover:text-blue-400 transition-colors"
                                    >
                                        Privacy Policy
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-sm hover:text-blue-400 transition-colors"
                                    >
                                        Terms of Service
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-sm hover:text-blue-400 transition-colors"
                                    >
                                        Security
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
                                Contact
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-center gap-2">
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
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    support@hsbc.com
                                </li>
                                <li className="flex items-center gap-2">
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
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                    </svg>
                                    1-800-HSBC
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-gray-700">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-gray-500">
                                © 2026 HSBC. All rights reserved.
                            </p>
                            <div className="flex items-center gap-6">
                                <a
                                    href="#"
                                    className="text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                    </svg>
                                </a>
                                <a
                                    href="#"
                                    className="text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                                <a
                                    href="#"
                                    className="text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
            {auth.user && <ChatWidget user={auth.user} />}
        </div>
    );
}
