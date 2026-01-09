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

export default function CryptoDetail({ account, currency, balances, rateToUsd, walletType, tradingPairs = [] }) {
    // Calculate total balance across all types (available, locked, etc) for this currency
    const totalBalance = balances.reduce((sum, b) => sum + Number(b.balance), 0);
    const usdEquivalent = totalBalance * (rateToUsd || 0);
    
    // Sort pairs to prioritize ones where this currency is the Quote (e.g. BTC/USDT if we are on USDT page)
    const sortedPairs = [...tradingPairs].sort((a, b) => {
        // Simple heuristic: specific common pairs first, or just alphabetical
        return (a.from + a.to).localeCompare(b.from + b.to);
    });
    
    const topPairs = sortedPairs.slice(0, 6);
    const otherPairs = sortedPairs.slice(6);

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
                        
                        {/* Trade Section */}
                        {(topPairs.length > 0) && (
                            <div className="mb-10">
                                <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    Trade
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    {topPairs.map((pair) => (
                                        <div key={pair.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer hover:border-gray-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-1">
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-white z-10">
                                                            {pair.from.substring(0, 1)}
                                                        </div>
                                                        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-white">
                                                            {pair.to.substring(0, 1)}
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-gray-700 text-lg group-hover:text-amber-600 transition-colors">
                                                        {pair.from}/{pair.to}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold px-2 py-1 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                                                    Spot
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-black text-gray-900 tracking-tight">
                                                    {formatNumber(pair.rate, pair.rate < 1 ? 6 : 2)}
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium mt-1">
                                                    1 {pair.from} = {formatNumber(pair.rate, pair.rate < 1 ? 6 : 2)} {pair.to}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {otherPairs.length > 0 && (
                                    <div className="relative">
                                        <select 
                                            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-amber-500 font-bold transition-colors cursor-pointer"
                                            onChange={(e) => {
                                                // Handle navigation or display in future
                                                console.log("Selected pair:", e.target.value);
                                            }}
                                        >
                                            <option value="">More trading pairs for {currency}...</option>
                                            {otherPairs.map(pair => (
                                                <option key={pair.id} value={pair.id}>
                                                    {pair.from}/{pair.to}  •  {formatNumber(pair.rate, pair.rate < 1 ? 6 : 2)}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
