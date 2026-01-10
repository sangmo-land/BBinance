import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
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

export default function CryptoDetail({ account, currency, balances, spotBalances = [], allCurrencyBalances = [], rateToUsd, walletType, tradingPairs = [], tradingFeePercent = 0.1, transactions = [] }) {
    const { flash } = usePage().props;
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        if (flash.success) {
            setShowNotification(true);
            const timer = setTimeout(() => setShowNotification(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash.success]);

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

    // Form handling for Buy
    const { data: buyData, setData: setBuyData, post: postBuy, processing: processingBuy, errors: errorsBuy, reset: resetBuy } = useForm({
        pair_id: '',
        amount: '',
        spending_currency: '',
        receiving_currency: ''
    });

    // Form handling for Sell
    const { data: sellData, setData: setSellData, post: postSell, processing: processingSell, errors: errorsSell, reset: resetSell } = useForm({
        pair_id: '',
        amount: '',
        spending_currency: '',
        receiving_currency: ''
    });

    // Normalize wallet type from URL to match Title Case DB values (Spot, Funding, Earn)
    const normalizedWalletType = React.useMemo(() => {
        if (!walletType) return 'Spot';
        const w = walletType.toLowerCase();
        if (w === 'earning' || w === 'earn') return 'Earn';
        return w.charAt(0).toUpperCase() + w.slice(1);
    }, [walletType]);

    // Form handling for Transfer
    const { data: transferData, setData: setTransferData, post: postTransfer, processing: processingTransfer, errors: errorsTransfer, reset: resetTransfer } = useForm({
        amount: '',
        from_wallet: normalizedWalletType,
        to_wallet: normalizedWalletType === 'Spot' ? 'Funding' : 'Spot',
        currency: currency
    });

    // Update form default if URL changes while component is mounted
    useEffect(() => {
        setTransferData('from_wallet', normalizedWalletType);
        setTransferData('to_wallet', normalizedWalletType === 'Spot' ? 'Funding' : 'Spot');
    }, [normalizedWalletType]);

    // Form handling for Convert
    const { data: convertData, setData: setConvertData, post: postConvert, processing: processingConvert, errors: errorsConvert, reset: resetConvert } = useForm({
        from_currency: currency,
        to_currency: '',
        amount: '',
        wallet_type: normalizedWalletType
    });

    // Update wallet type in convert form when it changes
    useEffect(() => {
        setConvertData(data => ({ ...data, wallet_type: normalizedWalletType }));
    }, [normalizedWalletType]);

    // Modal States
    let [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    let [isSellModalOpen, setIsSellModalOpen] = useState(false);
    let [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    let [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    
    // Selection States
    let [selectedPairId, setSelectedPairId] = useState(tradingPairs.length > 0 ? tradingPairs[0].id : null);
    let [inputAmount, setInputAmount] = useState('');

    const selectedPair = tradingPairs.find(p => p.id == selectedPairId) || tradingPairs[0] || null;

    // Helper to calculate trade details
    // Now that backend guarantees tradingPairs are formated as [from: Other, to: Currency]
    // Rate is "Amount of Currency (to) per 1 Other (from)"
    const getTradeDetails = (type) => { 
        if (!selectedPair) return {};
        
        if (type === 'BUY') {
            // BUY Action: "Buy the First Crypto (from) using Currency (to)"
            // Example: Pair USDT/ETH. "Buy USDT". 
            // We Spend ETH (to). We Receive USDT (from).
            return {
                spending: selectedPair.to, 
                receiving: selectedPair.from, 
                rateLabel: `1 ${selectedPair.from} = ${formatNumber(selectedPair.rate, selectedPair.rate < 1 ? 6 : 2)} ${selectedPair.to}`,
                quotePrice: selectedPair.rate, 
                isInverted: false // Input (Spend To) / Rate = Output (Get From)
            };
        } else { 
            // SELL Action: "Sell the First Crypto (from) for Currency (to)"
            // Example: Pair USDT/ETH. "Sell USDT".
            // We Spend USDT (from). We Receive ETH (to).
            return {
                spending: selectedPair.from, 
                receiving: selectedPair.to, 
                rateLabel: `1 ${selectedPair.from} = ${formatNumber(selectedPair.rate, selectedPair.rate < 1 ? 6 : 2)} ${selectedPair.to}`,
                quotePrice: selectedPair.rate,
                isInverted: true // Input (Spend From) * Rate = Output (Get To)
            };
        }
    };

    const tradeDetailsBuy = getTradeDetails('BUY');
    const tradeDetailsSell = getTradeDetails('SELL');
    
    // Determine which calculation to use based on open modal
    const activeDetails = isBuyModalOpen ? tradeDetailsBuy : (isSellModalOpen ? tradeDetailsSell : {});

    // Sync form data
    React.useEffect(() => {
        if (selectedPair && (isBuyModalOpen || isSellModalOpen)) {
            const details = isBuyModalOpen ? tradeDetailsBuy : tradeDetailsSell;
            const payload = {
                pair_id: selectedPair.id,
                amount: inputAmount,
                spending_currency: details.spending,
                receiving_currency: details.receiving
            };
            
            if (isBuyModalOpen) setBuyData(payload);
            if (isSellModalOpen) setSellData(payload);
        }
    }, [inputAmount, selectedPairId, isBuyModalOpen, isSellModalOpen]);

    const handleBuySubmit = () => {
        postBuy(route('accounts.buy-crypto', account.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsBuyModalOpen(false);
                setInputAmount('');
            }
        });
    };
    
    const handleSellSubmit = () => {
        postSell(route('accounts.sell-crypto', account.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsSellModalOpen(false);
                setInputAmount('');
            }
        });
    };

    const handleTransferSubmit = (e) => {
        e.preventDefault();
        postTransfer(route('accounts.transfer-crypto', account.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsTransferModalOpen(false);
                resetTransfer();
            }
        });
    };

    const handleActionClick = (name) => {
        if (name === 'Buy') {
            setIsBuyModalOpen(true);
            setInputAmount(''); // Reset
        }
        if (name === 'Sell') {
            setIsSellModalOpen(true);
            setInputAmount(''); // Reset
        }
        if (name === 'Transfer') {
            setTransferData('currency', currency); // Ensure currency is set
            setIsTransferModalOpen(true);
        }
        if (name === 'Convert') {
            setConvertData('from_currency', currency);
            setIsConvertModalOpen(true);
        }
    }

    const handleConvertSubmit = (e) => {
        e.preventDefault();
        postConvert(route('accounts.convert-crypto-action', account.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsConvertModalOpen(false);
                resetConvert();
            }
        });
    };

    // Calculation Logic
    let rawReceive = 0;
    if (activeDetails.spending && inputAmount && selectedPair) {
         if (activeDetails.isInverted) {
             // Spending Base. Receive Quote.
             rawReceive = parseFloat(inputAmount) * selectedPair.rate;
         } else {
             // Spending Quote. Receive Base.
             rawReceive = parseFloat(inputAmount) / selectedPair.rate;
         }
    }

    const feeAmount = rawReceive * (tradingFeePercent / 100);
    const estimatedReceive = rawReceive - feeAmount;

    // Calculate Available Balance for Spending
    // We spend the 'spending' currency from activeDetails
    const spendingCurrency = activeDetails.spending || '';
    const spendingBalanceObj = spotBalances.find(b => b.currency === spendingCurrency);
    const spendingBalance = spendingBalanceObj ? Number(spendingBalanceObj.balance) : 0;
    const isInsufficientBalance = spendingCurrency && inputAmount && (parseFloat(inputAmount) > spendingBalance);
    
    // Processing state
    const isProcessing = processingBuy || processingSell;

    return (
        <AppLayout>
            <SEOHead
                title={`${currency} Details - ${account.account_number}`}
                description={`View detailed ${currency} balance information.`}
            />
            
            {/* Notification */}
            <Transition
                show={showNotification}
                enter="transition ease-out duration-300 transform"
                enterFrom="-translate-y-2 opacity-0"
                enterTo="translate-y-0 opacity-100"
                leave="transition ease-in duration-200 transform"
                leaveFrom="translate-y-0 opacity-100"
                leaveTo="-translate-y-2 opacity-0"
                className="fixed top-4 right-4 z-50 w-full max-w-sm"
            >
                <div className="bg-white rounded-lg shadow-lg border border-green-100 p-4 flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Success</h4>
                        <p className="text-xs text-gray-600 font-medium">{flash.success}</p>
                    </div>
                    <button 
                        onClick={() => setShowNotification(false)}
                        className="ml-auto text-gray-400 hover:text-gray-500"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </Transition>

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
                                     onClick={() => handleActionClick(action.name)}
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

                        {/* Recent Transactions Section */}
                        {transactions && transactions.data && transactions.data.length > 0 && (
                            <div className="mb-0">
                                <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Recent Transactions
                                </h3>
                                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    <ul className="divide-y divide-gray-50">
                                        {transactions.data.map((tx) => {
                                            const isInflow = tx.to_currency === currency;
                                            const isTrade = ['Spot Trade', 'Buy Crypto', 'Sell Crypto'].includes(tx.type);
                                            
                                            // Calculate details for Trade Log
                                            // Gross Received = Amount Spent / Exchange Rate (if rate is defined as Spent/Received)
                                            // Wait, exchange_rate in DB is stored as: Spent / GrossReceived.
                                            // So GrossReceived = Spent / Rate.
                                            // Let's verify. in Controller: 'exchange_rate' => $amount / $rawReceiveAmount
                                            // Validated.
                                            let grossReceived = 0;
                                            let feeAmount = 0;
                                            if (isTrade && tx.exchange_rate > 0) {
                                                grossReceived = Number(tx.amount) / Number(tx.exchange_rate);
                                                feeAmount = grossReceived - Number(tx.converted_amount);
                                            }

                                            return (
                                                <li key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex justify-between items-center z-10 relative">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-full ${isInflow ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    {isInflow 
                                                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                                    }
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">{tx.type} {isInflow ? 'Received' : 'Sent'}</p>
                                                                <p className="text-xs text-gray-400">
                                                                    {new Date(tx.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-sm font-bold ${isInflow ? 'text-green-600' : 'text-gray-900'}`}>
                                                                {isInflow ? '+' : '-'}{formatNumber(isInflow ? tx.converted_amount : tx.amount, 8)} {isInflow ? tx.to_currency : tx.from_currency}
                                                            </p>
                                                            <p className="text-xs text-gray-400 font-medium">
                                                                {tx.status}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details for Spot Trades */}
                                                    {isTrade && (
                                                        <div className="mt-3 ml-12 bg-gray-50/80 rounded-xl p-3 border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                            <div>
                                                                <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">Spent</span>
                                                                <span className="font-bold text-gray-700">{formatNumber(tx.amount, 8)} {tx.from_currency}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">Exec. Price</span>
                                                                <span className="font-bold text-gray-700">1 {tx.to_currency} ≈ {formatNumber(tx.exchange_rate, 2)} {tx.from_currency}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">Gross Received</span>
                                                                <span className="font-bold text-gray-700">{formatNumber(grossReceived, 8)} {tx.to_currency}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">Fee Deducted</span>
                                                                <span className="font-bold text-red-500">-{formatNumber(feeAmount, 8)} {tx.to_currency}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    
                                    {/* Pagination */}
                                    {transactions.links && transactions.links.length > 3 && (
                                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 flex justify-between sm:hidden">
                                                    {transactions.prev_page_url && (
                                                        <Link href={transactions.prev_page_url} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                                            Previous
                                                        </Link>
                                                    )}
                                                    {transactions.next_page_url && (
                                                        <Link href={transactions.next_page_url} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                                            Next
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-700">
                                                            Showing <span className="font-medium">{transactions.from}</span> to <span className="font-medium">{transactions.to}</span> of <span className="font-medium">{transactions.total}</span> results
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                            {transactions.links.map((link, k) => {
                                                                // Use a span for links without URLs (ellipsis, current page, disabled)
                                                                // Use Link only when a URL exists
                                                                const Component = link.url ? Link : 'span';
                                                                
                                                                return (
                                                                    <Component
                                                                        key={k}
                                                                        href={link.url || undefined}
                                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                            link.active
                                                                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''} ${
                                                                            k === 0 ? 'rounded-l-md' : ''
                                                                        } ${
                                                                            k === transactions.links.length - 1 ? 'rounded-r-md' : ''
                                                                        }`}
                                                                    >
                                                                        <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                                                                    </Component>
                                                                );
                                                            })}
                                                        </nav>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Buy Modal */}
            <Transition appear show={isBuyModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsBuyModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2 mb-4"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        Buy {activeDetails.receiving}
                                    </Dialog.Title>
                                    
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Trading Pair</label>
                                            <select
                                                value={selectedPairId || ''}
                                                onChange={(e) => setSelectedPairId(e.target.value)}
                                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 font-bold text-gray-800"
                                            >
                                                {tradingPairs.map((pair) => (
                                                    <option key={pair.id} value={pair.id}>
                                                        {pair.from}/{pair.to} (Rate: {formatNumber(pair.rate, pair.rate < 1 ? 6 : 2)})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedPair && (
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                                    <span>Rate Info</span>
                                                    <span className="font-mono">{activeDetails.rateLabel}</span>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">I want to spend</label>
                                                            <span className={`text-xs font-bold ${isInsufficientBalance ? 'text-red-500' : 'text-gray-500'}`}>
                                                                Available: {formatNumber(spendingBalance, 2)} {spendingCurrency}
                                                            </span>
                                                        </div>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={inputAmount}
                                                                onChange={(e) => setInputAmount(e.target.value)}
                                                                className={`block w-full rounded-xl pl-4 pr-16 py-3 focus:ring-indigo-500 sm:text-lg font-bold ${
                                                                    isInsufficientBalance 
                                                                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500' 
                                                                    : 'border-gray-300 focus:border-indigo-500'
                                                                }`}
                                                                placeholder="0.00"
                                                                step="any"
                                                            />
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                                                <span className={`${isInsufficientBalance ? 'text-red-500' : 'text-gray-500'} sm:text-sm font-bold`}>{activeDetails.spending}</span>
                                                            </div>
                                                        </div>
                                                        {isInsufficientBalance && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                Insufficient {spendingCurrency} balance in Spot Wallet.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-center">
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                        </svg>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">I will receive (Net)</label>
                                                        </div>
                                                        
                                                        {parseFloat(inputAmount) > 0 && (
                                                            <div className="mb-2 px-2 py-1 bg-gray-50 rounded text-xs text-gray-500 flex flex-col gap-1">
                                                                <div className="flex justify-between">
                                                                    <span>Market Value:</span>
                                                                    <span className="font-mono">{formatNumber(rawReceive, 8)} {activeDetails.receiving}</span>
                                                                </div>
                                                                <div className="flex justify-between text-red-500">
                                                                    <span>Fee ({tradingFeePercent}%):</span>
                                                                    <span className="font-mono">-{formatNumber(feeAmount, 8)} {activeDetails.receiving}</span>
                                                                </div>
                                                                <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between font-bold text-gray-700">
                                                                    <span>Net Received:</span>
                                                                    <span>{formatNumber(estimatedReceive, 8)} {activeDetails.receiving}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="relative rounded-md shadow-sm">
                                                            <div className="block w-full rounded-xl bg-gray-100 border-transparent pl-4 pr-16 py-3 text-gray-500 sm:text-lg font-bold">
                                                                {formatNumber(estimatedReceive, 8)}
                                                            </div>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                                                <span className="text-gray-500 sm:text-sm font-bold">{activeDetails.receiving}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button
                                            type="button"
                                            disabled={isInsufficientBalance || !inputAmount || parseFloat(inputAmount) <= 0 || isProcessing}
                                            className={`flex-1 flex justify-center items-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors uppercase tracking-wider ${
                                                (isInsufficientBalance || !inputAmount || parseFloat(inputAmount) <= 0 || isProcessing)
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                            }`}
                                            onClick={handleBuySubmit}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                `Buy ${activeDetails.receiving}`
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            className="flex-shrink-0 justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                            onClick={() => setIsBuyModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Sell Modal */}
            <Transition appear show={isSellModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsSellModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2 mb-4"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        </div>
                                        Sell {activeDetails.spending}
                                    </Dialog.Title>
                                    
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Trading Pair</label>
                                            <select
                                                value={selectedPairId || ''}
                                                onChange={(e) => setSelectedPairId(e.target.value)}
                                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 py-3 font-bold text-gray-800"
                                            >
                                                {tradingPairs.map((pair) => (
                                                    <option key={pair.id} value={pair.id}>
                                                        {pair.from}/{pair.to} (Rate: {formatNumber(pair.rate, pair.rate < 1 ? 6 : 2)})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedPair && (
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                                    <span>Rate Info</span>
                                                    <span className="font-mono">{activeDetails.rateLabel}</span>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">I want to Sell (Spend)</label>
                                                            <span className={`text-xs font-bold ${isInsufficientBalance ? 'text-red-500' : 'text-gray-500'}`}>
                                                                Available: {formatNumber(spendingBalance, 2)} {spendingCurrency}
                                                            </span>
                                                        </div>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={inputAmount}
                                                                onChange={(e) => setInputAmount(e.target.value)}
                                                                className={`block w-full rounded-xl pl-4 pr-16 py-3 focus:ring-red-500 sm:text-lg font-bold ${
                                                                    isInsufficientBalance 
                                                                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500' 
                                                                    : 'border-gray-300 focus:border-red-500'
                                                                }`}
                                                                placeholder="0.00"
                                                                step="any"
                                                            />
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                                                <span className={`${isInsufficientBalance ? 'text-red-500' : 'text-gray-500'} sm:text-sm font-bold`}>{activeDetails.spending}</span>
                                                            </div>
                                                        </div>
                                                        {isInsufficientBalance && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                Insufficient {spendingCurrency} balance.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-center">
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                        </svg>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">I will receive (Net)</label>
                                                        </div>
                                                        
                                                        {parseFloat(inputAmount) > 0 && (
                                                            <div className="mb-2 px-2 py-1 bg-gray-50 rounded text-xs text-gray-500 flex flex-col gap-1">
                                                                <div className="flex justify-between">
                                                                    <span>Market Value:</span>
                                                                    <span className="font-mono">{formatNumber(rawReceive, 8)} {activeDetails.receiving}</span>
                                                                </div>
                                                                <div className="flex justify-between text-red-500">
                                                                    <span>Fee ({tradingFeePercent}%):</span>
                                                                    <span className="font-mono">-{formatNumber(feeAmount, 8)} {activeDetails.receiving}</span>
                                                                </div>
                                                                <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between font-bold text-gray-700">
                                                                    <span>Net Received:</span>
                                                                    <span>{formatNumber(estimatedReceive, 8)} {activeDetails.receiving}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="relative rounded-md shadow-sm">
                                                            <div className="block w-full rounded-xl bg-gray-100 border-transparent pl-4 pr-16 py-3 text-gray-500 sm:text-lg font-bold">
                                                                {formatNumber(estimatedReceive, 8)}
                                                            </div>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                                                <span className="text-gray-500 sm:text-sm font-bold">{activeDetails.receiving}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button
                                            type="button"
                                            disabled={isInsufficientBalance || !inputAmount || parseFloat(inputAmount) <= 0 || isProcessing}
                                            className={`flex-1 flex justify-center items-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors uppercase tracking-wider ${
                                                (isInsufficientBalance || !inputAmount || parseFloat(inputAmount) <= 0 || isProcessing)
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                            }`}
                                            onClick={handleSellSubmit}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                `Sell ${activeDetails.spending}`
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            className="flex-shrink-0 justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                            onClick={() => setIsSellModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Transfer Modal */}
            <Transition appear show={isTransferModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsTransferModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2 mb-4"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                        </div>
                                        Transfer {currency}
                                    </Dialog.Title>
                                    
                                    <form onSubmit={handleTransferSubmit} className="mt-4 space-y-4">
                                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">From</label>
                                                <select
                                                    value={transferData.from_wallet}
                                                    onChange={e => setTransferData('from_wallet', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 font-bold text-gray-800 focus:ring-0 text-sm"
                                                >
                                                    {['Spot', 'Funding', 'Earn'].map(w => (
                                                        <option key={w} value={w} disabled={w === transferData.to_wallet}>{w}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="text-gray-400">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">To</label>
                                                <select
                                                    value={transferData.to_wallet}
                                                    onChange={e => setTransferData('to_wallet', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 font-bold text-gray-800 focus:ring-0 text-sm text-right"
                                                    dir="rtl"
                                                >
                                                    {['Spot', 'Funding', 'Earn'].map(w => (
                                                        <option key={w} value={w} disabled={w === transferData.from_wallet}>{w}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            {(() => {
                                                const sourceWallet = allCurrencyBalances.find(b => b.wallet_type.toLowerCase() === transferData.from_wallet.toLowerCase());
                                                const maxTransfer = sourceWallet ? parseFloat(sourceWallet.balance) : 0;
                                                const currentAmount = parseFloat(transferData.amount || 0);
                                                const isExceeding = currentAmount > maxTransfer;

                                                return (
                                                    <>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Amount</label>
                                                            <span className={`text-xs font-bold ${isExceeding ? 'text-red-500' : 'text-gray-500'}`}>
                                                                Available ({transferData.from_wallet}): {formatNumber(maxTransfer, 8)} {currency}
                                                            </span>
                                                        </div>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={transferData.amount}
                                                                onChange={(e) => setTransferData('amount', e.target.value)}
                                                                className={`block w-full rounded-xl pl-4 pr-16 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-lg font-bold ${
                                                                    isExceeding ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : ''
                                                                }`}
                                                                placeholder="0.00"
                                                                step="any"
                                                            />
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                                                <span className={`${isExceeding ? 'text-red-500' : 'text-gray-500'} sm:text-sm font-bold`}>{currency}</span>
                                                            </div>
                                                        </div>
                                                        {isExceeding && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">Amount exceeds available balance.</p>
                                                        )}
                                                        {errorsTransfer.amount && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">{errorsTransfer.amount}</p>
                                                        )}
                                                        
                                                        {/* Hidden input to pass validation state to parent form if needed, but here we control button directly */}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            {(() => {
                                                const sourceWallet = allCurrencyBalances.find(b => b.wallet_type.toLowerCase() === transferData.from_wallet.toLowerCase());
                                                const maxTransfer = sourceWallet ? parseFloat(sourceWallet.balance) : 0;
                                                const currentAmount = parseFloat(transferData.amount || 0);
                                                const isValid = !processingTransfer && transferData.amount && currentAmount > 0 && currentAmount <= maxTransfer;

                                                return (
                                                    <button
                                                        type="submit"
                                                        disabled={!isValid}
                                                        className={`flex-1 flex justify-center items-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors uppercase tracking-wider ${
                                                            !isValid
                                                            ? 'bg-gray-300 cursor-not-allowed'
                                                            : 'bg-blue-600 hover:bg-blue-700'
                                                        }`}
                                                    >
                                                        {processingTransfer ? 'Processing...' : 'Confirm Transfer'}
                                                    </button>
                                                );
                                            })()}

                                            <button
                                                type="button"
                                                disabled={processingTransfer}
                                                className="flex-shrink-0 justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                onClick={() => setIsTransferModalOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            {/* Convert Modal */}
            <Transition appear show={isConvertModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsConvertModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2 mb-4"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                        </div>
                                        Convert {currency} ({convertData.wallet_type} Wallet)
                                    </Dialog.Title>
                                    
                                    <form onSubmit={handleConvertSubmit} className="mt-4 space-y-4">
                                        {/* From Currency (Read Only) */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">From</label>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-900 text-lg">{currency}</span>
                                                <span className="text-xs font-bold text-gray-500">
                                                    Available: {formatNumber(allCurrencyBalances.find(b => b.wallet_type.toLowerCase() === convertData.wallet_type.toLowerCase())?.balance || 0, 8)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* To Currency Selection */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase block">To</label>
                                                {convertData.to_currency && (
                                                    <div className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                                        {(() => {
                                                            // Find direct pair in tradingPairs 
                                                            // Pairs are standard: {from: OTHER, to: CURRENT, rate: CURRENT_PER_OTHER}
                                                            // We want to Convert CURRENT -> OTHER.
                                                            // Rate CURRENT -> OTHER is 1 / OTHER_PER_CURRENT
                                                            // Wait. The rate in tradingPairs is "Amount of CURRENT per 1 OTHER".
                                                            // Example: ETH Page. Pair USDT/ETH. Rate = 0.0003 ETH per 1 USDT.
                                                            // We convert ETH -> USDT. 
                                                            // 1 ETH = (1/0.0003) USDT = 3333 USDT.
                                                            
                                                            const pair = tradingPairs.find(p => p.from === convertData.to_currency);
                                                            if (pair) {
                                                                const rate = 1 / pair.rate;
                                                                return `1 ${currency} ≈ ${formatNumber(rate, rate < 1 ? 6 : 2)} ${convertData.to_currency}`;
                                                            }
                                                            return "Best Market Rate";
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                            <select
                                                value={convertData.to_currency}
                                                onChange={e => setConvertData('to_currency', e.target.value)}
                                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 py-3 font-bold text-gray-800"
                                            >
                                                <option value="" disabled>Select Currency</option>
                                                {['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'USDC', 'ADA', 'AVAX', 'DOGE'].filter(c => c !== currency).map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            {errorsConvert.to_currency && (
                                                <p className="mt-1 text-xs text-red-600 font-bold">{errorsConvert.to_currency}</p>
                                            )}
                                        </div>

                                        {/* Amount Input */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            {(() => {
                                                const sourceWallet = allCurrencyBalances.find(b => b.wallet_type.toLowerCase() === convertData.wallet_type.toLowerCase());
                                                const maxAmount = sourceWallet ? parseFloat(sourceWallet.balance) : 0;
                                                const currentAmount = parseFloat(convertData.amount || 0);
                                                const isExceeding = currentAmount > maxAmount;

                                                return (
                                                    <>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Amount to Convert</label>
                                                        </div>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={convertData.amount}
                                                                onChange={(e) => setConvertData('amount', e.target.value)}
                                                                className={`block w-full rounded-xl pl-4 pr-16 py-3 border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-lg font-bold ${
                                                                    isExceeding ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : ''
                                                                }`}
                                                                placeholder="0.00"
                                                                step="any"
                                                            />
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                                                <span className={`${isExceeding ? 'text-red-500' : 'text-gray-500'} sm:text-sm font-bold`}>{currency}</span>
                                                            </div>
                                                        </div>
                                                        {isExceeding && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">Amount exceeds available balance.</p>
                                                        )}
                                                        {errorsConvert.amount && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">{errorsConvert.amount}</p>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            {(() => {
                                                const sourceWallet = allCurrencyBalances.find(b => b.wallet_type.toLowerCase() === convertData.wallet_type.toLowerCase());
                                                const maxAmount = sourceWallet ? parseFloat(sourceWallet.balance) : 0;
                                                const currentAmount = parseFloat(convertData.amount || 0);
                                                const isValid = !processingConvert && convertData.to_currency && currentAmount > 0 && currentAmount <= maxAmount;

                                                return (
                                                    <button
                                                        type="submit"
                                                        disabled={!isValid}
                                                        className={`flex-1 flex justify-center items-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors uppercase tracking-wider ${
                                                            !isValid
                                                            ? 'bg-gray-300 cursor-not-allowed'
                                                            : 'bg-purple-600 hover:bg-purple-700'
                                                        }`}
                                                    >
                                                        {processingConvert ? 'Processing...' : 'Confirm Conversion'}
                                                    </button>
                                                );
                                            })()}
                                            <button
                                                type="button"
                                                disabled={processingConvert}
                                                className="flex-shrink-0 justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                                                onClick={() => setIsConvertModalOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

        </AppLayout>
    );
}
