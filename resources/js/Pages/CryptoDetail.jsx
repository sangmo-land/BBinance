import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import SEOHead from '@/Components/SEOHead';
import { Head, Link, router } from "@inertiajs/react";

const blockchainNetworks = [
    { id: "Morph", name: "Morph L2", fee: 0.1, delay: "≈ 5 mins" },
    { id: "TRC20", name: "Tron (TRC20)", fee: 1.0, delay: "≈ 2 mins" },
    {
        id: "BEP20",
        name: "BNB Smart Chain (BEP20)",
        fee: 0.29,
        delay: "≈ 2 mins",
    },
    { id: "ERC20", name: "Ethereum (ERC20)", fee: 6.5, delay: "≈ 10 mins" },
    { id: "SOL", name: "Solana", fee: 0.01, delay: "≈ 1 min" },
];

function formatNumber(value, fractionDigits = 8) {
    const n = Number(value);
    const parsed = Number.isFinite(n) ? n : 0;
    // Use toFixed to avoid localized grouping separators if strict formatting is needed,
    // or use toLocaleString with forced digits as before but user asked to not round up.
    // Standard float representation is best.
    // "Do not round up" implies floor or just showing high precision.
    // Let's ensure high precision by default.

    if (fractionDigits <= 2) {
        // For prices/fiat, standard rounding usually ok, but let's stick to 8 if generic
        // But function has default 8.

        // If the User specifically meant "don't round up visually", floor might be safer,
        // but let's assume standard display behavior with max fraction digits.
        return parsed.toLocaleString("en-US", {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        });
    }

    // To strictly cut off without rounding up at the last digit?
    // e.g. 0.123456789 -> 0.12345678
    const factor = Math.pow(10, fractionDigits);
    const truncated = Math.floor(parsed * factor) / factor;

    return truncated.toLocaleString("en-US", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
        useGrouping: true,
    });
}

