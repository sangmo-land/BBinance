import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function EarnPage({ account, currency, message }) {
    return (
        <AppLayout title={`${currency} Earn`}>
             <Head title={`${currency} Earn`} />
             
             <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {currency} Earn
                            </h2>
                            <Link
                                href={route('accounts.crypto-detail', [account.id, currency]) + '?wallet=earning'}
                                className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                                &larr; Back to Wallet
                            </Link>
                        </div>
                        
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {message}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
