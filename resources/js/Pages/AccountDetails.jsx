import React, { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import SEOHead from '@/Components/SEOHead';
import Modal from '@/Components/Modal';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

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

export default function AccountDetails({ account, rates, cryptoConversionFeePercent = 1, transactions = [] }) {
    const isFiat = account.account_type === 'fiat';
    const [activeTab, setActiveTab] = useState(isFiat ? 'fiat' : 'spot');
    const [displayCurrency, setDisplayCurrency] = useState(isFiat ? 'USD' : 'BTC');
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false); // New Transfer Modal
    const [conversionMode, setConversionMode] = useState('menu'); // menu, fiat, crypto
    
    // Toast Notification State
    const { flash } = usePage().props;
    const [toast, setToast] = useState(null);

    // Transfer Form
    const { 
        data: transferData, 
        setData: setTransferData, 
        post: postTransfer, 
        processing: transferProcessing, 
        errors: transferErrors, 
        reset: resetTransfer 
    } = useForm({
        currency: 'USD',
        amount: '',
        direction: 'available_to_withdrawable'
    });

    const handleTransfer = (e) => {
        e.preventDefault();
        postTransfer(route('accounts.transfer-internal', account.id), {
            onSuccess: () => {
                resetTransfer();
                setShowTransferModal(false);
                // Toast handled by flash effect or we can set it explicitly here if needed
            }
        });
    };

    useEffect(() => {
        if (flash?.success) {
            setToast({ type: 'success', message: flash.success });
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
        if (flash?.error) {
            setToast({ type: 'error', message: flash.error || 'An error occurred.' });
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        from_currency: 'EUR',
        to_currency: 'USD',
        amount: '',
    });

    useEffect(() => {
        if (!showConvertModal) {
            const timer = setTimeout(() => {
                setConversionMode('menu');
                reset();
                clearErrors();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [showConvertModal]);

    const getUsdEquivalent = (currency, balance) => {
        const amount = Number(balance) || 0;
        if (currency === "USD") return amount;
        if (!rates || !rates[currency]) return 0;
        return amount * rates[currency];
    };

    // Calculate total USD balance for the active tab
    const totalUsdBalance = (account.balances || [])
        .filter((b) =>
            isFiat ? b.wallet_type === "fiat" : b.wallet_type === activeTab
        )
        .reduce((sum, b) => sum + getUsdEquivalent(b.currency, b.balance), 0);
    
    // Convert total USD to selected display currency
    const totalDisplayBalance = displayCurrency === 'USD' 
        ? totalUsdBalance 
        : totalUsdBalance / (rates[displayCurrency] || 1);

    const availableCurrencies = Object.keys(currencyNames).filter(c => ['USD', 'EUR', 'GBP'].indexOf(c) === -1); 

    return (
        <AppLayout>
            <SEOHead
                title={`Account Details - ${account.account_number}`}
                description="View detailed account information and wallet balances."
            />

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-24 right-4 z-[60] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 animate-fade-in-down ${
                    toast.type === 'success' ? 'bg-white border-l-4 border-green-500' : 'bg-white border-l-4 border-red-500'
                }`}>
                    {toast.type === 'success' ? (
                         <div className="bg-green-100 p-2 rounded-full">
                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                         </div>
                    ) : (
                         <div className="bg-red-100 p-2 rounded-full">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                         </div>
                    )}
                    <div>
                        <h4 className={`font-bold text-sm ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {toast.type === 'success' ? 'Success' : 'Error'}
                        </h4>
                        <p className="text-sm text-gray-600">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="ml-4 text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6 md:p-10">
                         <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900">
                                    {isFiat ? 'Fiat Account' : 'Crypto Wallets'}
                                </h1>
                                <p className="text-lg text-gray-500 mt-1">{account.account_number} • {account.currency}</p>
                            </div>
                            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
                                &larr; Back to Dashboard
                            </Link>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
                             {!isFiat ? (
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
                             ) : (
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                     {['available', 'pending', 'locked', 'withdrawable'].map(type => {
                                         // Helper to get balance by type and currency
                                         const getBal = (curr) => account.balances?.find(b => b.wallet_type === 'fiat' && b.currency === curr && b.balance_type === type)?.balance || 0;
                                         const usdBal = getBal('USD');
                                         
                                         // If type is 'available', we currently have logic to calculate implicit EUR?
                                         // For now, assume pure DB values. 
                                         // However, previous view was showing everything as "fiat" wallet type with no balance_type distinction (defaulted to 'available').
                                         const eurBal = getBal('EUR');
                                         
                                         return (
                                             <div key={type} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{type} Balance</h3>
                                                 <div className="space-y-2">
                                                     <div className="flex justify-between items-center">
                                                         <span className="text-sm font-bold text-gray-400">USD</span>
                                                         <span className="text-lg font-black text-gray-900">{formatNumber(usdBal, 2)}</span>
                                                     </div>
                                                     <div className="flex justify-between items-center">
                                                         <span className="text-sm font-bold text-gray-400">EUR</span>
                                                         <span className="text-lg font-black text-gray-900">{formatNumber(eurBal, 2)}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             )}

                             {isFiat && (
                                 <div className="flex flex-wrap justify-center gap-3 mt-6 pt-6 border-t border-gray-200">
                                     <button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2.5 px-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200">
                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                         </svg>
                                         Deposit
                                     </button>
                                     <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200">
                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                         </svg>
                                         Withdraw
                                     </button>
                                     <button 
                                         onClick={() => setShowConvertModal(true)}
                                         className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
                                     >
                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                         </svg>
                                         Convert
                                     </button>
                                     <button 
                                         onClick={() => setShowTransferModal(true)}
                                         className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200">
                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                         </svg>
                                         Transfer
                                     </button>
                                 </div>
                             )}
                        </div>

                        {!isFiat && (
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
                        )}

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

                        {/* Transaction History Section */}
                        {isFiat && (
                            <div className="mt-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h3>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                     <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Converted To</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {transactions && transactions.length > 0 ? (
                                                    transactions.map((tx) => (
                                                        <tr key={tx.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                                    ${tx.type === 'deposit' ? 'bg-green-100 text-green-800' : ''}
                                                                    ${tx.type === 'withdrawal' ? 'bg-red-100 text-red-800' : ''}
                                                                    ${tx.type === 'conversion' ? 'bg-blue-100 text-blue-800' : ''}
                                                                    ${tx.type === 'transfer' ? 'bg-purple-100 text-purple-800' : ''}
                                                                `}>
                                                                    {tx.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                                {formatNumber(tx.amount, 2)} {tx.from_currency}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {tx.converted_amount 
                                                                    ? `${formatNumber(tx.converted_amount, 8)} ${tx.to_currency}`
                                                                    : '-'
                                                                }
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                                    ${tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                                                                `}>
                                                                    {tx.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                                            No transactions found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal show={showConvertModal} onClose={() => setShowConvertModal(false)}>
                {conversionMode === 'menu' && (
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Select Conversion Type</h2>
                        <button onClick={() => setShowConvertModal(false)} className="text-gray-400 hover:text-gray-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="grid gap-4">
                        <button 
                            onClick={() => setConversionMode('fiat')}
                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-900">Fiat Conversion</h3>
                                    <p className="text-sm text-gray-500">Convert between USD and EUR</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        
                        <button 
                            onClick={() => {
                                setConversionMode('crypto');
                                setData({ ...data, from_currency: 'USD', to_currency: 'USDT', amount: '' });
                            }}
                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-900">Convert to Crypto</h3>
                                    <p className="text-sm text-gray-500">Buy crypto using your fiat balance</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
                )}

                {conversionMode === 'fiat' && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Fiat Conversion</h2>
                            <button onClick={() => setConversionMode('menu')} className="text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>
                        </div>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            post(`/accounts/${account.id}/convert-fiat`, {
                                onSuccess: () => setShowConvertModal(false),
                            });
                        }}>
                             <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">From Account</label>
                                    <p className="text-xs font-bold text-gray-500">
                                        Available: {formatNumber( (account.balances?.find(b => b.currency === data.from_currency && b.wallet_type === 'fiat')?.balance) || 0, 2)} {data.from_currency}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                     <div className="flex-1">
                                         <input 
                                            type="number" 
                                            step="0.01" 
                                            value={data.amount}
                                            onChange={e => setData('amount', e.target.value)}
                                            className="w-full text-2xl font-black bg-transparent border-0 focus:ring-0 p-0 text-gray-900 placeholder-gray-300"
                                            placeholder="0.00"
                                            autoFocus
                                         />
                                     </div>
                                     <div className="flex-shrink-0">
                                         <select 
                                            value={data.from_currency}
                                            onChange={(e) => {
                                                const newFrom = e.target.value;
                                                const newTo = newFrom === 'USD' ? 'EUR' : 'USD';
                                                setData({ ...data, from_currency: newFrom, to_currency: newTo });
                                            }}
                                            className="font-bold text-lg bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 cursor-pointer shadow-sm"
                                         >
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                         </select>
                                     </div>
                                </div>
                             </div>

                             <div className="flex justify-center -my-9 relative z-10 pointer-events-none">
                                 <button 
                                    type="button"
                                    onClick={() => setData({ ...data, from_currency: data.to_currency, to_currency: data.from_currency })}
                                    className="p-2 bg-white border border-gray-200 rounded-full shadow-md text-gray-500 hover:text-blue-600 pointer-events-auto transition-transform hover:rotate-180"
                                 >
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                     </svg>
                                 </button>
                             </div>

                             <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 mt-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To Account (Estimate)</label>
                                <div className="flex gap-4 items-center">
                                     <div className="flex-1 text-2xl font-black text-gray-900">
                                         {(() => {
                                             const amt = Number(data.amount) || 0;
                                             if (amt === 0) return '0.00';
                                             const fromRate = rates && rates[data.from_currency] ? rates[data.from_currency] : 0; 
                                             const toRate = rates && rates[data.to_currency] ? rates[data.to_currency] : 1; 
                                             const res = (amt * fromRate) / toRate;
                                             return formatNumber(res, 2);
                                         })()}
                                     </div>
                                     <div className="text-lg font-bold text-gray-500">
                                         {data.to_currency}
                                     </div>
                                </div>
                             </div>

                             {errors.amount && <p className="text-red-500 text-sm font-medium mb-4">{errors.amount}</p>}
                             {errors.error && <p className="text-red-500 text-sm font-medium mb-4">{errors.error}</p>}

                             <div className="flex gap-3">
                                 <button 
                                    type="button"
                                    onClick={() => setShowConvertModal(false)}
                                    className="flex-1 px-4 py-3 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                 >
                                     Cancel
                                 </button>
                                 <button 
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none"
                                 >
                                     {processing ? 'Converting...' : 'Convert Now'}
                                 </button>
                             </div>
                        </form>
                    </div>
                )}

                {conversionMode === 'crypto' && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Convert to Crypto</h2>
                            <button onClick={() => setConversionMode('menu')} className="text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            {(() => {
                                const fromRate = rates?.[data.from_currency] || 0;
                                const cryptoPrice = rates?.[data.to_currency] || 1;
                                const price = cryptoPrice / (fromRate || 1);
                                return (
                                    <p className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                                        Platform Rate: 1 {data.to_currency} ≈ {formatNumber(price, 2)} {data.from_currency}
                                    </p>
                                );
                            })()}
                             <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Fee: {cryptoConversionFeePercent}%
                            </span>
                        </div>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            post(`/accounts/${account.id}/convert-to-crypto`, {
                                onSuccess: () => setShowConvertModal(false),
                            });
                        }}>
                             <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">From (Fiat)</label>
                                    <p className="text-xs font-bold text-gray-500">
                                        Available: {formatNumber( (account.balances?.find(b => b.currency === data.from_currency && b.wallet_type === 'fiat')?.balance) || 0, 2)} {data.from_currency}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                     <div className="flex-1">
                                         <input 
                                            type="number" 
                                            step="0.01" 
                                            value={data.amount}
                                            onChange={e => setData('amount', e.target.value)}
                                            className="w-full text-2xl font-black bg-transparent border-0 focus:ring-0 p-0 text-gray-900 placeholder-gray-300"
                                            placeholder="0.00"
                                            autoFocus
                                         />
                                     </div>
                                     <div className="flex-shrink-0">
                                         <select 
                                            value={data.from_currency}
                                            onChange={(e) => setData('from_currency', e.target.value)}
                                            className="font-bold text-lg bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 cursor-pointer shadow-sm"
                                         >
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                         </select>
                                     </div>
                                </div>
                             </div>

                             <div className="flex justify-center -my-9 relative z-10 pointer-events-none">
                                 <div className="p-2 bg-white border border-gray-200 rounded-full shadow-md text-gray-500">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                     </svg>
                                 </div>
                             </div>

                             <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 mt-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To (Spot Wallet)</label>
                                <div className="flex gap-4 items-center">
                                     <div className="flex-1 text-2xl font-black text-gray-900 truncate">
                                         {(() => {
                                             const amt = Number(data.amount) || 0;
                                             if (amt === 0) return '0.00000000';
                                             
                                             const fromRate = rates && rates[data.from_currency] ? rates[data.from_currency] : 0; 
                                             const cryptoPrice = rates && rates[data.to_currency] ? rates[data.to_currency] : 1;
                                             
                                             // USD Value = amt * (1 - Fee) * fromRate
                                             const feeMultiplier = 1 - (cryptoConversionFeePercent / 100);
                                             const res = (amt * feeMultiplier * fromRate) / cryptoPrice;
                                             return formatNumber(res, 8);
                                         })()}
                                     </div>
                                     <div className="flex-shrink-0">
                                         <select 
                                            value={data.to_currency}
                                            onChange={(e) => setData('to_currency', e.target.value)}
                                            className="font-bold text-lg bg-white border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-0 cursor-pointer shadow-sm w-32"
                                         >
                                            {/* Show USDT first, then others */}
                                            <option value="USDT">USDT</option>
                                            {Object.keys(currencyNames)
                                                .filter(c => ['USD', 'EUR', 'GBP', 'USDT'].indexOf(c) === -1)
                                                .map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                         </select>
                                     </div>
                                </div>
                                <div className="text-right mt-1">
                                    <span className="text-xs text-gray-400">
                                        Fee: {formatNumber(Number(data.amount || 0) * (cryptoConversionFeePercent/100), 2)} {data.from_currency}
                                    </span>
                                </div>
                             </div>

                             {errors.amount && <p className="text-red-500 text-sm font-medium mb-4">{errors.amount}</p>}
                             {errors.error && <p className="text-red-500 text-sm font-medium mb-4">{errors.error}</p>}

                             <div className="flex gap-3">
                                 <button 
                                    type="button"
                                    onClick={() => setShowConvertModal(false)}
                                    className="flex-1 px-4 py-3 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                 >
                                     Cancel
                                 </button>
                                 {(() => {
                                     const bal = account.balances?.find(b => b.currency === data.from_currency && b.wallet_type === 'fiat')?.balance || 0;
                                     const amt = Number(data.amount) || 0;
                                     const isDisabled = processing || amt <= 0 || amt > bal;
                                     
                                     return (
                                         <button 
                                            type="submit"
                                            disabled={isDisabled}
                                            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                         >
                                             {processing ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </>
                                             ) : 'Buy Crypto'}
                                         </button>
                                     );
                                 })()}
                             </div>
                        </form>
                    </div>
                )}
            </Modal>

            {/* Internal Transfer Modal */}
            <Modal show={showTransferModal} onClose={() => setShowTransferModal(false)}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Transfer Funds</h2>
                        <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleTransfer}>
                        {/* Direction Switcher */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">From</label>
                                    <div className="font-bold text-gray-900 text-lg">
                                        {transferData.direction === 'available_to_withdrawable' ? 'Available' : 'Withdrawable'}
                                    </div>
                                </div>
                                
                                <button 
                                    type="button"
                                    onClick={() => setTransferData('direction', transferData.direction === 'available_to_withdrawable' ? 'withdrawable_to_available' : 'available_to_withdrawable')}
                                    className="p-2 bg-white rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors text-blue-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </button>

                                <div className="flex-1 text-right">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To</label>
                                    <div className="font-bold text-gray-900 text-lg">
                                        {transferData.direction === 'available_to_withdrawable' ? 'Withdrawable' : 'Available'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Currency & Amount */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Asset & Amount</label>
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <select
                                        value={transferData.currency}
                                        onChange={e => setTransferData('currency', e.target.value)}
                                        className="w-full text-lg font-bold border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={transferData.amount}
                                        onChange={e => setTransferData('amount', e.target.value)}
                                        className="w-full text-lg font-bold border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500 pr-20"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            // Find Balance
                                            const fromType = transferData.direction === 'available_to_withdrawable' ? 'available' : 'withdrawable';
                                            const bal = account.balances?.find(b => b.wallet_type === 'fiat' && b.currency === transferData.currency && b.balance_type === fromType)?.balance || 0;
                                            setTransferData('amount', bal);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 uppercase hover:text-blue-700"
                                    >
                                        Max
                                    </button>
                                </div>
                            </div>
                            {/* Show Balance Hint */}
                            <div className="mt-2 text-right text-xs text-gray-500 font-medium">
                                Available: {(() => {
                                    const fromType = transferData.direction === 'available_to_withdrawable' ? 'available' : 'withdrawable';
                                    const bal = account.balances?.find(b => b.wallet_type === 'fiat' && b.currency === transferData.currency && b.balance_type === fromType)?.balance || 0;
                                    return formatNumber(bal, 2) + ' ' + transferData.currency;
                                })()}
                            </div>
                        </div>

                        {transferErrors.amount && <p className="text-red-500 text-sm font-medium mb-4">{transferErrors.amount}</p>}
                        {transferErrors.error && <p className="text-red-500 text-sm font-medium mb-4">{transferErrors.error}</p>}

                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setShowTransferModal(false)}
                                className="flex-1 px-4 py-3 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={transferProcessing}
                                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {transferProcessing ? 'Processing...': 'Confirm Transfer'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AppLayout>
    );
}
