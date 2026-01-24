import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function PrivacyPolicy({ auth }) {
    return (
        <AppLayout user={auth.user}>
            <Head title="Privacy Policy" />

            <div className="py-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-8 text-gray-900 dark:text-gray-100">
                            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                                Last Updated: January 24, 2026
                            </p>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-8">
                                <p className="text-yellow-700 dark:text-yellow-300 font-semibold">
                                    ⚠️ DEMONSTRATION PROJECT NOTICE
                                </p>
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
                                    This is a demonstration cryptocurrency exchange platform for educational and portfolio purposes only. 
                                    No real financial transactions occur on this platform. All data, balances, and transactions are simulated.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <section>
                                    <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Welcome to HSBC.org ("we," "our," or "us"). This Privacy Policy explains how we collect, use, 
                                        and protect your information when you use our demonstration cryptocurrency exchange platform.
                                    </p>
                                    <p className="mt-2 text-gray-700 dark:text-gray-300">
                                        <strong>Important:</strong> HSBC.org is a demonstration project. We do not process real financial 
                                        transactions, handle actual cryptocurrencies, or store sensitive financial information.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">2. Information We Collect</h2>
                                    
                                    <h3 className="text-xl font-semibold mt-4 mb-2">2.1 Account Information</h3>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>Name and email address</li>
                                        <li>Username and password (encrypted)</li>
                                        <li>Account preferences and settings</li>
                                    </ul>

                                    <h3 className="text-xl font-semibold mt-4 mb-2">2.2 Simulated Transaction Data</h3>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>Demo trading activity and history</li>
                                        <li>Simulated wallet balances and transfers</li>
                                        <li>Educational transaction records</li>
                                    </ul>

                                    <h3 className="text-xl font-semibold mt-4 mb-2">2.3 Technical Information</h3>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>IP address and browser information</li>
                                        <li>Device type and operating system</li>
                                        <li>Session and usage data</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">3. How We Use Your Information</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                                        <li><strong>Platform Operation:</strong> To provide access to the demonstration platform</li>
                                        <li><strong>Educational Purposes:</strong> To simulate cryptocurrency exchange functionality</li>
                                        <li><strong>Account Management:</strong> To manage your demo account and preferences</li>
                                        <li><strong>Communication:</strong> To send platform updates and notifications</li>
                                        <li><strong>Security:</strong> To protect against unauthorized access and abuse</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">4. Data Storage and Security</h2>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        We implement industry-standard security measures to protect your information:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>Encrypted password storage using bcrypt hashing</li>
                                        <li>HTTPS/SSL encryption for data transmission</li>
                                        <li>Regular security updates and patches</li>
                                        <li>Limited access to user data</li>
                                    </ul>
                                    <p className="mt-3 text-gray-700 dark:text-gray-300">
                                        <strong>Note:</strong> As this is a demonstration project, we recommend not using real personal 
                                        or financial information when creating accounts.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">5. Your Rights</h2>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">You have the right to:</p>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>Access your personal information</li>
                                        <li>Request correction of inaccurate data</li>
                                        <li>Request deletion of your account and data</li>
                                        <li>Opt-out of communications</li>
                                        <li>Export your data</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold mb-3">6. Contact Us</h2>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        For questions about this Privacy Policy or your data, please contact us at:
                                    </p>
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <p className="font-mono text-sm">Email: privacy@hsbc.org</p>
                                    </div>
                                </section>

                                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 mt-8">
                                    <p className="text-blue-700 dark:text-blue-300 font-semibold">
                                        📚 Educational Demonstration
                                    </p>
                                    <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
                                        This platform is designed for learning purposes. All cryptocurrency transactions, 
                                        balances, and trading activities are simulated. No real money or crypto assets are involved.
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
