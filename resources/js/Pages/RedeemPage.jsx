import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function RedeemPage({ account, currency, message }) {
    return (
        <AppLayout title={`${currency} Redeem`}>
             <Head title={`${currency} Redeem`} />
             
             <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                                </svg>
                                {currency} Redeem
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
