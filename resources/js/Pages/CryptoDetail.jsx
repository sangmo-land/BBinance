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

                        {/* Action Buttons */}
                        <div className="grid grid-cols-4 gap-y-6 gap-x-2 mb-8 justify-items-center max-w-2xl mx-auto">
                             {[
                                 { name: 'Trade', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'text-amber-500' },
                                 { name: 'Transfer', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'text-blue-500' },
                                 { name: 'Convert', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', color: 'text-purple-500' },
                                 { name: 'Buy', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', color: 'text-green-500' },
                                 { name: 'Sell', icon: 'M20 12H4', color: 'text-red-500' },
                                 { name: 'Earn', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-indigo-500' },
                                 { name: 'Deposit', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3', color: 'text-teal-500' },
                                 { name: 'Withdraw', icon: 'M5 10l7-7m0 0l7 7m-7-7v18', color: 'text-gray-500' },
                             ].map((action) => (
                                 <button
                                     key={action.name}
                                     className="group flex flex-col items-center gap-2"
                                 >
                                     <div className={`w-12 h-12 rounded-full bg-white border border-gray-100 shadow-md flex items-center justify-center group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300 ring-4 ring-transparent group-hover:ring-gray-50 ${action.color}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={action.icon} />
                                        </svg>
                                     </div>
                                     <span className="text-xs font-bold text-gray-500 group-hover:text-gray-800 transition-colors">{action.name}</span>
                                 </button>
                             ))}
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
