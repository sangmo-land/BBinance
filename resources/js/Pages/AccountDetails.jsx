import React, { useState } from 'react';
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

const currencyNames = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Tether US',
    BNB: 'BNB',
    SOL: 'Solana',
    XRP: 'XRP',
    USDC: 'USDC',
    ADA: 'Cardano',
    AVAX: 'Avalanche',
    DOGE: 'Dogecoin',
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
};

export default function AccountDetails({ account, rates }) {
    const [activeTab, setActiveTab] = useState('spot');
    const [displayCurrency, setDisplayCurrency] = useState('BTC');

    const getUsdEquivalent = (currency, balance) => {
        if (!rates || !rates[currency]) return 0;
        return balance * rates[currency];
    };

    // Calculate total USD balance for the active tab
    const totalUsdBalance = (account.balances || [])
        .filter(b => b.wallet_type === activeTab)
        .reduce((sum, b) => sum + getUsdEquivalent(b.currency, b.balance), 0);
    
    // Convert total USD to selected display currency
    const totalDisplayBalance = totalUsdBalance / (rates[displayCurrency] || 1);

    const availableCurrencies = Object.keys(currencyNames).filter(c => ['USD', 'EUR', 'GBP'].indexOf(c) === -1); // Filter purely for crypto view preference if desired, or keep all.

    return (
        <AppLayout>
            <SEOHead
                title={`Account Details - ${account.account_number}`}
                description="View detailed account information and wallet balances."
            />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6 md:p-10">
                         <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900">
                                    Crypto Wallets
                                </h1>
                                <p className="text-lg text-gray-500 mt-1">{account.account_number} • {account.currency}</p>
                            </div>
                            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
                                &larr; Back to Dashboard
                            </Link>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
                             <div className="flex justify-between items-start">
                                <div>
                                     <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Total Estimated Balance ({activeTab} Wallet)
                                     </h2>
                                     <div className="flex items-baseline gap-2">
                                         <p className="text-4xl font-black text-gray-900">
                                            {formatNumber(totalDisplayBalance, 8)}
                                         </p>
                                         <select 
                                            value={displayCurrency}
                                            onChange={(e) => setDisplayCurrency(e.target.value)}
                                            className="ml-2 text-lg font-bold text-gray-600 bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:ring-0 py-0 pl-0 pr-8 cursor-pointer hover:text-blue-600 transition-colors"
                                         >
                                            {Object.keys(currencyNames).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                         </select>
                                     </div>
                                     <p className="text-sm text-gray-500 font-medium mt-1">
                                        ≈ ${formatNumber(totalUsdBalance, 2)} USD
                                     </p>
                                </div>
                             </div>
                        </div>

                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {['spot', 'funding', 'earning'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`${
                                            activeTab === tab
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg capitalize transition-colors duration-200`}
                                    >
                                        {tab} Wallet
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between font-bold text-gray-500 text-xs uppercase tracking-wider">
                                <span>Currency</span>
                                <span>Balance</span>
                            </div>
                            <ul className="divide-y divide-gray-200">
                                {(account.balances || [])
                                    .filter(b => b.wallet_type === activeTab)
                                    .map((balance, idx) => (
                                    <li key={`${balance.currency}-${idx}`} className="p-4 hover:bg-blue-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs ring-2 ring-white shadow-sm">
                                                    {balance.currency.substring(0, 3)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-base font-bold text-gray-900">{balance.currency}</div>
                                                    <div className="text-sm text-gray-500 font-medium">{currencyNames[balance.currency] || balance.currency}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-base font-mono font-bold text-gray-900">{formatNumber(balance.balance, 8)}</div>
                                                <div className="text-xs font-medium text-gray-500">
                                                    ≈ ${formatNumber(getUsdEquivalent(balance.currency, balance.balance), 2)} USD
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {(account.balances || []).filter(b => b.wallet_type === activeTab).length === 0 && (
                                    <li className="p-12 text-center text-gray-500">
                                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        <p className="font-medium">No empty balances found in this wallet.</p> 
                                        {/* Note: Logic above usually shows all initialized balances, so this state is rare unless we filter 0s */}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
