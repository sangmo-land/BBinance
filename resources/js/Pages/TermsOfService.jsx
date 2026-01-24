import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function TermsOfService({ auth }) {
    return (
        <AppLayout user={auth.user}>
            <Head title="Terms of Service" />

            <div className="py-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-8 text-gray-900 dark:text-gray-100">
                            <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                                Last Updated: January 24, 2026
                            </p>

                            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-8">
                                <p className="text-red-700 dark:text-red-300 font-bold text-lg">
                                    ⚠️ CRITICAL NOTICE - DEMONSTRATION PLATFORM ONLY
                                </p>
                                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                                    HSBC.org is a DEMONSTRATION PROJECT for educational and portfolio purposes. This is NOT a real 
                                    cryptocurrency exchange. NO real financial transactions, cryptocurrencies, or money are processed. 
                                    All balances and transactions are SIMULATED. Do NOT deposit real funds or expect any real financial returns.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <section>
                                    <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        By accessing and using HSBC.org ("the Platform"), you acknowledge and agree to these Terms of Service. 
                                        If you do not agree to these terms, you must not use the Platform.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">2. Nature of the Platform</h2>
                                    
                                    <h3 className="text-xl font-semibold mt-4 mb-2">2.1 Demonstration Project</h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        HSBC.org is a demonstration cryptocurrency exchange platform built for:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>Educational purposes and learning about cryptocurrency trading interfaces</li>
                                        <li>Portfolio demonstration of web development skills</li>
                                        <li>Showcasing Laravel, React, Inertia.js, and Filament technologies</li>
                                    </ul>

                                    <h3 className="text-xl font-semibold mt-4 mb-2">2.2 No Real Financial Services</h3>
                                    <p className="font-bold text-red-600 dark:text-red-400 mb-2">
                                        You acknowledge and agree that:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>This Platform does NOT process real cryptocurrency transactions</li>
                                        <li>All displayed balances, prices, and trades are SIMULATED</li>
                                        <li>NO real money, cryptocurrencies, or assets are exchanged</li>
                                        <li>The Platform is NOT licensed as a financial institution or cryptocurrency exchange</li>
                                        <li>Price data is for demonstration purposes only</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">3. User Accounts</h2>
                                    
                                    <h3 className="text-xl font-semibold mt-4 mb-2">3.1 Account Creation</h3>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>You must provide accurate information when creating an account</li>
                                        <li>You are responsible for maintaining the security of your account credentials</li>
                                        <li>Do NOT use real financial or sensitive personal information</li>
                                        <li>One account per user is recommended</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">4. Acceptable Use</h2>
                                    
                                    <h3 className="text-xl font-semibold mt-4 mb-2">4.1 Permitted Use</h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">You may use the Platform to:</p>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>Explore the demo cryptocurrency exchange interface</li>
                                        <li>Learn about trading mechanics and wallet management</li>
                                        <li>Test features in a simulated environment</li>
                                    </ul>

                                    <h3 className="text-xl font-semibold mt-4 mb-2">4.2 Prohibited Activities</h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">You must NOT:</p>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>Attempt to use the Platform for real financial transactions</li>
                                        <li>Share or sell account access</li>
                                        <li>Attempt to exploit, hack, or manipulate the Platform</li>
                                        <li>Use automated bots or scripts without permission</li>
                                        <li>Upload malicious code or content</li>
                                        <li>Violate any applicable laws or regulations</li>
                                        <li>Misrepresent the Platform as a real exchange</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">5. Disclaimers</h2>
                                    
                                    <h3 className="text-xl font-semibold mt-4 mb-2">5.1 No Warranties</h3>
                                    <p className="font-bold text-gray-700 dark:text-gray-300">
                                        THE PLATFORM IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                                    </p>

                                    <h3 className="text-xl font-semibold mt-4 mb-2">5.2 Educational Purpose Only</h3>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Nothing on this Platform constitutes financial, investment, legal, or professional advice. 
                                        Consult qualified professionals for real financial decisions.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">6. Limitation of Liability</h2>
                                    <p className="font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM 
                                        YOUR USE OF THE PLATFORM, INCLUDING BUT NOT LIMITED TO:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>Loss of data or account access</li>
                                        <li>Misunderstanding of Platform functionality</li>
                                        <li>Any attempt to use the Platform for real transactions</li>
                                        <li>Technical errors or bugs</li>
                                        <li>Third-party API failures</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">7. Contact Information</h2>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        For questions about these Terms of Service:
                                    </p>
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <p className="font-mono text-sm">Email: legal@hsbc.org</p>
                                    </div>
                                </section>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mt-8">
                                    <p className="text-yellow-700 dark:text-yellow-300 font-bold">
                                        Final Reminder
                                    </p>
                                    <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
                                        By using HSBC.org, you acknowledge that this is a DEMONSTRATION platform only. 
                                        You understand that NO real financial transactions occur, and you will NOT attempt 
                                        to use it for real cryptocurrency trading or investments.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
