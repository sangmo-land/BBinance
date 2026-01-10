import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import SEOHead from '@/Components/SEOHead';

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value, fractionDigits = 2) {
  const n = asNumber(value);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatDate(value) {
  if (!value) return '';
  const dt = new Date(value);
  return Number.isFinite(dt.getTime()) ? dt.toLocaleString() : String(value);
}

export default function Dashboard({ accounts, transactions, isAdmin, stats }) {
  const { auth } = usePage().props;
  const accountsList = Array.isArray(accounts) ? accounts : (accounts?.data ?? []);
  const paginationLinks = Array.isArray(accounts) ? null : accounts?.links;

  const totalUsd = stats?.totalBalance?.usd ?? 0;
  const totalEur = stats?.totalBalance?.eur ?? 0;
  const totalBtc = stats?.totalBalance?.btc ?? 0;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": "HSBC Dashboard",
    "description": "Account overview, balances, and recent transfers."
  };

  return (
    <AppLayout>
      <SEOHead
        title={isAdmin ? 'Admin Dashboard | HSBC' : 'Dashboard | HSBC'}
        description="View your accounts, balances, and recent transfers in HSBC."
        keywords="dashboard, accounts, balances, transfers"
        structuredData={structuredData}
      />

      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-blue-200 text-blue-700 text-sm font-semibold mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                {isAdmin ? 'Admin Overview' : 'Account Overview'}
              </div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-3">
                Welcome back{auth?.user?.name ? `, ${auth.user.name.split(' ')[0]}` : ''}
              </h1>
              <p className="text-lg text-gray-700 max-w-2xl">
                Manage your finances with confidence. Track balances, monitor transactions, and transfer funds seamlessly.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/transfer"
                className="group px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Transfer
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-6 py-3.5 text-sm font-bold text-gray-700 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats Cards with Modern Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Balance Card - Larger */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-6 h-6 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold uppercase tracking-wider opacity-90">Total Portfolio</p>
              </div>
              <p className="text-5xl font-black mb-4">${formatNumber(totalUsd, 2)}</p>
              <div className="flex gap-6 text-sm opacity-90">
                <div>
                  <p className="text-xs mb-1 opacity-75">EUR</p>
                  <p className="font-bold">€{formatNumber(totalEur, 2)}</p>
                </div>
                <div>
                  <p className="text-xs mb-1 opacity-75">BTC</p>
                  <p className="font-bold">{formatNumber(totalBtc, 8)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Accounts Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Accounts</p>
            </div>
            <p className="text-4xl font-black text-gray-900 mb-2">{stats?.accountCount ?? accountsList.length}</p>
            <p className="text-sm text-gray-500">Active accounts</p>
          </div>

          {/* Transactions Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Activity</p>
            </div>
            <p className="text-4xl font-black text-gray-900 mb-2">{stats?.recentTransactionCount ?? (transactions?.length ?? 0)}</p>
            <p className="text-sm text-gray-500">Recent transactions</p>
          </div>
        </div>

        {/* Accounts Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Your Accounts</h2>
              <p className="text-sm text-gray-600 mt-1">Manage and monitor your banking accounts</p>
            </div>
            {paginationLinks && (
              <p className="text-sm text-gray-500">Showing paginated results</p>
            )}
          </div>

          {accountsList.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600 font-medium">No accounts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accountsList.map((account) => (
                <div key={account.id} 
                  className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:border-blue-200 transition-all transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => {
                      window.open(`/accounts/${account.id}`, '_blank');
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${account.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mb-2 mt-1">
                        <span className={`text-sm font-black uppercase tracking-wide px-3 py-1 rounded-lg ${
                            account.account_type === 'fiat' ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-500/20' : 
                            account.account_type === 'crypto' ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-500/20' : 
                            'bg-blue-100 text-blue-800 ring-1 ring-blue-500/20'
                        }`}>
                            {account.account_type ?? 'Account'}
                        </span>
                      </div>
                      <p className="mt-1 text-xl font-black text-gray-900">{account.account_number}</p>
                      {isAdmin && account.user?.name && (
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">{account.user.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4">
                    {account.account_type === 'fiat' ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total USD Balance</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {formatNumber(account.balances?.filter(b => b.currency === 'USD').reduce((sum, b) => sum + Number(b.balance), 0) ?? 0, 2)}
                                    <span className="text-sm font-bold text-gray-600 ml-2">USD</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total EUR Balance</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {formatNumber(account.balances?.filter(b => b.currency === 'EUR').reduce((sum, b) => sum + Number(b.balance), 0) ?? 0, 2)}
                                    <span className="text-sm font-bold text-gray-600 ml-2">EUR</span>
                                </p>
                            </div>
                        </div>
                    ) : account.account_type === 'crypto' ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total BTC Balance</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {formatNumber(account.total_btc_value ?? 0, 8)}
                                    <span className="text-sm font-bold text-gray-600 ml-2">BTC</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total USDT Equivalent</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {formatNumber(account.total_usdt_value ?? 0, 2)}
                                    <span className="text-sm font-bold text-gray-600 ml-2">USDT</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Balance {account.account_type === 'crypto' ? '(Total Estimated)' : ''}</p>
                            <p className="text-3xl font-black text-gray-900">
                            {formatNumber(account.balance, 2)}
                            <span className="text-lg font-bold text-gray-600 ml-2">{account.currency}</span>
                            </p>
                        </>
                    )}
                    
                    {(account.account_type === 'crypto' || account.account_type === 'fiat') && (
                        <p className="text-xs text-blue-600 mt-2 font-bold">Click to view wallets &rarr;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {paginationLinks && (
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              {paginationLinks.map((l) => (
                <Link
                  key={l.url ?? l.label}
                  href={l.url || ''}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${l.active ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'} ${!l.url ? 'opacity-50 pointer-events-none' : ''}`}
                  dangerouslySetInnerHTML={{ __html: l.label }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Transactions Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900">Recent Transactions</h2>
            <p className="text-sm text-gray-600 mt-1">Track your latest financial activity</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr className="text-left">
                    <th className="p-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Reference</th>
                    <th className="p-5 text-xs font-bold text-gray-600 uppercase tracking-wider">From</th>
                    <th className="p-5 text-xs font-bold text-gray-600 uppercase tracking-wider">To</th>
                    <th className="p-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="p-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="p-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(transactions ?? []).length === 0 ? (
                    <tr>
                      <td className="p-8 text-center text-gray-500" colSpan={6}>
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        No recent transactions.
                      </td>
                    </tr>
                  ) : (
                    (transactions ?? []).map((tx) => {
                      const fromAcc = tx.from_account || tx.fromAccount;
                      const toAcc = tx.to_account || tx.toAccount;
                      const fromLabel = fromAcc?.account_number ?? (tx.from_account_id ? `#${tx.from_account_id}` : '—');
                      const toLabel = toAcc?.account_number ?? (tx.to_account_id ? `#${tx.to_account_id}` : '—');
                      const amount = asNumber(tx.amount);
                      const currency = tx.from_currency || tx.to_currency || 'USD';

                      return (
                        <tr key={tx.id} className="hover:bg-blue-50 transition-colors">
                          <td className="p-5">
                            <span className="font-bold text-gray-900">{tx.reference_number ?? `TX#${tx.id}`}</span>
                          </td>
                          <td className="p-5">
                            <span className="text-gray-700 font-medium">{fromLabel}</span>
                          </td>
                          <td className="p-5">
                            <span className="text-gray-700 font-medium">{toLabel}</span>
                          </td>
                          <td className="p-5">
                            <span className="text-gray-900 font-bold text-base">{formatNumber(amount, 2)} <span className="text-gray-600 font-semibold">{currency}</span></span>
                          </td>
                          <td className="p-5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {tx.status === 'completed' && (
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                              )}
                              {tx.status ?? 'unknown'}
                            </span>
                          </td>
                          <td className="p-5 text-gray-600 text-sm">{formatDate(tx.created_at)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
