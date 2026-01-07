import React, { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import SEOHead from '@/Components/SEOHead';

export default function Transfer({ userAccounts, allAccounts, currencies }) {
    const { auth } = usePage().props;
    const queryParams = new URLSearchParams(window.location.search);
    const fromAccountIdParam = queryParams.get('from_account');

    const { data, setData, post, processing, errors, reset } = useForm({
        from_account_id: fromAccountIdParam || '',
        to_account_id: '',
        amount: '',
    });

    const [selectedFromAccount, setSelectedFromAccount] = useState(null);
    const [selectedToAccount, setSelectedToAccount] = useState(null);
    const [convertedAmount, setConvertedAmount] = useState(null);

    const fromAccounts = auth?.user?.is_admin ? allAccounts : userAccounts;

    useEffect(() => {
        if (data.from_account_id) {
            const account = fromAccounts.find(acc => acc.id == data.from_account_id);
            setSelectedFromAccount(account ?? null);
        } else {
            setSelectedFromAccount(null);
        }
    }, [data.from_account_id, fromAccounts]);

    useEffect(() => {
        if (data.to_account_id) {
            const account = allAccounts.find(acc => acc.id == data.to_account_id);
            setSelectedToAccount(account);
        }
    }, [data.to_account_id]);

    // Calculate converted amount if currencies differ
    useEffect(() => {
        if (selectedFromAccount && selectedToAccount && data.amount) {
            if (selectedFromAccount.currency === selectedToAccount.currency) {
                setConvertedAmount(parseFloat(data.amount));
            } else {
                // This is approximate; actual conversion happens on server
                // For demo, we'll show a placeholder
                setConvertedAmount(null);
            }
        } else {
            setConvertedAmount(null);
        }
    }, [selectedFromAccount, selectedToAccount, data.amount]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/transfer', {
            onSuccess: () => {
                reset();
                setSelectedFromAccount(null);
                setSelectedToAccount(null);
                setConvertedAmount(null);
            },
        });
    };

    const availableBalance = selectedFromAccount ? parseFloat(selectedFromAccount.balance) : 0;
    const isInsufficientFunds = selectedFromAccount && data.amount && parseFloat(data.amount) > availableBalance;
    const needsConversion = selectedFromAccount && selectedToAccount && selectedFromAccount.currency !== selectedToAccount.currency;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "FinancialService",
        "name": "BBinance Money Transfer",
        "description": "Instant multi-currency money transfers with real-time exchange rates",
        "provider": {
            "@type": "FinancialService",
            "name": "BBinance",
            "url": window.location.origin
        },
        "areaServed": "Worldwide",
        "serviceType": "MoneyTransfer"
    };

    return (
        <AppLayout>
            <SEOHead
                title="Transfer Money Instantly | Multi-Currency Support | HSBC"
                description="Transfer money between accounts instantly with HSBC. Multi-currency support, real-time exchange rates, and bank-grade security. No hidden fees."
                keywords="money transfer, instant transfer, multi-currency, exchange rates, bank transfer"
                structuredData={structuredData}
            />

            <div className="px-4 sm:px-0">
                {/* Header Section */}
                <div className="mb-12">
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
                        ✓ Secure & Instant
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-3">Move Money Instantly</h1>
                    <p className="text-lg text-gray-600 max-w-2xl">
                        Transfer funds between accounts with bank-grade security. Multi-currency support with real-time exchange rates.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Transfer Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* From Account Section */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                            1
                                        </div>
                                        <label className="text-lg font-semibold text-gray-900">
                                            Select Source Account
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={data.from_account_id}
                                            onChange={e => setData('from_account_id', e.target.value)}
                                            className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all appearance-none"
                                            required
                                        >
                                            <option value="">Choose an account...</option>
                                            {fromAccounts.map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.account_number} • {account.user?.name ?? 'Account'} • {account.balance} {account.currency}
                                                </option>
                                            ))}
                                        </select>
                                        <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    </div>
                                    {selectedFromAccount && (
                                        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                                            <p className="text-sm text-gray-600 mb-2">Account Balance</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {parseFloat(selectedFromAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                                <span className="text-lg ml-2 text-gray-600">{selectedFromAccount.currency}</span>
                                            </p>
                                        </div>
                                    )}
                                    {errors.from_account_id && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                                            <span>⚠️</span> {errors.from_account_id}
                                        </p>
                                    )}
                                    {fromAccounts.length === 0 && (
                                        <p className="mt-2 text-sm text-amber-600 flex items-center gap-2">
                                            <span>ℹ️</span> No active accounts. Create one first.
                                        </p>
                                    )}
                                </div>

                                {/* Transfer Divider */}
                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <div className="bg-white px-4 flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                                            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m0 0l4 4m10-4v12m0 0l4-4m0 0l-4-4" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* To Account Section */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                                            2
                                        </div>
                                        <label className="text-lg font-semibold text-gray-900">
                                            Select Destination Account
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={data.to_account_id}
                                            onChange={e => setData('to_account_id', e.target.value)}
                                            className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all appearance-none"
                                            required
                                        >
                                            <option value="">Choose a destination...</option>
                                            {allAccounts
                                                .filter(acc => acc.id != data.from_account_id)
                                                .map(account => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.account_number} • {account.user.name} • {account.currency}
                                                    </option>
                                                ))}
                                        </select>
                                        <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    </div>
                                    {selectedToAccount && (
                                        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                                            <p className="text-sm text-gray-600 mb-1">Recipient</p>
                                            <p className="text-xl font-semibold text-gray-900">{selectedToAccount.user.name}</p>
                                            <p className="text-sm text-gray-600 mt-2">
                                                Account • {selectedToAccount.account_number} • {selectedToAccount.currency}
                                            </p>
                                        </div>
                                    )}
                                    {errors.to_account_id && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                                            <span>⚠️</span> {errors.to_account_id}
                                        </p>
                                    )}
                                </div>

                                {/* Amount Section */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                            3
                                        </div>
                                        <label className="text-lg font-semibold text-gray-900">
                                            Enter Amount
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={data.amount}
                                            onChange={e => setData('amount', e.target.value)}
                                            className={`w-full px-5 py-4 rounded-xl border-2 transition-all text-lg font-semibold ${
                                                isInsufficientFunds
                                                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                                    : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                                            } bg-white`}
                                            placeholder="0.00"
                                            required
                                        />
                                        {selectedFromAccount && (
                                            <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                                                <span className="text-lg font-semibold text-gray-600">
                                                    {selectedFromAccount.currency}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-sm text-gray-600">
                                            Available: <span className="font-semibold text-gray-900">{availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {selectedFromAccount?.currency}</span>
                                        </span>
                                        {data.amount && (
                                            <span className="text-sm text-gray-600">
                                                {((parseFloat(data.amount) / availableBalance) * 100).toFixed(1)}% used
                                            </span>
                                        )}
                                    </div>
                                    {isInsufficientFunds && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                            <span className="text-red-600 text-lg mt-0.5">⚠️</span>
                                            <p className="text-sm text-red-700">
                                                Insufficient funds. You need {(parseFloat(data.amount) - availableBalance).toFixed(2)} more {selectedFromAccount?.currency}.
                                            </p>
                                        </div>
                                    )}
                                    {errors.amount && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                                            <span>⚠️</span> {errors.amount}
                                        </p>
                                    )}
                                </div>

                                {/* Currency Conversion Notice */}
                                {needsConversion && (
                                    <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl mt-1">🔄</span>
                                            <div>
                                                <p className="font-semibold text-amber-900 mb-1">Currency Conversion</p>
                                                <p className="text-sm text-amber-800">
                                                    {selectedFromAccount?.currency} will be converted to {selectedToAccount?.currency} using real-time exchange rates.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {errors.error && (
                                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                                        <p className="text-sm text-red-800 font-medium">⚠️ {errors.error}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-6 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={processing || isInsufficientFunds || !data.from_account_id || !data.to_account_id || !data.amount}
                                        className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-indigo-800 focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-3 text-lg"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Transfer Now
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            reset();
                                            setSelectedFromAccount(null);
                                            setSelectedToAccount(null);
                                        }}
                                        className="px-6 py-4 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 transition-all duration-200"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sticky Summary Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 bg-gradient-to-br from-indigo-50 via-white to-blue-50 rounded-3xl shadow-xl border border-indigo-100 p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Transfer Summary</h3>
                            </div>

                            <div className="space-y-4">
                                {/* From Account */}
                                {selectedFromAccount ? (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">From</p>
                                        <div className="p-4 bg-white rounded-2xl border border-indigo-100">
                                            <p className="font-mono text-sm font-bold text-gray-900">{selectedFromAccount.account_number}</p>
                                            <p className="text-xs text-gray-600 mt-1">{selectedFromAccount.user?.name}</p>
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-600">Balance</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {parseFloat(selectedFromAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })} <span className="text-sm text-gray-600">{selectedFromAccount.currency}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-white/50 rounded-2xl border border-gray-200 text-center">
                                        <p className="text-sm text-gray-500">Select source account</p>
                                    </div>
                                )}

                                {/* To Account */}
                                {selectedToAccount ? (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">To</p>
                                        <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                                            <p className="font-mono text-sm font-bold text-gray-900">{selectedToAccount.account_number}</p>
                                            <p className="text-xs text-gray-600 mt-1">{selectedToAccount.user.name}</p>
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-600">Currency</p>
                                                <p className="text-lg font-bold text-emerald-600">{selectedToAccount.currency}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-white/50 rounded-2xl border border-gray-200 text-center">
                                        <p className="text-sm text-gray-500">Select destination</p>
                                    </div>
                                )}

                                {/* Amount */}
                                {data.amount ? (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Amount</p>
                                        <div className="p-4 bg-white rounded-2xl border border-blue-100">
                                            <p className="text-3xl font-black text-gray-900">
                                                {parseFloat(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">{selectedFromAccount?.currency}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-white/50 rounded-2xl border border-gray-200 text-center">
                                        <p className="text-sm text-gray-500">Enter amount</p>
                                    </div>
                                )}

                                {/* Conversion Status */}
                                {selectedFromAccount && selectedToAccount && (
                                    <div className={`p-3 rounded-xl border-2 ${
                                        selectedFromAccount.currency === selectedToAccount.currency
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-amber-50 border-amber-200'
                                    }`}>
                                        <p className="text-xs font-semibold text-gray-700">
                                            {selectedFromAccount.currency === selectedToAccount.currency ? '✓ Same currency' : '🔄 Conversion required'}
                                        </p>
                                    </div>
                                )}

                                {/* Ready to Submit */}
                                {selectedFromAccount && selectedToAccount && data.amount && !isInsufficientFunds && (
                                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                                        <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                                            <span className="text-lg">✓</span> Ready to transfer
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Security Badge */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    Bank-grade encryption
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
