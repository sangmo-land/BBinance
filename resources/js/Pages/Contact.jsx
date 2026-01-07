import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from "@/Components/ApplicationLogo";

export default function Contact({ auth }) {
    return (
        <>
            <Head title="Contact Us" />
            <div className="bg-gray-50 text-black/50 dark:bg-black dark:text-white/50 min-h-screen selection:bg-[#FF2D20] selection:text-white">
                <img
                    id="background"
                    className="absolute -left-20 top-0 max-w-[877px]"
                    src="https://laravel.com/assets/img/welcome/background.svg"
                />

                <div className="relative flex min-h-screen flex-col items-center">
                    <div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
                        {/* Header / Navigation */}
                        <header className="grid grid-cols-2 items-center gap-2 py-10 lg:grid-cols-3">
                            <div className="flex lg:col-start-2 lg:justify-center">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2"
                                >
                                    <ApplicationLogo className="h-20 w-auto fill-current text-[#FF2D20]" />
                                </Link>
                            </div>
                            <nav className="-mx-3 flex flex-1 justify-end">
                                {/* Links removed as requested */}
                            </nav>
                        </header>

                        <main className="mt-6 pb-20">
                            <div className="text-center mb-16">
                                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                                    Get in Touch
                                </h1>
                                <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                                    Our dedicated financial experts are here to
                                    assist you 24/7.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
                                {/* Left Column: Information */}
                                <div className="space-y-12">
                                    <div>
                                        <h3 className="border-l-4 border-[#FF2D20] pl-4 text-2xl font-semibold text-gray-900 dark:text-white">
                                            Global Headquarters
                                        </h3>
                                        <div className="mt-6 flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-[#FF2D20]">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className="w-6 h-6"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    Paris Office
                                                </p>
                                                <p className="mt-2 text-gray-600 dark:text-gray-400">
                                                    103 Avenue des
                                                    Champs-Élysées
                                                    <br />
                                                    75008 Paris
                                                    <br />
                                                    France
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="border-l-4 border-[#FF2D20] pl-4 text-2xl font-semibold text-gray-900 dark:text-white">
                                            Direct Contact
                                        </h3>
                                        <div className="mt-8 space-y-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-[#FF2D20]">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className="w-6 h-6"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                                                        />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    +33 1 40 70 12 34
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-[#FF2D20]">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className="w-6 h-6"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                                                        />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    service.client@hsbc.fr
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Form */}
                                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
                                    <form className="space-y-6">
                                        <div>
                                            <label
                                                htmlFor="name"
                                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-white"
                                            >
                                                Full Name
                                            </label>
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    id="name"
                                                    className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#FF2D20] dark:bg-gray-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="email"
                                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-white"
                                            >
                                                Email Address
                                            </label>
                                            <div className="mt-2">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#FF2D20] dark:bg-gray-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6"
                                                    placeholder="john@example.com"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="message"
                                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-white"
                                            >
                                                How can we help?
                                            </label>
                                            <div className="mt-2">
                                                <textarea
                                                    id="message"
                                                    name="message"
                                                    rows={4}
                                                    className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#FF2D20] dark:bg-gray-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6"
                                                    placeholder="Tell us about your inquiry..."
                                                ></textarea>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF2D20] hover:bg-[#d92215] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF2D20] transition-colors"
                                        >
                                            Send Message
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </main>

                        <footer className="py-16 text-center text-sm text-black dark:text-white/70">
                            &copy; {new Date().getFullYear()} HSBC Group. All
                            rights reserved.
                        </footer>
                    </div>
                </div>
            </div>
        </>
    );
}
