import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import SEOHead from '@/Components/SEOHead';
import { Head, Link } from '@inertiajs/react';

function formatNumber(value, fractionDigits = 8) {
  const n = Number(value);
  const parsed = Number.isFinite(n) ? n : 0;
  return parsed.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export default function CryptoDetail({ account, currency, balances, rateToUsd, walletType }) {
    // Calculate total balance across all types (available, locked, etc) for this currency
    const totalBalance = balances.reduce((sum, b) => sum + Number(b.balance), 0);
    const usdEquivalent = totalBalance * (rateToUsd || 0);

    return (
        <AppLayout>
            <SEOHead
                title={`${currency} Details - ${account.account_number}`}
                description={`View detailed ${currency} balance information.`}
            />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6 md:p-10">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm ring-2 ring-white shadow-sm">
                                        {currency.substring(0, 3)}
                                    </div>
                                    {currency} Details
                                </h1>
                                <p className="text-lg text-gray-500 mt-1 ml-13 capitalize">{walletType || 'Spot'} Wallet • {account.account_number}</p>
                            </div>
                            <Link 
                                href={route('accounts.show', account.id)} 
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-bold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                            >
                                &larr; Back to Wallet
                            </Link>
                        </div>

                        {/* Hero Card */}
                        <div className="mb-8 p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl text-white relative overflow-hidden ring-1 ring-gray-700">
                             <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl"></div>
                             <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl"></div>

                             <div className="relative z-10">
                                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mb-4">Total Balance</h2>
                                <div className="flex flex-col md:flex-row items-baseline gap-4">
                                     <span className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                                       {formatNumber(totalBalance, 8)}
                                     </span>
                                     <span className="text-2xl font-bold text-indigo-400">{currency}</span>
                                </div>
                                
                                <div className="mt-6 flex items-center gap-3">
                                   <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-inner flex items-center gap-2">
                                       <span className="text-gray-400 font-medium">≈</span>
                                       <span className="text-xl font-bold text-white">${formatNumber(usdEquivalent, 2)}</span>
                                       <span className="text-xs font-bold text-gray-400 uppercase">USD</span>
                                   </div>
                                   <div className="text-xs text-gray-500 font-medium">
                                       1 {currency} ≈ ${formatNumber(rateToUsd, 2)} USD
                                   </div>
                                </div>
                             </div>
                        </div>

                        {/* Breakdown Grid */}
                        <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Balance Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {balances.map((balance, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2 rounded-lg ${
                                            balance.balance_type === 'available' ? 'bg-green-100 text-green-600' :
                                            balance.balance_type === 'locked' ? 'bg-red-100 text-red-600' :
                                            'bg-yellow-100 text-yellow-600'
                                        }`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h4 className="font-bold text-gray-600 capitalize">{balance.balance_type || 'Available'}</h4>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{formatNumber(balance.balance, 8)}</p>
                                    <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">{currency}</p>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