export default function CryptoDetail({
    account,
    currency,
    balances,
    spotBalances = [],
    allCurrencyBalances = [],
    rateToUsd,
    walletType,
    tradingPairs = [],
    tradingFeePercent = 0.1,
    transactions = [],
    fiatBalances = {},
    fundingFiatBalances = {},
}) {
    // Calculate total spendable balance (available only, exclude locked/pending)
    const totalBalance = balances
        .filter(
            (b) => b.balance_type !== "locked" && b.balance_type !== "pending",
        )
        .reduce((sum, b) => sum + Number(b.balance), 0);

    // DEBUG: Log fundingFiatBalances to check if data is arriving
    console.log("Funding Fiat Balances Prop:", fundingFiatBalances);

    // Calculate locked balance separately
    const lockedBalance = balances
        .filter(
            (b) => b.balance_type === "locked" || b.balance_type === "pending",
        )
        .reduce((sum, b) => sum + Number(b.balance), 0);

    const usdEquivalent = totalBalance * (rateToUsd || 0);

    // Sort pairs to prioritize ones where this currency is the Quote (e.g. BTC/USDT if we are on USDT page)
    const sortedPairs = [...tradingPairs].sort((a, b) => {
        // Simple heuristic: specific common pairs first, or just alphabetical
        return (a.from + a.to).localeCompare(b.from + b.to);
    });

    const topPairs = sortedPairs.slice(0, 6);
    const otherPairs = sortedPairs.slice(6);

    // Form handling for Buy
    const {
        data: buyData,
        setData: setBuyData,
        post: postBuy,
        processing: processingBuy,
        errors: errorsBuy,
        reset: resetBuy,
    } = useForm({
        pair_id: "",
        amount: "",
        spending_currency: "",
        receiving_currency: "",
    });

    // Form handling for Sell
    const {
        data: sellData,
        setData: setSellData,
        post: postSell,
        processing: processingSell,
        errors: errorsSell,
        reset: resetSell,
    } = useForm({
        pair_id: "",
        amount: "",
        spending_currency: "",
        receiving_currency: "",
    });

    // Normalize wallet type from URL to match Title Case DB values (Spot, Funding, Earn)
    const normalizedWalletType = React.useMemo(() => {
        if (!walletType) return "Spot";
        const w = walletType.toLowerCase();
        if (w === "earning" || w === "earn") return "Earn";
        return w.charAt(0).toUpperCase() + w.slice(1);
    }, [walletType]);

    // Check for Funding Wallet + Fiat restriction (Can only transfer to Earn)
    const isRestrictedFundingFiat = React.useMemo(() => {
        return (
            normalizedWalletType === "Funding" &&
            ["USD", "EUR"].includes(currency)
        );
    }, [normalizedWalletType, currency]);

    // Form handling for Transfer
    const {
        data: transferData,
        setData: setTransferData,
        post: postTransfer,
        processing: processingTransfer,
        errors: errorsTransfer,
        reset: resetTransfer,
    } = useForm({
        amount: "",
        from_wallet: normalizedWalletType,
        to_wallet: normalizedWalletType === "Spot" ? "Funding" : "Spot",
        currency: currency,
    });

    // Update form default if URL changes while component is mounted
    useEffect(() => {
        setTransferData("from_wallet", normalizedWalletType);

        let targetWallet = normalizedWalletType === "Spot" ? "Funding" : "Spot";
        if (isRestrictedFundingFiat) {
            targetWallet = "Earn";
        }
        setTransferData("to_wallet", targetWallet);
    }, [normalizedWalletType, isRestrictedFundingFiat]);

    // Form handling for Convert
    const {
        data: convertData,
        setData: setConvertData,
        post: postConvert,
        processing: processingConvert,
        errors: errorsConvert,
        reset: resetConvert,
    } = useForm({
        from_currency: currency,
        to_currency: "",
        amount: "",
        wallet_type: normalizedWalletType,
    });

    // Update wallet type in convert form when it changes
    useEffect(() => {
        setConvertData((data) => ({
            ...data,
            wallet_type: normalizedWalletType,
        }));
    }, [normalizedWalletType]);

    // Modal States
    let [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    let [isSellModalOpen, setIsSellModalOpen] = useState(false);
    let [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    let [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    let [isDepositFiatModalOpen, setIsDepositFiatModalOpen] = useState(false); // New Modal state for Fiat Deposit
    let [isWithdrawFundingModalOpen, setIsWithdrawFundingModalOpen] =
        useState(false); // New Modal for Funding Withdraw
    let [isWithdrawSelectionModalOpen, setIsWithdrawSelectionModalOpen] =
        useState(false); // New Selection Modal for Withdraw
    let [isWithdrawBlockchainModalOpen, setIsWithdrawBlockchainModalOpen] =
        useState(false); // New Modal for Blockchain Withdraw
    let [isDepositSelectionModalOpen, setIsDepositSelectionModalOpen] =
        useState(false); // New Selection Modal for Deposit
    let [isDepositCryptoModalOpen, setIsDepositCryptoModalOpen] =
        useState(false); // New Modal for Crypto Deposit
    const [selectedDepositNetwork, setSelectedDepositNetwork] = useState(""); // State for selected network in deposit

    const depositAddress = React.useMemo(() => {
        if (!account || !account.account_number) return "Loading...";
        const prefix = ["Morph", "BEP20", "ERC20"].includes(
            selectedDepositNetwork,
        )
            ? "0x71C9"
            : selectedDepositNetwork === "TRC20"
              ? "TKr9X"
              : selectedDepositNetwork === "SOL"
                ? "8xP2q"
                : "1A1zP";
        // Generate a pseudo-static part from account number
        const hash = account.account_number
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return `${prefix}${hash}A${account.account_number.substring(3)}E${(
            hash * 2
        )
            .toString(16)
            .toUpperCase()}`;
    }, [selectedDepositNetwork, account]);

    // Form handling for Deposit Fiat
    const {
        data: depositData,
        setData: setDepositData,
        post: postDeposit,
        processing: processingDeposit,
        errors: errorsDeposit,
        reset: resetDeposit,
    } = useForm({
        amount: "",
        currency: "USD",
    });

    // Form handling for Withdraw Blockchain
    const {
        data: withdrawBlockchainData,
        setData: setWithdrawBlockchainData,
        post: postWithdrawBlockchain,
        processing: processingWithdrawBlockchain,
        errors: errorsWithdrawBlockchain,
        reset: resetWithdrawBlockchain,
    } = useForm({
        address: "",
        network: "",
        amount: "",
        memo: "",
        currency: currency,
        wallet_type: normalizedWalletType,
    });

    // Update wallet type in blockchain withdraw form when it changes
    useEffect(() => {
        setWithdrawBlockchainData((data) => ({
            ...data,
            wallet_type: normalizedWalletType,
        }));
    }, [normalizedWalletType]);

    const [addressValidationError, setAddressValidationError] = useState("");

    // Real-time Address Validation
    useEffect(() => {
        const { address, network } = withdrawBlockchainData;
        let msg = "";

        if (address && network) {
            switch (network) {
                case "Morph":
                case "BEP20":
                case "ERC20":
                    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
                        msg =
                            "Invalid EVM Address (Must start with 0x and contain 40 hex characters)";
                    }
                    break;
                case "TRC20":
                    if (!/^T[a-zA-Z1-9]{33}$/.test(address)) {
                        msg =
                            "Invalid Tron Address (Must start with T and contain 33 alphanumeric characters)";
                    }
                    break;
                case "SOL":
                    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
                        msg =
                            "Invalid Solana Address (Base58, 32-44 characters)";
                    }
                    break;
            }
        }
        setAddressValidationError(msg);
    }, [withdrawBlockchainData.address, withdrawBlockchainData.network]);

    const [feeValidationError, setFeeValidationError] = useState("");

    // Real-time Fee Validation
    useEffect(() => {
        const { amount, network } = withdrawBlockchainData;
        let msg = "";

        if (amount && network) {
            const selectedNetwork = blockchainNetworks.find(
                (n) => n.id === network,
            );
            if (selectedNetwork) {
                const amountNum = parseFloat(amount);
                // Ensure amount is valid number and check against fee
                if (!isNaN(amountNum) && amountNum <= selectedNetwork.fee) {
                    msg = `Amount must be greater than network fee (${selectedNetwork.fee} ${currency})`;
                }
            }
        }
        setFeeValidationError(msg);
    }, [
        withdrawBlockchainData.amount,
        withdrawBlockchainData.network,
        currency,
    ]);

    // Form handling for Withdraw Funding
    const {
        data: withdrawFundingData,
        setData: setWithdrawFundingData,
        post: postWithdrawFunding,
        processing: processingWithdrawFunding,
        errors: errorsWithdrawFunding,
        reset: resetWithdrawFunding,
    } = useForm({
        amount: "",
        currency: "USD",
    });

    // Selection States
    let [selectedPairId, setSelectedPairId] = useState(
        tradingPairs.length > 0 ? tradingPairs[0].id : null,
    );
    let [inputAmount, setInputAmount] = useState("");

    const selectedPair =
        tradingPairs.find((p) => p.id == selectedPairId) ||
        tradingPairs[0] ||
        null;

    // Helper to calculate trade details
    // Now that backend guarantees tradingPairs are formated as [from: Other, to: Currency]
    // Rate is "Amount of Currency (to) per 1 Other (from)"
    const getTradeDetails = (type) => {
        if (!selectedPair) return {};

        if (type === "BUY") {
            // BUY Action: "Buy the First Crypto (from) using Currency (to)"
            // Example: Pair USDT/ETH. "Buy USDT".
            // We Spend ETH (to). We Receive USDT (from).
            return {
                spending: selectedPair.to,
                receiving: selectedPair.from,
                rateLabel: `1 ${selectedPair.from} = ${formatNumber(
                    selectedPair.rate,
                    selectedPair.rate < 1 ? 6 : 2,
                )} ${selectedPair.to}`,
                quotePrice: selectedPair.rate,
                isInverted: false, // Input (Spend To) / Rate = Output (Get From)
            };
        } else {
            // SELL Action: "Sell the First Crypto (from) for Currency (to)"
            // Example: Pair USDT/ETH. "Sell USDT".
            // We Spend USDT (from). We Receive ETH (to).
            return {
                spending: selectedPair.from,
                receiving: selectedPair.to,
                rateLabel: `1 ${selectedPair.from} = ${formatNumber(
                    selectedPair.rate,
                    selectedPair.rate < 1 ? 6 : 2,
                )} ${selectedPair.to}`,
                quotePrice: selectedPair.rate,
                isInverted: true, // Input (Spend From) * Rate = Output (Get To)
            };
        }
    };

    const tradeDetailsBuy = getTradeDetails("BUY");
    const tradeDetailsSell = getTradeDetails("SELL");

    // Determine which calculation to use based on open modal
    const activeDetails = isBuyModalOpen
        ? tradeDetailsBuy
        : isSellModalOpen
          ? tradeDetailsSell
          : {};

    // Sync form data
    React.useEffect(() => {
        if (selectedPair && (isBuyModalOpen || isSellModalOpen)) {
            const details = isBuyModalOpen ? tradeDetailsBuy : tradeDetailsSell;
            const payload = {
                pair_id: selectedPair.id,
                amount: inputAmount,
                spending_currency: details.spending,
                receiving_currency: details.receiving,
            };

            if (isBuyModalOpen) setBuyData(payload);
            if (isSellModalOpen) setSellData(payload);
        }
    }, [inputAmount, selectedPairId, isBuyModalOpen, isSellModalOpen]);

    const handleBuySubmit = () => {
        postBuy(route("accounts.buy-crypto", account.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsBuyModalOpen(false);
                setInputAmount("");
            },
        });
    };

    const handleSellSubmit = () => {
        postSell(route("accounts.sell-crypto", account.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsSellModalOpen(false);
                setInputAmount("");
            },
        });
    };

    const handleTransferSubmit = (e) => {
        e.preventDefault();
        postTransfer(route("accounts.transfer-crypto", account.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsTransferModalOpen(false);
                resetTransfer();
            },
        });
    };

    const handleConvertSubmit = (e) => {
        e.preventDefault();
        postConvert(route("accounts.convert-crypto-action", account.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsConvertModalOpen(false);
                resetConvert();
            },
        });
    };

    const handleDepositSubmit = (e) => {
        e.preventDefault();
        postDeposit(route("accounts.deposit-fiat-funding", account.id), {
            onSuccess: () => {
                setIsDepositFiatModalOpen(false);
                resetDeposit();
            },
        });
    };

    const handleWithdrawFundingSubmit = (e) => {
        e.preventDefault();
        postWithdrawFunding(route("accounts.withdraw-funding", account.id), {
            onSuccess: () => {
                setIsWithdrawFundingModalOpen(false);
                resetWithdrawFunding();
            },
        });
    };

    const handleActionClick = (actionName) => {
        if (actionName === "Buy") {
            // Default to buying Current Currency with something (default USDT if available, or first pair)
            // But 'Buy' modal logic relies on 'selectedPair'.
            // We need to set active state.
            setIsBuyModalOpen(true);
        } else if (actionName === "Sell") {
            setIsSellModalOpen(true);
        } else if (actionName === "Transfer") {
            // Reset form data for Transfer when opening modal
            let targetWallet =
                normalizedWalletType === "Spot" ? "Funding" : "Spot";
            if (isRestrictedFundingFiat) {
                targetWallet = "Earn";
            }
            setTransferData("to_wallet", targetWallet);
            setTransferData("amount", "");
            setIsTransferModalOpen(true);
        } else if (actionName === "Convert") {
            // Reset form data for Convert when opening modal
            // ... logic if needed
            setConvertData((data) => ({
                ...data,
                amount: "",
                to_currency: "",
                wallet_type: normalizedWalletType,
            }));
            setIsConvertModalOpen(true);
        } else if (actionName === "Deposit") {
            // Open Deposit Selection Modal if applicable (Funding or Spot Wallet)
            if (
                normalizedWalletType === "Funding" ||
                normalizedWalletType === "Spot"
            ) {
                if (["USD", "EUR"].includes(currency)) {
                    // For Fiat, go directly to Fiat Deposit
                    setDepositData("currency", currency);
                    setIsDepositFiatModalOpen(true);
                } else {
                    // For Crypto, show selection
                    setIsDepositSelectionModalOpen(true);
                }
            } else {
                alert("Crypto Deposit Feature coming soon.");
            }
        } else if (actionName === "Earn") {
            router.get(route("accounts.crypto.earn", [account.id, currency]));
        } else if (actionName === "Redeem") {
            router.get(route("accounts.crypto.redeem", [account.id, currency]));
        } else if (actionName === "Withdraw") {
            if (
                normalizedWalletType === "Funding" ||
                normalizedWalletType === "Spot"
            ) {
                setIsWithdrawSelectionModalOpen(true);
            } else {
                // Standard withdrawal or alert
                alert(
                    "Standard withdrawal for Spot/Earn currently disabled or handled elsewhere.",
                );
            }
        }
    };

    const handleWithdrawBlockchainSubmit = (e) => {
        e.preventDefault();

        if (addressValidationError || feeValidationError) {
            return;
        }

        postWithdrawBlockchain(
            route("accounts.withdraw-blockchain", account.id),
            {
                onSuccess: () => {
                    setIsWithdrawBlockchainModalOpen(false);
                    resetWithdrawBlockchain();
                },
                preserveScroll: true,
            },
        );
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
    const spendingCurrency = activeDetails.spending || "";
    const spendingBalanceObj = spotBalances.find(
        (b) => b.currency === spendingCurrency,
    );
    const spendingBalance = spendingBalanceObj
        ? Number(spendingBalanceObj.balance)
        : 0;
    const isInsufficientBalance =
        spendingCurrency &&
        inputAmount &&
        parseFloat(inputAmount) > spendingBalance;

    // Processing state
    const isProcessing =
        processingBuy ||
        processingSell ||
        processingTransfer ||
        processingConvert ||
        processingDeposit ||
        processingWithdrawBlockchain ||
        processingWithdrawFunding;

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
                                <p className="text-lg text-gray-500 mt-1 ml-13 capitalize">
                                    {walletType || "Spot"} Wallet •{" "}
                                    {account.account_number}
                                </p>
                            </div>
                            <Link
                                href={route("accounts.show", {
                                    account: account.id,
                                    tab: walletType
                                        ? walletType.toLowerCase()
                                        : "spot",
                                })}
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
                                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mb-4">
                                    {walletType
                                        ? `${walletType} Available`
                                        : "Total Available"}
                                </h2>
                                <div className="flex flex-col md:flex-row items-baseline gap-4">
                                    <span className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                                        {formatNumber(totalBalance, 8)}
                                    </span>
                                    <span className="text-2xl font-bold text-indigo-400">
                                        {currency}
                                    </span>
                                </div>
                                {lockedBalance > 0 && (
                                    <div className="mt-2 text-sm text-gray-400 font-medium">
                                        Locked: {formatNumber(lockedBalance, 8)}{" "}
                                        {currency}
                                    </div>
                                )}

                                <div className="mt-6 flex items-center gap-3">
                                    <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-inner flex items-center gap-2">
                                        <span className="text-gray-400 font-medium">
                                            ≈
                                        </span>
                                        <span className="text-xl font-bold text-white">
                                            ${formatNumber(usdEquivalent, 2)}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400 uppercase">
                                            USD
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">
                                        1 {currency} ≈ $
                                        {formatNumber(rateToUsd, 2)} USD
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-4 gap-y-6 gap-x-2 mb-8 justify-items-center max-w-2xl mx-auto">
                            {[
                                {
                                    name: "Trade",
                                    icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
                                    color: "text-amber-500",
                                },
                                {
                                    name: "Transfer",
                                    icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
                                    color: "text-blue-500",
                                },
                                {
                                    name: "Convert",
                                    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
                                    color: "text-purple-500",
                                },
                                {
                                    name: "Buy",
                                    icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
                                    color: "text-green-500",
                                },
                                {
                                    name: "Sell",
                                    icon: "M20 12H4",
                                    color: "text-red-500",
                                },
                                {
                                    name: "Earn",
                                    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                                    color: "text-indigo-500",
                                },
                                {
                                    name: "Redeem",
                                    icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z",
                                    color: "text-orange-500",
                                },
                                {
                                    name: "Deposit",
                                    icon: "M19 14l-7 7m0 0l-7-7m7 7V3",
                                    color: "text-teal-500",
                                },
                                {
                                    name: "Withdraw",
                                    icon: "M5 10l7-7m0 0l7 7m-7-7v18",
                                    color: "text-gray-500",
                                },
                            ]
                                .filter((action) => {
                                    // Wallet specific visibility rules
                                    // Default (Safe) normalizedWalletType is 'Spot'

                                    if (normalizedWalletType === "Spot") {
                                        // Spot: Hide Earn, Redeem, Trade. Show Deposit & Withdraw
                                        if (
                                            [
                                                "Earn",
                                                "Redeem",
                                                "Trade",
                                            ].includes(action.name)
                                        )
                                            return false;
                                    } else if (
                                        normalizedWalletType === "Funding"
                                    ) {
                                        // Funding: Hide Buy, Sell, Trade, Earn
                                        if (
                                            [
                                                "Buy",
                                                "Sell",
                                                "Trade",
                                                "Earn",
                                                "Redeem",
                                            ].includes(action.name)
                                        )
                                            return false;
                                    } else if (
                                        normalizedWalletType === "Earn"
                                    ) {
                                        // Earn: Show ONLY Earn, Redeem, Transfer
                                        if (
                                            ![
                                                "Earn",
                                                "Redeem",
                                                "Transfer",
                                            ].includes(action.name)
                                        )
                                            return false;
                                    }

                                    return true; // Show by default if rules don't exclude
                                })
                                .map((action) => (
                                    <button
                                        key={action.name}
                                        onClick={() =>
                                            handleActionClick(action.name)
                                        }
                                        className="group flex flex-col items-center gap-2"
                                    >
                                        <div
                                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-2 border-gray-300 shadow-[0_4px_10px_rgb(0,0,0,0.1)] flex items-center justify-center group-hover:shadow-[0_8px_20px_rgb(0,0,0,0.15)] group-hover:-translate-y-1 transition-all duration-300 group-hover:border-amber-400 overflow-hidden relative ${action.color}`}
                                        >
                                            {/* Decorative Background Blob on Hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                            <svg
                                                className="w-6 h-6 relative z-10"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d={action.icon}
                                                />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors">
                                            {action.name}
                                        </span>
                                    </button>
                                ))}
                        </div>

                        {/* Trade Section */}
                        {topPairs.length > 0 && (
                            <div className="mb-10">
                                <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    <svg
                                        className="w-5 h-5 text-amber-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                        />
                                    </svg>
                                    Trade
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                                    {topPairs.map((pair) => (
                                        <div
                                            key={pair.id}
                                            onClick={() =>
                                                setSelectedPairId(pair.id)
                                            }
                                            className={`bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-2 text-left cursor-pointer rounded-xl p-1.5 shadow-[0_4px_10px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_20px_rgb(0,0,0,0.15)] hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden ${
                                                selectedPairId === pair.id
                                                    ? "border-amber-500"
                                                    : "border-gray-300 hover:border-amber-400"
                                            }`}
                                        >
                                            {/* Decorative Background Blob on Hover */}
                                            <div className="absolute -right-6 -top-6 w-16 h-16 bg-gradient-to-br from-amber-200/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-lg"></div>

                                            <div className="flex justify-between items-center mb-1 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[8px] font-black text-gray-700 border border-gray-200 shadow-sm z-10">
                                                            {pair.from.substring(
                                                                0,
                                                                1,
                                                            )}
                                                        </div>
                                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500 border border-gray-200 shadow-inner">
                                                            {pair.to.substring(
                                                                0,
                                                                1,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="font-extrabold text-gray-800 text-xs group-hover:text-amber-800 transition-colors">
                                                        {pair.from}/{pair.to}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-baseline gap-1 relative z-10">
                                                <span className="text-lg font-black text-gray-900 tracking-tight group-hover:text-amber-900 transition-colors">
                                                    {formatNumber(
                                                        pair.rate,
                                                        pair.rate < 1 ? 6 : 2,
                                                    )}
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
                                                console.log(
                                                    "Selected pair:",
                                                    e.target.value,
                                                );
                                            }}
                                        >
                                            <option value="">
                                                More trading pairs for{" "}
                                                {currency}...
                                            </option>
                                            {otherPairs.map((pair) => (
                                                <option
                                                    key={pair.id}
                                                    value={pair.id}
                                                >
                                                    {pair.from}/{pair.to} •{" "}
                                                    {formatNumber(
                                                        pair.rate,
                                                        pair.rate < 1 ? 6 : 2,
                                                    )}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <svg
                                                className="fill-current h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recent Transactions Section */}
                        {transactions &&
                            transactions.data &&
                            transactions.data.length > 0 && (
                                <div className="mb-0">
                                    <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                                        <svg
                                            className="w-5 h-5 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        Recent Transactions
                                    </h3>
                                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                        <ul className="divide-y divide-gray-50">
                                            {transactions.data.map((tx) => {
                                                let isInflow =
                                                    tx.to_currency === currency;

                                                // Explicitly handle Withdrawal as Outflow
                                                if (
                                                    tx.type === "withdrawal" ||
                                                    tx.type === "Withdrawal" ||
                                                    tx.type ===
                                                        "Withdraw from Funding"
                                                ) {
                                                    isInflow = false;
                                                }

                                                // Handle Internal Transfers (Same Account, Different Wallet)
                                                // We need to check description to determine direction relative to current wallet
                                                if (
                                                    tx.from_account_id ===
                                                    tx.to_account_id
                                                ) {
                                                    if (
                                                        tx.type ===
                                                            "Transfer" ||
                                                        tx.type === "transfer"
                                                    ) {
                                                        // Try to parse "from X to Y" OR "[X->Y]"
                                                        let match =
                                                            tx.description?.match(
                                                                /from (\w+) to (\w+)/i,
                                                            );
                                                        if (!match) {
                                                            match =
                                                                tx.description?.match(
                                                                    /\[(\w+)->(\w+)\]/,
                                                                );
                                                        }

                                                        if (match) {
                                                            const fromWallet =
                                                                match[1]; // e.g. Spot
                                                            const toWallet =
                                                                match[2]; // e.g. Funding

                                                            // Normalize current wallet type for comparison
                                                            // normalizedWalletType is already Title Case (Spot, Funding, Earn) due to useMemo

                                                            if (
                                                                normalizedWalletType.toLowerCase() ===
                                                                fromWallet.toLowerCase()
                                                            ) {
                                                                isInflow = false; // Sent from current wallet
                                                            } else if (
                                                                normalizedWalletType.toLowerCase() ===
                                                                toWallet.toLowerCase()
                                                            ) {
                                                                isInflow = true; // Received in current wallet
                                                            }
                                                        }
                                                    } else if (
                                                        tx.type ===
                                                            "conversion" ||
                                                        tx.type === "Conversion"
                                                    ) {
                                                        // Conversions happen WITHIN same wallet (except advanced cases not yet implemented)
                                                        // OR across currencies.
                                                        // Logic: if current currency is FromCurrency -> Outflow.
                                                        //        if current currency is ToCurrency   -> Inflow.

                                                        // The default "tx.to_currency === currency" check at top is usually sufficient for Conversions
                                                        // because conversions change currency.
                                                        // Example: Convert BTC to USDT.
                                                        // Page BTC: tx.to=USDT != BTC. isInflow=False. Correct.
                                                        // Page USDT: tx.to=USDT == USDT. isInflow=True. Correct.

                                                        // Explicit check just to be safe
                                                        if (
                                                            tx.from_currency ===
                                                            currency
                                                        )
                                                            isInflow = false;
                                                        if (
                                                            tx.to_currency ===
                                                            currency
                                                        )
                                                            isInflow = true;
                                                    }
                                                }

                                                const isTrade = [
                                                    "Spot Trade",
                                                    "Buy Crypto",
                                                    "Sell Crypto",
                                                ].includes(tx.type);

                                                // Calculate details for Trade Log
                                                // Gross Received = Amount Spent / Exchange Rate (if rate is defined as Spent/Received)
                                                // Wait, exchange_rate in DB is stored as: Spent / GrossReceived.
                                                // So GrossReceived = Spent / Rate.
                                                // Let's verify. in Controller: 'exchange_rate' => $amount / $rawReceiveAmount
                                                // Validated.
                                                let grossReceived = 0;
                                                let feeAmount = 0;
                                                if (
                                                    isTrade &&
                                                    tx.exchange_rate > 0
                                                ) {
                                                    grossReceived =
                                                        Number(tx.amount) /
                                                        Number(
                                                            tx.exchange_rate,
                                                        );
                                                    feeAmount =
                                                        grossReceived -
                                                        Number(
                                                            tx.converted_amount,
                                                        );
                                                }

                                                return (
                                                    <li
                                                        key={tx.id}
                                                        className="p-4 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex justify-between items-center z-10 relative">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`p-2 rounded-full ${
                                                                        tx.status ===
                                                                            "rejected" ||
                                                                        tx.status ===
                                                                            "failed"
                                                                            ? "bg-red-100 text-red-600"
                                                                            : tx.status ===
                                                                                "pending"
                                                                              ? "bg-yellow-100 text-yellow-600"
                                                                              : isInflow
                                                                                ? "bg-green-100 text-green-600"
                                                                                : "bg-red-100 text-red-600"
                                                                    }`}
                                                                >
                                                                    <svg
                                                                        className="w-5 h-5"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        {isInflow ? (
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                                                            />
                                                                        ) : (
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                                                                            />
                                                                        )}
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-800">
                                                                        {
                                                                            tx.type
                                                                        }{" "}
                                                                        {(() => {
                                                                            const s =
                                                                                (
                                                                                    tx.status ||
                                                                                    ""
                                                                                ).toLowerCase();
                                                                            if (
                                                                                s ===
                                                                                "pending"
                                                                            )
                                                                                return "Pending";
                                                                            if (
                                                                                s ===
                                                                                    "rejected" ||
                                                                                s ===
                                                                                    "failed"
                                                                            )
                                                                                return "Rejected";
                                                                            return isInflow
                                                                                ? "Received"
                                                                                : "Sent";
                                                                        })()}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400">
                                                                        {new Date(
                                                                            tx.created_at,
                                                                        ).toLocaleString(
                                                                            "en-US",
                                                                            {
                                                                                dateStyle:
                                                                                    "medium",
                                                                                timeStyle:
                                                                                    "short",
                                                                            },
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p
                                                                    className={`text-sm font-bold ${
                                                                        tx.status ===
                                                                            "rejected" ||
                                                                        tx.status ===
                                                                            "failed"
                                                                            ? "text-red-600"
                                                                            : tx.status ===
                                                                                "pending"
                                                                              ? "text-yellow-600"
                                                                              : isInflow
                                                                                ? "text-green-600"
                                                                                : "text-gray-900"
                                                                    }`}
                                                                >
                                                                    {isInflow
                                                                        ? "+"
                                                                        : "-"}
                                                                    {formatNumber(
                                                                        isInflow
                                                                            ? Number(
                                                                                  tx.converted_amount,
                                                                              ) >
                                                                              0
                                                                                ? tx.converted_amount
                                                                                : tx.amount
                                                                            : tx.amount,
                                                                        8,
                                                                    )}{" "}
                                                                    {isInflow
                                                                        ? tx.to_currency
                                                                        : tx.from_currency}
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
                                                                    <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                                                        Spent
                                                                    </span>
                                                                    <span className="font-bold text-gray-700">
                                                                        {formatNumber(
                                                                            tx.amount,
                                                                            8,
                                                                        )}{" "}
                                                                        {
                                                                            tx.from_currency
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                                                        Exec.
                                                                        Price
                                                                    </span>
                                                                    <span className="font-bold text-gray-700">
                                                                        1{" "}
                                                                        {
                                                                            tx.to_currency
                                                                        }{" "}
                                                                        ≈{" "}
                                                                        {formatNumber(
                                                                            tx.exchange_rate,
                                                                            2,
                                                                        )}{" "}
                                                                        {
                                                                            tx.from_currency
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                                                        Gross
                                                                        Received
                                                                    </span>
                                                                    <span className="font-bold text-gray-700">
                                                                        {formatNumber(
                                                                            grossReceived,
                                                                            8,
                                                                        )}{" "}
                                                                        {
                                                                            tx.to_currency
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                                                        Fee
                                                                        Deducted
                                                                    </span>
                                                                    <span className="font-bold text-red-500">
                                                                        -
                                                                        {formatNumber(
                                                                            feeAmount,
                                                                            8,
                                                                        )}{" "}
                                                                        {
                                                                            tx.to_currency
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        {/* Pagination */}
                                        {transactions.links &&
                                            transactions.links.length > 3 && (
                                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 flex justify-between sm:hidden">
                                                            {transactions.prev_page_url && (
                                                                <Link
                                                                    href={
                                                                        transactions.prev_page_url
                                                                    }
                                                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                                >
                                                                    Previous
                                                                </Link>
                                                            )}
                                                            {transactions.next_page_url && (
                                                                <Link
                                                                    href={
                                                                        transactions.next_page_url
                                                                    }
                                                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                                >
                                                                    Next
                                                                </Link>
                                                            )}
                                                        </div>
                                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                            <div>
                                                                <p className="text-sm text-gray-700">
                                                                    Showing{" "}
                                                                    <span className="font-medium">
                                                                        {
                                                                            transactions.from
                                                                        }
                                                                    </span>{" "}
                                                                    to{" "}
                                                                    <span className="font-medium">
                                                                        {
                                                                            transactions.to
                                                                        }
                                                                    </span>{" "}
                                                                    of{" "}
                                                                    <span className="font-medium">
                                                                        {
                                                                            transactions.total
                                                                        }
                                                                    </span>{" "}
                                                                    results
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <nav
                                                                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                                                    aria-label="Pagination"
                                                                >
                                                                    {transactions.links.map(
                                                                        (
                                                                            link,
                                                                            k,
                                                                        ) => {
                                                                            // Use a span for links without URLs (ellipsis, current page, disabled)
                                                                            // Use Link only when a URL exists
                                                                            const Component =
                                                                                link.url
                                                                                    ? Link
                                                                                    : "span";

                                                                            return (
                                                                                <Component
                                                                                    key={
                                                                                        k
                                                                                    }
                                                                                    href={
                                                                                        link.url ||
                                                                                        undefined
                                                                                    }
                                                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                                        link.active
                                                                                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                                                                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                                                    } ${
                                                                                        !link.url
                                                                                            ? "opacity-50 cursor-not-allowed"
                                                                                            : ""
                                                                                    } ${
                                                                                        k ===
                                                                                        0
                                                                                            ? "rounded-l-md"
                                                                                            : ""
                                                                                    } ${
                                                                                        k ===
                                                                                        transactions
                                                                                            .links
                                                                                            .length -
                                                                                            1
                                                                                            ? "rounded-r-md"
                                                                                            : ""
                                                                                    }`}
                                                                                >
                                                                                    <span
                                                                                        dangerouslySetInnerHTML={{
                                                                                            __html: link.label,
                                                                                        }}
                                                                                    ></span>
                                                                                </Component>
                                                                            );
                                                                        },
                                                                    )}
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
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setIsBuyModalOpen(false)}
                >
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
                                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                />
                                            </svg>
                                        </div>
                                        Buy {activeDetails.receiving}
                                    </Dialog.Title>

                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Select Trading Pair
                                            </label>
                                            <select
                                                value={selectedPairId || ""}
                                                onChange={(e) =>
                                                    setSelectedPairId(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 font-bold text-gray-800"
                                            >
                                                {tradingPairs.map((pair) => (
                                                    <option
                                                        key={pair.id}
                                                        value={pair.id}
                                                    >
                                                        {pair.from}/{pair.to}{" "}
                                                        (Rate:{" "}
                                                        {formatNumber(
                                                            pair.rate,
                                                            pair.rate < 1
                                                                ? 6
                                                                : 2,
                                                        )}
                                                        )
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedPair && (
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                                    <span>Rate Info</span>
                                                    <span className="font-mono">
                                                        {
                                                            activeDetails.rateLabel
                                                        }
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">
                                                                I want to spend
                                                            </label>
                                                            <span
                                                                className={`text-xs font-bold ${
                                                                    isInsufficientBalance
                                                                        ? "text-red-500"
                                                                        : "text-gray-500"
                                                                }`}
                                                            >
                                                                Available:{" "}
                                                                {formatNumber(
                                                                    spendingBalance,
                                                                    8,
                                                                )}{" "}
                                                                {
                                                                    spendingCurrency
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    inputAmount
                                                                }
                                                                onChange={(e) =>
                                                                    setInputAmount(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className={`block w-full rounded-xl pl-4 pr-24 py-3 focus:ring-indigo-500 sm:text-lg font-bold ${
                                                                    isInsufficientBalance
                                                                        ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500"
                                                                        : "border-gray-300 focus:border-indigo-500"
                                                                }`}
                                                                placeholder="0.00"
                                                                step="any"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setInputAmount(
                                                                            spendingBalance,
                                                                        )
                                                                    }
                                                                    className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                                                                >
                                                                    MAX
                                                                </button>
                                                                <span
                                                                    className={`${
                                                                        isInsufficientBalance
                                                                            ? "text-red-500"
                                                                            : "text-gray-500"
                                                                    } sm:text-sm font-bold`}
                                                                >
                                                                    {
                                                                        activeDetails.spending
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isInsufficientBalance && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                Insufficient{" "}
                                                                {
                                                                    spendingCurrency
                                                                }{" "}
                                                                balance in Spot
                                                                Wallet.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-center">
                                                        <svg
                                                            className="w-5 h-5 text-gray-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                                            />
                                                        </svg>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">
                                                                I will receive
                                                                (Net)
                                                            </label>
                                                        </div>

                                                        {parseFloat(
                                                            inputAmount,
                                                        ) > 0 && (
                                                            <div className="mb-2 px-2 py-1 bg-gray-50 rounded text-xs text-gray-500 flex flex-col gap-1">
                                                                <div className="flex justify-between">
                                                                    <span>
                                                                        Market
                                                                        Value:
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        {formatNumber(
                                                                            rawReceive,
                                                                            8,
                                                                        )}{" "}
                                                                        {
                                                                            activeDetails.receiving
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-red-500">
                                                                    <span>
                                                                        Fee (
                                                                        {
                                                                            tradingFeePercent
                                                                        }
                                                                        %):
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        -
                                                                        {formatNumber(
                                                                            feeAmount,
                                                                            8,
                                                                        )}{" "}
                                                                        {
                                                                            activeDetails.receiving
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between font-bold text-gray-700">
                                                                    <span>
                                                                        Net
                                                                        Received:
                                                                    </span>
                                                                    <span>
                                                                        {formatNumber(
                                                                            estimatedReceive,
                                                                            8,
                                                                        )}{" "}
                                                                        {
                                                                            activeDetails.receiving
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="relative rounded-md shadow-sm">
                                                            <div className="block w-full rounded-xl bg-gray-100 border-transparent pl-4 pr-16 py-3 text-gray-500 sm:text-lg font-bold">
                                                                {formatNumber(
                                                                    estimatedReceive,
                                                                    8,
                                                                )}
                                                            </div>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                                                <span className="text-gray-500 sm:text-sm font-bold">
                                                                    {
                                                                        activeDetails.receiving
                                                                    }
                                                                </span>
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
                                            disabled={
                                                isInsufficientBalance ||
                                                !inputAmount ||
                                                parseFloat(inputAmount) <= 0 ||
                                                isProcessing
                                            }
                                            className={`flex-1 flex justify-center items-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors uppercase tracking-wider ${
                                                isInsufficientBalance ||
                                                !inputAmount ||
                                                parseFloat(inputAmount) <= 0 ||
                                                isProcessing
                                                    ? "bg-gray-300 cursor-not-allowed"
                                                    : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                                            }`}
                                            onClick={handleBuySubmit}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <svg
                                                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        ></path>
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
                                            onClick={() =>
                                                setIsBuyModalOpen(false)
                                            }
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
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setIsSellModalOpen(false)}
                >
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
                                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                                />
                                            </svg>
                                        </div>
                                        Sell {activeDetails.spending}
                                    </Dialog.Title>

                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Select Trading Pair
                                            </label>
                                            <select
                                                value={selectedPairId || ""}
                                                onChange={(e) =>
                                                    setSelectedPairId(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 py-3 font-bold text-gray-800"
                                            >
                                                {tradingPairs.map((pair) => (
                                                    <option
                                                        key={pair.id}
                                                        value={pair.id}
                                                    >
                                                        {pair.from}/{pair.to}{" "}
                                                        (Rate:{" "}
                                                        {formatNumber(
                                                            pair.rate,
                                                            pair.rate < 1
                                                                ? 6
                                                                : 2,
                                                        )}
                                                        )
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedPair && (
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                                    <span>Rate Info</span>
                                                    <span className="font-mono">
                                                        {
                                                            activeDetails.rateLabel
                                                        }
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">
                                                                I want to Sell
                                                                (Spend)
                                                            </label>
                                                            <span
                                                                className={`text-xs font-bold ${
                                                                    isInsufficientBalance
                                                                        ? "text-red-500"
                                                                        : "text-gray-500"
                                                                }`}
                                                            >
                                                                Available:{" "}
                                                                {formatNumber(
                                                                    spendingBalance,
                                                                    8,
                                                                )}{" "}
                                                                {
                                                                    spendingCurrency
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    inputAmount
                                                                }
                                                                onChange={(e) =>
                                                                    setInputAmount(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className={`block w-full rounded-xl pl-4 pr-24 py-3 focus:ring-red-500 sm:text-lg font-bold ${
                                                                    isInsufficientBalance
                                                                        ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500"
                                                                        : "border-gray-300 focus:border-red-500"
                                                                }`}
                                                                placeholder="0.00"
                                                                step="any"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setInputAmount(
                                                                            spendingBalance,
                                                                        )
                                                                    }
                                                                    className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                                                                >
                                                                    MAX
                                                                </button>
                                                                <span
                                                                    className={`${
                                                                        isInsufficientBalance
                                                                            ? "text-red-500"
                                                                            : "text-gray-500"
                                                                    } sm:text-sm font-bold`}
                                                                >
                                                                    {
                                                                        activeDetails.spending
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isInsufficientBalance && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                Insufficient{" "}
                                                                {
                                                                    spendingCurrency
                                                                }{" "}
                                                                balance.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-center">
                                                        <svg
                                                            className="w-5 h-5 text-gray-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                                            />
                                                        </svg>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">
                                                                I will receive
                                                                (Net)
                                                            </label>
                                                        </div>

                                                        {parseFloat(
                                                            inputAmount,
                                                        ) > 0 && (
                                                            <div className="mb-2 px-2 py-1 bg-gray-50 rounded text-xs text-gray-500 flex flex-col gap-1">
                                                                <div className="flex justify-between">
                                                                    <span>
                                                                        Market
                                                                        Value:
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        {formatNumber(
                                                                            rawReceive,
                                                                            8,
                                                                        )}{" "}
                                                                        {
                                                                            activeDetails.receiving
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-red-500">
                                                                    <span>
                                                                        Fee (
                                                                        {
                                                                            tradingFeePercent
                                                                        }
                                                                        %):
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        -
                                                                        {formatNumber(
                                                                            feeAmount,
                                                                            8,
                                                                        )}{" "}
                                                                        {
                                                                            activeDetails.receiving
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between font-bold text-gray-700">
                                                                    <span>
                                                                        Net
                                                                        Received:
                                                                    </span>
                                                                    <span>
                                                                        {formatNumber(
                                                                            estimatedReceive,
                                                                            8,
                                                                        )}{" "}
                                                                        {
                                                                            activeDetails.receiving
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="relative rounded-md shadow-sm">
                                                            <div className="block w-full rounded-xl bg-gray-100 border-transparent pl-4 pr-16 py-3 text-gray-500 sm:text-lg font-bold">
                                                                {formatNumber(
                                                                    estimatedReceive,
                                                                    8,
                                                                )}
                                                            </div>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                                                <span className="text-gray-500 sm:text-sm font-bold">
                                                                    {
                                                                        activeDetails.receiving
                                                                    }
                                                                </span>
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
                                            disabled={
                                                isInsufficientBalance ||
                                                !inputAmount ||
                                                parseFloat(inputAmount) <= 0 ||
                                                isProcessing
                                            }
                                            className={`flex-1 flex justify-center items-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors uppercase tracking-wider ${
                                                isInsufficientBalance ||
                                                !inputAmount ||
                                                parseFloat(inputAmount) <= 0 ||
                                                isProcessing
                                                    ? "bg-gray-300 cursor-not-allowed"
                                                    : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                            }`}
                                            onClick={handleSellSubmit}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <svg
                                                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        ></path>
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
                                            onClick={() =>
                                                setIsSellModalOpen(false)
                                            }
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
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setIsTransferModalOpen(false)}
                >
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
                                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                                />
                                            </svg>
                                        </div>
                                        Transfer {currency}
                                    </Dialog.Title>

                                    <form
                                        onSubmit={handleTransferSubmit}
                                        className="mt-4 space-y-4"
                                    >
                                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                                                    From
                                                </label>
                                                <select
                                                    value={
                                                        transferData.from_wallet
                                                    }
                                                    onChange={(e) =>
                                                        setTransferData(
                                                            "from_wallet",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full bg-transparent border-none p-0 font-bold text-gray-800 focus:ring-0 text-sm"
                                                >
                                                    {[
                                                        "Spot",
                                                        "Funding",
                                                        "Earn",
                                                    ].map((w) => (
                                                        <option
                                                            key={w}
                                                            value={w}
                                                            disabled={
                                                                w ===
                                                                transferData.to_wallet
                                                            }
                                                        >
                                                            {w}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="text-gray-400">
                                                <svg
                                                    className="w-6 h-6"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                                                    To
                                                </label>
                                                <select
                                                    value={
                                                        transferData.to_wallet
                                                    }
                                                    onChange={(e) =>
                                                        setTransferData(
                                                            "to_wallet",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full bg-transparent border-none p-0 font-bold text-gray-800 focus:ring-0 text-sm text-right"
                                                    dir="rtl"
                                                >
                                                    {[
                                                        "Spot",
                                                        "Funding",
                                                        "Earn",
                                                    ].map((w) => {
                                                        if (
                                                            isRestrictedFundingFiat &&
                                                            w === "Spot"
                                                        )
                                                            return null;
                                                        return (
                                                            <option
                                                                key={w}
                                                                value={w}
                                                                disabled={
                                                                    w ===
                                                                    transferData.from_wallet
                                                                }
                                                            >
                                                                {w}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            {(() => {
                                                const sourceWallet =
                                                    allCurrencyBalances.find(
                                                        (b) =>
                                                            b.wallet_type.toLowerCase() ===
                                                            transferData.from_wallet.toLowerCase(),
                                                    );
                                                const maxTransfer = sourceWallet
                                                    ? parseFloat(
                                                          sourceWallet.balance,
                                                      )
                                                    : 0;
                                                const currentAmount =
                                                    parseFloat(
                                                        transferData.amount ||
                                                            0,
                                                    );
                                                const isExceeding =
                                                    currentAmount > maxTransfer;

                                                return (
                                                    <>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">
                                                                Amount
                                                            </label>
                                                            <span
                                                                className={`text-xs font-bold ${
                                                                    isExceeding
                                                                        ? "text-red-500"
                                                                        : "text-gray-500"
                                                                }`}
                                                            >
                                                                Available (
                                                                {
                                                                    transferData.from_wallet
                                                                }
                                                                ):{" "}
                                                                {formatNumber(
                                                                    maxTransfer,
                                                                    8,
                                                                )}{" "}
                                                                {currency}
                                                            </span>
                                                        </div>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    transferData.amount
                                                                }
                                                                onChange={(e) =>
                                                                    setTransferData(
                                                                        "amount",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className={`block w-full rounded-xl pl-4 pr-24 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-lg font-bold ${
                                                                    isExceeding
                                                                        ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                                        : ""
                                                                }`}
                                                                placeholder="0.00"
                                                                step="any"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setTransferData(
                                                                            "amount",
                                                                            maxTransfer,
                                                                        )
                                                                    }
                                                                    className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                                                >
                                                                    MAX
                                                                </button>
                                                                <span
                                                                    className={`${
                                                                        isExceeding
                                                                            ? "text-red-500"
                                                                            : "text-gray-500"
                                                                    } sm:text-sm font-bold`}
                                                                >
                                                                    {currency}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isExceeding && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                Amount exceeds
                                                                available
                                                                balance.
                                                            </p>
                                                        )}
                                                        {errorsTransfer.amount && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                {
                                                                    errorsTransfer.amount
                                                                }
                                                            </p>
                                                        )}

                                                        {/* Hidden input to pass validation state to parent form if needed, but here we control button directly */}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            {(() => {
                                                const sourceWallet =
                                                    allCurrencyBalances.find(
                                                        (b) =>
                                                            b.wallet_type.toLowerCase() ===
                                                            transferData.from_wallet.toLowerCase(),
                                                    );
                                                const maxTransfer = sourceWallet
                                                    ? parseFloat(
                                                          sourceWallet.balance,
                                                      )
                                                    : 0;
                                                const currentAmount =
                                                    parseFloat(
                                                        transferData.amount ||
                                                            0,
                                                    );
                                                const isValid =
                                                    !processingTransfer &&
                                                    transferData.amount &&
                                                    currentAmount > 0 &&
                                                    currentAmount <=
                                                        maxTransfer;

                                                return (
                                                    <button
                                                        type="submit"
                                                        disabled={!isValid}
                                                        className={`flex-1 flex justify-center items-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors uppercase tracking-wider ${
                                                            !isValid
                                                                ? "bg-gray-300 cursor-not-allowed"
                                                                : "bg-blue-600 hover:bg-blue-700"
                                                        }`}
                                                    >
                                                        {processingTransfer
                                                            ? "Processing..."
                                                            : "Confirm Transfer"}
                                                    </button>
                                                );
                                            })()}

                                            <button
                                                type="button"
                                                disabled={processingTransfer}
                                                className="flex-shrink-0 justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                onClick={() =>
                                                    setIsTransferModalOpen(
                                                        false,
                                                    )
                                                }
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
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setIsConvertModalOpen(false)}
                >
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
                                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                                />
                                            </svg>
                                        </div>
                                        Convert {currency} (
                                        {convertData.wallet_type} Wallet)
                                    </Dialog.Title>

                                    <form
                                        onSubmit={handleConvertSubmit}
                                        className="mt-4 space-y-4"
                                    >
                                        {/* From Currency (Read Only) */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                                                From
                                            </label>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-900 text-lg">
                                                    {currency}
                                                </span>
                                                <span className="text-xs font-bold text-gray-500">
                                                    Available:{" "}
                                                    {formatNumber(
                                                        allCurrencyBalances.find(
                                                            (b) =>
                                                                b.wallet_type.toLowerCase() ===
                                                                convertData.wallet_type.toLowerCase(),
                                                        )?.balance || 0,
                                                        8,
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* To Currency Selection */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase block">
                                                    To
                                                </label>
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

                                                            const pair =
                                                                tradingPairs.find(
                                                                    (p) =>
                                                                        p.from ===
                                                                        convertData.to_currency,
                                                                );
                                                            if (pair) {
                                                                const rate =
                                                                    1 /
                                                                    pair.rate;
                                                                return `1 ${currency} ≈ ${formatNumber(
                                                                    rate,
                                                                    rate < 1
                                                                        ? 6
                                                                        : 2,
                                                                )} ${
                                                                    convertData.to_currency
                                                                }`;
                                                            }
                                                            return "Best Market Rate";
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                            <select
                                                value={convertData.to_currency}
                                                onChange={(e) =>
                                                    setConvertData(
                                                        "to_currency",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 py-3 font-bold text-gray-800"
                                            >
                                                <option value="" disabled>
                                                    Select Currency
                                                </option>
                                                {(() => {
                                                    const baseCurrencies = [
                                                        "BTC",
                                                        "ETH",
                                                        "USDT",
                                                        "USDC",
                                                        "BNB",
                                                    ];

                                                    // Add Fiat for Funding Transaction
                                                    if (
                                                        convertData.wallet_type ===
                                                        "Funding"
                                                    ) {
                                                        baseCurrencies.push(
                                                            "USD",
                                                            "EUR",
                                                        );
                                                    }

                                                    return baseCurrencies;
                                                })()
                                                    .filter(
                                                        (c) => c !== currency,
                                                    )
                                                    .map((c) => (
                                                        <option
                                                            key={c}
                                                            value={c}
                                                        >
                                                            {c}
                                                        </option>
                                                    ))}
                                            </select>
                                            {errorsConvert.to_currency && (
                                                <p className="mt-1 text-xs text-red-600 font-bold">
                                                    {errorsConvert.to_currency}
                                                </p>
                                            )}
                                        </div>

                                        {/* Amount Input */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            {(() => {
                                                const sourceWallet =
                                                    allCurrencyBalances.find(
                                                        (b) =>
                                                            b.wallet_type.toLowerCase() ===
                                                            convertData.wallet_type.toLowerCase(),
                                                    );
                                                const maxAmount = sourceWallet
                                                    ? parseFloat(
                                                          sourceWallet.balance,
                                                      )
                                                    : 0;
                                                const currentAmount =
                                                    parseFloat(
                                                        convertData.amount || 0,
                                                    );
                                                const isExceeding =
                                                    currentAmount > maxAmount;

                                                return (
                                                    <>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">
                                                                Amount to
                                                                Convert
                                                            </label>
                                                        </div>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    convertData.amount
                                                                }
                                                                onChange={(e) =>
                                                                    setConvertData(
                                                                        "amount",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className={`block w-full rounded-xl pl-4 pr-24 py-3 border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-lg font-bold ${
                                                                    isExceeding
                                                                        ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                                        : ""
                                                                }`}
                                                                placeholder="0.00"
                                                                step="any"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setConvertData(
                                                                            "amount",
                                                                            maxAmount,
                                                                        )
                                                                    }
                                                                    className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
                                                                >
                                                                    MAX
                                                                </button>
                                                                <span
                                                                    className={`${
                                                                        isExceeding
                                                                            ? "text-red-500"
                                                                            : "text-gray-500"
                                                                    } sm:text-sm font-bold`}
                                                                >
                                                                    {currency}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isExceeding && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                Amount exceeds
                                                                available
                                                                balance.
                                                            </p>
                                                        )}
                                                        {errorsConvert.amount && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                {
                                                                    errorsConvert.amount
                                                                }
                                                            </p>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* You Will Receive Section */}
                                        {convertData.to_currency &&
                                            convertData.amount > 0 && (
                                                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-xs font-bold text-purple-600 uppercase">
                                                            You Will Receive
                                                        </label>
                                                        <span className="text-xs text-gray-500">
                                                            (Estimated)
                                                        </span>
                                                    </div>
                                                    {(() => {
                                                        // Find the pair to calculate conversion
                                                        // tradingPairs: {from: OTHER, to: CURRENT, rate: CURRENT_PER_OTHER}
                                                        // We convert CURRENT -> OTHER
                                                        // 1 CURRENT = (1/rate) OTHER
                                                        const pair =
                                                            tradingPairs.find(
                                                                (p) =>
                                                                    p.from ===
                                                                    convertData.to_currency,
                                                            );

                                                        if (!pair) {
                                                            return (
                                                                <div className="text-center text-gray-500 text-sm">
                                                                    Rate not
                                                                    available
                                                                </div>
                                                            );
                                                        }

                                                        const conversionRate =
                                                            1 / pair.rate;
                                                        const inputAmount =
                                                            parseFloat(
                                                                convertData.amount,
                                                            ) || 0;
                                                        const feePercent =
                                                            tradingFeePercent ||
                                                            0.1;
                                                        const feeAmount =
                                                            inputAmount *
                                                            (feePercent / 100);
                                                        const amountAfterFee =
                                                            inputAmount -
                                                            feeAmount;
                                                        const receivedAmount =
                                                            amountAfterFee *
                                                            conversionRate;

                                                        return (
                                                            <>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-2xl font-bold text-purple-700">
                                                                        {formatNumber(
                                                                            receivedAmount,
                                                                            receivedAmount <
                                                                                1
                                                                                ? 8
                                                                                : 4,
                                                                        )}
                                                                    </span>
                                                                    <span className="text-lg font-bold text-purple-600">
                                                                        {
                                                                            convertData.to_currency
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t border-purple-200 space-y-1">
                                                                    <div className="flex justify-between text-xs text-gray-600">
                                                                        <span>
                                                                            Rate
                                                                        </span>
                                                                        <span>
                                                                            1{" "}
                                                                            {
                                                                                currency
                                                                            }{" "}
                                                                            ={" "}
                                                                            {formatNumber(
                                                                                conversionRate,
                                                                                conversionRate <
                                                                                    1
                                                                                    ? 6
                                                                                    : 2,
                                                                            )}{" "}
                                                                            {
                                                                                convertData.to_currency
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs text-gray-600">
                                                                        <span>
                                                                            Fee
                                                                            (
                                                                            {
                                                                                feePercent
                                                                            }
                                                                            %)
                                                                        </span>
                                                                        <span>
                                                                            -
                                                                            {formatNumber(
                                                                                feeAmount,
                                                                                8,
                                                                            )}{" "}
                                                                            {
                                                                                currency
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                        <div className="mt-6 flex gap-3">
                                            {(() => {
                                                const sourceWallet =
                                                    allCurrencyBalances.find(
                                                        (b) =>
                                                            b.wallet_type.toLowerCase() ===
                                                            convertData.wallet_type.toLowerCase(),
                                                    );
                                                const maxAmount = sourceWallet
                                                    ? parseFloat(
                                                          sourceWallet.balance,
                                                      )
                                                    : 0;
                                                const currentAmount =
                                                    parseFloat(
                                                        convertData.amount || 0,
                                                    );
                                                const isValid =
                                                    !processingConvert &&
                                                    convertData.to_currency &&
                                                    currentAmount > 0 &&
                                                    currentAmount <= maxAmount;

                                                return (
                                                    <button
                                                        type="submit"
                                                        disabled={!isValid}
                                                        className={`flex-1 flex justify-center items-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors uppercase tracking-wider ${
                                                            !isValid
                                                                ? "bg-gray-300 cursor-not-allowed"
                                                                : "bg-purple-600 hover:bg-purple-700"
                                                        }`}
                                                    >
                                                        {processingConvert
                                                            ? "Processing..."
                                                            : "Confirm Conversion"}
                                                    </button>
                                                );
                                            })()}
                                            <button
                                                type="button"
                                                disabled={processingConvert}
                                                className="flex-shrink-0 justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                                                onClick={() =>
                                                    setIsConvertModalOpen(false)
                                                }
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

            {/* Deposit Fiat Modal */}
            <Transition appear show={isDepositFiatModalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setIsDepositFiatModalOpen(false)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
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
                                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
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
                                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                                />
                                            </svg>
                                        </div>
                                        Deposit Fiat to Funding
                                    </Dialog.Title>

                                    <form
                                        onSubmit={handleDepositSubmit}
                                        className="mt-4 space-y-4"
                                    >
                                        <div className="text-sm text-gray-500 bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                            Transfer funds from your internal{" "}
                                            <strong>Fiat Account</strong> to
                                            your <strong>Funding Wallet</strong>
                                            .
                                        </div>

                                        {/* Currency Selection */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                                                Select Currency
                                            </label>
                                            <select
                                                value={depositData.currency}
                                                onChange={(e) =>
                                                    setDepositData(
                                                        "currency",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 py-3 font-bold text-gray-800"
                                            >
                                                <option value="USD">
                                                    USD - US Dollar
                                                </option>
                                                <option value="EUR">
                                                    EUR - Euro
                                                </option>
                                            </select>
                                        </div>

                                        {/* Source: Fiat Balance */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                                                Source (Fiat Account)
                                            </label>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-900 text-lg">
                                                    {depositData.currency}
                                                </span>
                                                <span className="text-xs font-bold text-gray-500">
                                                    Available:{" "}
                                                    {formatNumber(
                                                        fiatBalances[
                                                            depositData.currency
                                                        ] || 0,
                                                        8,
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount Input */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            {(() => {
                                                const maxAmount = parseFloat(
                                                    fiatBalances[
                                                        depositData.currency
                                                    ] || 0,
                                                );
                                                const currentAmount =
                                                    parseFloat(
                                                        depositData.amount || 0,
                                                    );
                                                const isExceeding =
                                                    currentAmount > maxAmount;

                                                return (
                                                    <>
                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                                                            Deposit Amount
                                                        </label>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    depositData.amount
                                                                }
                                                                onChange={(e) =>
                                                                    setDepositData(
                                                                        "amount",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className={`block w-full rounded-xl pl-4 pr-24 py-3 border-gray-300 focus:border-teal-500 focus:ring-teal-500 sm:text-lg font-bold ${
                                                                    isExceeding
                                                                        ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                                        : ""
                                                                }`}
                                                                placeholder="0.00"
                                                                min="0.01"
                                                                step="any"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setDepositData(
                                                                            "amount",
                                                                            maxAmount,
                                                                        )
                                                                    }
                                                                    className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded hover:bg-teal-100 transition-colors"
                                                                >
                                                                    MAX
                                                                </button>
                                                                <span
                                                                    className={`${
                                                                        isExceeding
                                                                            ? "text-red-500"
                                                                            : "text-gray-500"
                                                                    } sm:text-sm font-bold`}
                                                                >
                                                                    {
                                                                        depositData.currency
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isExceeding && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                Amount exceeds
                                                                available
                                                                balance.
                                                            </p>
                                                        )}
                                                        {errorsDeposit.amount && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                {
                                                                    errorsDeposit.amount
                                                                }
                                                            </p>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="mt-6 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                                                onClick={() =>
                                                    setIsDepositFiatModalOpen(
                                                        false,
                                                    )
                                                }
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={
                                                    processingDeposit ||
                                                    !depositData.amount ||
                                                    parseFloat(
                                                        depositData.amount || 0,
                                                    ) >
                                                        parseFloat(
                                                            fiatBalances[
                                                                depositData
                                                                    .currency
                                                            ] || 0,
                                                        )
                                                }
                                                className="inline-flex justify-center items-center gap-2 rounded-xl border border-transparent bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50 transition-all"
                                            >
                                                {processingDeposit ? (
                                                    <>
                                                        <svg
                                                            className="animate-spin h-4 w-4 text-white"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                        <span>
                                                            Depositing...
                                                        </span>
                                                    </>
                                                ) : (
                                                    "Confirm Deposit"
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            {/* Withdraw Funding Modal */}
            <Transition appear show={isWithdrawFundingModalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setIsWithdrawFundingModalOpen(false)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
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
                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
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
                                                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                                                />
                                            </svg>
                                        </div>
                                        Withdraw from Funding
                                    </Dialog.Title>

                                    <form
                                        onSubmit={handleWithdrawFundingSubmit}
                                        className="mt-4 space-y-4"
                                    >
                                        <div className="text-sm text-gray-500 bg-orange-50 p-4 rounded-xl border border-orange-100 mb-4">
                                            Withdraw funds from your{" "}
                                            <strong>Funding Wallet</strong> back
                                            to your{" "}
                                            <strong>Fiat Account</strong>.
                                        </div>

                                        {/* Currency Selection */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                                                Select Currency
                                            </label>
                                            <select
                                                value={
                                                    withdrawFundingData.currency
                                                }
                                                onChange={(e) =>
                                                    setWithdrawFundingData(
                                                        "currency",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-3 font-bold text-gray-800"
                                            >
                                                <option value="USD">
                                                    USD - US Dollar
                                                </option>
                                                <option value="EUR">
                                                    EUR - Euro
                                                </option>
                                            </select>
                                        </div>

                                        {/* Source: Funding Balance */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                                                Source (Funding Wallet)
                                            </label>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-900 text-lg">
                                                    {
                                                        withdrawFundingData.currency
                                                    }
                                                </span>
                                                <span className="text-xs font-bold text-gray-500">
                                                    {(() => {
                                                        const cur =
                                                            withdrawFundingData.currency;
                                                        // Ensure we treat as object or array logic safety
                                                        const balVal =
                                                            fundingFiatBalances &&
                                                            fundingFiatBalances[
                                                                cur
                                                            ];
                                                        const bal = parseFloat(
                                                            balVal || "0",
                                                        );

                                                        return `Available: ${formatNumber(
                                                            bal,
                                                            8,
                                                        )}`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount Input */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            {(() => {
                                                const cur =
                                                    withdrawFundingData.currency;
                                                const balVal =
                                                    fundingFiatBalances &&
                                                    fundingFiatBalances[cur];
                                                const maxAmount = parseFloat(
                                                    balVal || "0",
                                                );

                                                const currentAmount =
                                                    parseFloat(
                                                        withdrawFundingData.amount ||
                                                            0,
                                                    );
                                                const isExceeding =
                                                    currentAmount > maxAmount;

                                                return (
                                                    <>
                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                                                            Withdraw Amount
                                                        </label>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    withdrawFundingData.amount
                                                                }
                                                                onChange={(e) =>
                                                                    setWithdrawFundingData(
                                                                        "amount",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className={`block w-full rounded-xl pl-4 pr-24 py-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500 sm:text-lg font-bold ${
                                                                    isExceeding
                                                                        ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                                        : ""
                                                                }`}
                                                                placeholder="0.00"
                                                                min="0.01"
                                                                step="any"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setWithdrawFundingData(
                                                                            "amount",
                                                                            maxAmount,
                                                                        )
                                                                    }
                                                                    className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition-colors"
                                                                >
                                                                    MAX
                                                                </button>
                                                                <span
                                                                    className={`${
                                                                        isExceeding
                                                                            ? "text-red-500"
                                                                            : "text-gray-500"
                                                                    } sm:text-sm font-bold`}
                                                                >
                                                                    {
                                                                        withdrawFundingData.currency
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isExceeding && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                Amount exceeds
                                                                available
                                                                balance.
                                                            </p>
                                                        )}
                                                        {errorsWithdrawFunding.amount && (
                                                            <p className="mt-1 text-xs text-red-600 font-bold">
                                                                {
                                                                    errorsWithdrawFunding.amount
                                                                }
                                                            </p>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="mt-6 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                                                onClick={() =>
                                                    setIsWithdrawFundingModalOpen(
                                                        false,
                                                    )
                                                }
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={
                                                    processingWithdrawFunding ||
                                                    !withdrawFundingData.amount ||
                                                    parseFloat(
                                                        withdrawFundingData.amount ||
                                                            0,
                                                    ) >
                                                        parseFloat(
                                                            (fundingFiatBalances &&
                                                                fundingFiatBalances[
                                                                    withdrawFundingData
                                                                        .currency
                                                                ]) ||
                                                                "0",
                                                        )
                                                }
                                                className="inline-flex justify-center items-center gap-2 rounded-xl border border-transparent bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 transition-all"
                                            >
                                                {processingWithdrawFunding ? (
                                                    <>
                                                        <svg
                                                            className="animate-spin h-4 w-4 text-white"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                        <span>
                                                            Withdrawing...
                                                        </span>
                                                    </>
                                                ) : (
                                                    "Confirm Withdraw"
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Deposit Selection Modal */}
            <Transition appear show={isDepositSelectionModalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setIsDepositSelectionModalOpen(false)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
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
                                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-gray-900 mb-6"
                                    >
                                        {" "}
                                        Select Deposit Method{" "}
                                    </Dialog.Title>
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => {
                                                setIsDepositSelectionModalOpen(
                                                    false,
                                                );
                                                setIsDepositCryptoModalOpen(
                                                    true,
                                                );
                                                setSelectedDepositNetwork(
                                                    blockchainNetworks[0].id,
                                                );
                                            }}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
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
                                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <span className="block font-bold text-gray-900 group-hover:text-orange-600">
                                                        {" "}
                                                        Deposit Crypto{" "}
                                                    </span>
                                                    <span className="block text-xs text-gray-500">
                                                        {" "}
                                                        Deposit via Blockchain
                                                        (BTC, ETH, etc.){" "}
                                                    </span>
                                                </div>
                                            </div>
                                            <svg
                                                className="w-5 h-5 text-gray-400 group-hover:text-orange-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsDepositSelectionModalOpen(
                                                    false,
                                                );
                                                const defaultCurrency =
                                                    currency === "EUR"
                                                        ? "EUR"
                                                        : "USD";
                                                setDepositData(
                                                    "currency",
                                                    defaultCurrency,
                                                );
                                                setIsDepositFiatModalOpen(true);
                                            }}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
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
                                                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <span className="block font-bold text-gray-900 group-hover:text-green-600">
                                                        {" "}
                                                        Deposit Fiat{" "}
                                                    </span>
                                                    <span className="block text-xs text-gray-500">
                                                        {" "}
                                                        Bank Transfer / Credit
                                                        Card{" "}
                                                    </span>
                                                </div>
                                            </div>
                                            <svg
                                                className="w-5 h-5 text-gray-400 group-hover:text-green-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="mt-6">
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                                            onClick={() =>
                                                setIsDepositSelectionModalOpen(
                                                    false,
                                                )
                                            }
                                        >
                                            {" "}
                                            Cancel{" "}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Deposit Crypto Modal */}
            <Transition appear show={isDepositCryptoModalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setIsDepositCryptoModalOpen(false)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
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
                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
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
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                        </div>
                                        Deposit {currency}
                                    </Dialog.Title>
                                    <div className="mt-4 space-y-4">
                                        <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-100">
                                            <span className="font-bold">
                                                Important:
                                            </span>{" "}
                                            Send only{" "}
                                            <strong>{currency}</strong> to this
                                            deposit address. Sending any other
                                            coin or token to this address may
                                            result in the loss of your deposit.
                                        </div>
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                                                {" "}
                                                Network{" "}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={
                                                        selectedDepositNetwork
                                                    }
                                                    onChange={(e) =>
                                                        setSelectedDepositNetwork(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="block w-full rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500 py-3 font-medium text-gray-800 appearance-none bg-none"
                                                >
                                                    {blockchainNetworks.map(
                                                        (net) => (
                                                            <option
                                                                key={net.id}
                                                                value={net.id}
                                                            >
                                                                {" "}
                                                                {net.name}{" "}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                    <svg
                                                        className="fill-current h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                                            <div className="w-40 h-40 bg-white rounded-lg mb-4 flex items-center justify-center text-gray-900 border-2 border-gray-900 p-1">
                                                <svg
                                                    className="w-full h-full"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h4v4H7V7zm6 0h4v4h-4V7zM7 13h4v4H7v-4zm6 0h4v4h-4v-4z" />
                                                </svg>
                                            </div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2 w-full text-left">
                                                {" "}
                                                Address{" "}
                                            </label>
                                            <div className="w-full relative group">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={depositAddress}
                                                    className="block w-full rounded-xl border-gray-300 bg-gray-50 py-3 pr-10 font-mono text-xs md:text-sm text-gray-600 truncate cursor-pointer hover:bg-gray-100"
                                                    onClick={(e) => {
                                                        navigator.clipboard.writeText(
                                                            depositAddress,
                                                        );
                                                        e.target.select();
                                                        alert(
                                                            "Address copied to clipboard!",
                                                        );
                                                    }}
                                                />
                                                <button
                                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            depositAddress,
                                                        );
                                                        alert(
                                                            "Address copied to clipboard!",
                                                        );
                                                    }}
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
                                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-between text-xs text-gray-500">
                                            <span>Expected Arrival</span>
                                            <span className="font-bold text-gray-700">
                                                {" "}
                                                {blockchainNetworks.find(
                                                    (n) =>
                                                        n.id ===
                                                        selectedDepositNetwork,
                                                )?.delay || "10 mins"}{" "}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                                            onClick={() =>
                                                setIsDepositCryptoModalOpen(
                                                    false,
                                                )
                                            }
                                        >
                                            {" "}
                                            Close{" "}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Withdraw Selection Modal */}
            <Transition
                appear
                show={isWithdrawSelectionModalOpen}
                as={Fragment}
            >
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setIsWithdrawSelectionModalOpen(false)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
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
                                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-gray-900 mb-6"
                                    >
                                        Select Withdrawal Method
                                    </Dialog.Title>

                                    <div className="space-y-4">
                                        <button
                                            onClick={() => {
                                                setIsWithdrawSelectionModalOpen(
                                                    false,
                                                );
                                                setIsWithdrawBlockchainModalOpen(
                                                    true,
                                                );
                                            }}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
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
                                                            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <span className="block font-bold text-gray-900 group-hover:text-blue-600">
                                                        Withdraw to Blockchain
                                                    </span>
                                                    <span className="block text-xs text-gray-500">
                                                        Send crypto to external
                                                        address
                                                    </span>
                                                </div>
                                            </div>
                                            <svg
                                                className="w-5 h-5 text-gray-400 group-hover:text-blue-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsWithdrawSelectionModalOpen(
                                                    false,
                                                );
                                                // Prepare existing Fiat Withdraw modal state logic
                                                const defaultCurrency =
                                                    currency === "EUR"
                                                        ? "EUR"
                                                        : "USD";
                                                setWithdrawFundingData(
                                                    "currency",
                                                    defaultCurrency,
                                                );
                                                setIsWithdrawFundingModalOpen(
                                                    true,
                                                );
                                            }}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
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
                                                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <span className="block font-bold text-gray-900 group-hover:text-green-600">
                                                        Withdraw to Fiat
                                                    </span>
                                                    <span className="block text-xs text-gray-500">
                                                        Transfer to your Fiat
                                                        Account
                                                    </span>
                                                </div>
                                            </div>
                                            <svg
                                                className="w-5 h-5 text-gray-400 group-hover:text-green-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="mt-6">
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                                            onClick={() =>
                                                setIsWithdrawSelectionModalOpen(
                                                    false,
                                                )
                                            }
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

            {/* Withdraw Blockchain Modal (New Feature) */}
            <Transition
                appear
                show={isWithdrawBlockchainModalOpen}
                as={Fragment}
            >
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setIsWithdrawBlockchainModalOpen(false)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
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
                                                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                                />
                                            </svg>
                                        </div>
                                        Withdraw {currency} to Blockchain
                                    </Dialog.Title>

                                    <form
                                        onSubmit={
                                            handleWithdrawBlockchainSubmit
                                        }
                                        className="mt-4 space-y-4"
                                    >
                                        <div className="text-sm text-gray-500 bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                            Send standard blockchain transaction
                                            to an external wallet address.
                                            Network fees may apply.
                                        </div>

                                        {/* Currency Readonly */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500 uppercase">
                                                    Asset
                                                </span>
                                                <span className="font-bold text-gray-900">
                                                    {currency}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Address Input */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                                                Recipient Address
                                            </label>
                                            <input
                                                type="text"
                                                value={
                                                    withdrawBlockchainData.address
                                                }
                                                onChange={(e) =>
                                                    setWithdrawBlockchainData(
                                                        "address",
                                                        e.target.value,
                                                    )
                                                }
                                                className="block w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 py-3 font-medium text-gray-800"
                                                placeholder={`Paste ${currency} Address`}
                                            />
                                            {errorsWithdrawBlockchain.address && (
                                                <p className="mt-1 text-xs text-red-600 font-bold">
                                                    {
                                                        errorsWithdrawBlockchain.address
                                                    }
                                                </p>
                                            )}
                                            {addressValidationError &&
                                                !errorsWithdrawBlockchain.address && (
                                                    <p className="mt-1 text-xs text-red-600 font-bold">
                                                        {addressValidationError}
                                                    </p>
                                                )}
                                        </div>

                                        {/* Network Selection */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                                                Network
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={
                                                        withdrawBlockchainData.network
                                                    }
                                                    onChange={(e) =>
                                                        setWithdrawBlockchainData(
                                                            "network",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="block w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 py-3 font-medium text-gray-800 appearance-none bg-none"
                                                >
                                                    <option value="" disabled>
                                                        Select Network
                                                    </option>
                                                    {blockchainNetworks.map(
                                                        (net) => (
                                                            <option
                                                                key={net.id}
                                                                value={net.id}
                                                            >
                                                                {net.name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                    <svg
                                                        className="fill-current h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {/* Network Details Display */}
                                            {withdrawBlockchainData.network &&
                                                (() => {
                                                    const selected =
                                                        blockchainNetworks.find(
                                                            (n) =>
                                                                n.id ===
                                                                withdrawBlockchainData.network,
                                                        );
                                                    if (!selected) return null;

                                                    return (
                                                        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                                                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                                <span className="text-gray-500 block">
                                                                    Network Fee
                                                                </span>
                                                                <span className="font-bold text-gray-800">
                                                                    {
                                                                        selected.fee
                                                                    }{" "}
                                                                    {currency}
                                                                </span>
                                                            </div>
                                                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                                <span className="text-gray-500 block">
                                                                    Arrival Time
                                                                </span>
                                                                <span className="font-bold text-gray-800">
                                                                    {
                                                                        selected.delay
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                        </div>

                                        {/* Amount Input */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                                                Withdraw Amount
                                            </label>
                                            {(() => {
                                                const balObj =
                                                    allCurrencyBalances.find(
                                                        (b) =>
                                                            b.wallet_type.toLowerCase() ===
                                                                normalizedWalletType.toLowerCase() &&
                                                            b.currency ===
                                                                currency,
                                                    );
                                                const maxAmount = balObj
                                                    ? parseFloat(balObj.balance)
                                                    : 0;
                                                const currentAmount =
                                                    parseFloat(
                                                        withdrawBlockchainData.amount ||
                                                            0,
                                                    );
                                                const isExceeding =
                                                    currentAmount > maxAmount;

                                                return (
                                                    <>
                                                        <div className="relative rounded-md shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    withdrawBlockchainData.amount
                                                                }
                                                                onChange={(e) =>
                                                                    setWithdrawBlockchainData(
                                                                        "amount",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className={`block w-full rounded-xl pl-4 pr-24 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-lg font-bold ${
                                                                    isExceeding
                                                                        ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                                                                        : ""
                                                                }`}
                                                                placeholder="0.00"
                                                                min="0.00000001"
                                                                step="any"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setWithdrawBlockchainData(
                                                                            "amount",
                                                                            maxAmount,
                                                                        )
                                                                    }
                                                                    className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                                                >
                                                                    MAX
                                                                </button>
                                                                <span
                                                                    className={`${
                                                                        isExceeding
                                                                            ? "text-red-500"
                                                                            : "text-gray-500"
                                                                    } sm:text-sm font-bold`}
                                                                >
                                                                    {currency}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-1 flex justify-between text-xs">
                                                            <span className="text-red-600 font-bold h-4 block">
                                                                {isExceeding
                                                                    ? "Insufficient balance"
                                                                    : feeValidationError
                                                                      ? feeValidationError
                                                                      : errorsWithdrawBlockchain.amount ||
                                                                        ""}
                                                            </span>
                                                            <span className="text-gray-500">
                                                                Available:{" "}
                                                                <span
                                                                    className="font-bold cursor-pointer hover:text-blue-600"
                                                                    onClick={() =>
                                                                        setWithdrawBlockchainData(
                                                                            "amount",
                                                                            maxAmount,
                                                                        )
                                                                    }
                                                                >
                                                                    {formatNumber(
                                                                        maxAmount,
                                                                        8,
                                                                    )}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* Fee Summary */}
                                        {withdrawBlockchainData.amount &&
                                            withdrawBlockchainData.network &&
                                            (() => {
                                                const selected =
                                                    blockchainNetworks.find(
                                                        (n) =>
                                                            n.id ===
                                                            withdrawBlockchainData.network,
                                                    );
                                                const fee = selected
                                                    ? selected.fee
                                                    : 0;
                                                const total =
                                                    parseFloat(
                                                        withdrawBlockchainData.amount,
                                                    ) - fee;

                                                // Ensure user understands they receive less
                                                return (
                                                    <div className="flex justify-between items-center text-sm font-bold bg-blue-50 p-3 rounded-xl text-blue-800">
                                                        <span>
                                                            Receive Amount
                                                        </span>
                                                        <span>
                                                            {total > 0
                                                                ? formatNumber(
                                                                      total,
                                                                      8,
                                                                  )
                                                                : 0}{" "}
                                                            {currency}
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                        <div className="mt-6 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                                                onClick={() =>
                                                    setIsWithdrawBlockchainModalOpen(
                                                        false,
                                                    )
                                                }
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={
                                                    processingWithdrawBlockchain ||
                                                    !withdrawBlockchainData.amount ||
                                                    !withdrawBlockchainData.address ||
                                                    !!addressValidationError ||
                                                    !!feeValidationError
                                                }
                                                className="inline-flex justify-center items-center gap-2 rounded-xl border border-transparent bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 transition-all"
                                            >
                                                {processingWithdrawBlockchain ? (
                                                    <>
                                                        <svg
                                                            className="animate-spin h-4 w-4 text-white"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                        <span>
                                                            Submitting...
                                                        </span>
                                                    </>
                                                ) : (
                                                    "Withdraw to Blockchain"
                                                )}
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
