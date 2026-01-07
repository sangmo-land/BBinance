import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Checkbox from "@/Components/Checkbox";
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen flex w-full bg-slate-50 dark:bg-black text-black/50 dark:text-white/50">
                {/* Left Side - Brand Panel (Dark/Zinc Theme) */}
                <div className="hidden lg:flex w-[400px] xl:w-[500px] flex-col justify-between bg-[#18181b] p-12 relative overflow-hidden shrink-0 border-r border-[#ffffff1a]">
                    <div className="absolute inset-0 bg-[url('https://laravel.com/assets/img/welcome/background.svg')] bg-cover opacity-10"></div>

                    <div className="relative z-10">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/logo.png"
                                className="h-32 w-auto"
                                alt="Logo"
                            />
                        </div>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl font-bold text-white leading-tight">
                            Start Investing
                            <br />
                            In Your Future
                        </h2>
                        <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                            <p>
                                Join millions of users worldwide who trust
                                BBinance for their crypto journey.
                            </p>
                            <ul className="space-y-3 mt-4 text-white/80">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-[#FF2D20] rounded-full"></div>
                                    <span>Fast & Secure Verification</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-[#FF2D20] rounded-full"></div>
                                    <span>Low Trading Fees</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-[#FF2D20] rounded-full"></div>
                                    <span>24/7 Customer Support</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="relative z-10 text-xs text-zinc-600">
                        &copy; {new Date().getFullYear()} BBinance.
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative dark:bg-black">
                    {/* Mobile Header */}
                    <div className="lg:hidden absolute top-8 left-0 w-full px-6 flex items-center justify-center">
                        <Link
                            href="/"
                            className="absolute left-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        >
                            <svg
                                className="w-6 h-6 text-gray-600 dark:text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                        </Link>

                        <div className="rounded-xl bg-gradient-to-br from-white via-white/80 to-white/60 p-3 shadow-lg backdrop-blur-md ring-1 ring-black/5">
                            <img
                                src="/images/logo.png"
                                className="h-12 w-auto"
                                alt="Logo"
                            />
                        </div>
                    </div>

                    <div className="w-full max-w-sm space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white mb-2">
                                Create an account
                            </h2>
                            <p className="text-sm text-black/50 dark:text-zinc-400">
                                Join thousands of users trading today.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <InputLabel
                                    htmlFor="name"
                                    value="Full Name"
                                    className="mb-1.5"
                                />
                                <input
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="block w-full rounded-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400"
                                    autoComplete="name"
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="email"
                                    value="Email"
                                    className="mb-1.5"
                                />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="block w-full rounded-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400"
                                    autoComplete="email"
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.email}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="password"
                                    value="Password"
                                    className="mb-1.5"
                                />
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="block w-full rounded-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.password}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="password_confirmation"
                                    value="Confirm Password"
                                    className="mb-1.5"
                                />
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="block w-full rounded-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                    className="mt-1"
                                />
                            </div>

                            <div className="pt-2">
                                <label className="flex items-start">
                                    <Checkbox
                                        name="terms"
                                        className="mt-1 text-[#FF2D20] focus:ring-[#FF2D20] border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                        required
                                    />
                                    <span className="ms-2 text-sm text-black/60 dark:text-zinc-400 leading-snug">
                                        I accept the{" "}
                                        <a
                                            href="#"
                                            className="underline hover:text-[#FF2D20]"
                                        >
                                            Terms
                                        </a>{" "}
                                        and{" "}
                                        <a
                                            href="#"
                                            className="underline hover:text-[#FF2D20]"
                                        >
                                            Privacy Policy
                                        </a>
                                        .
                                    </span>
                                </label>
                            </div>

                            <div className="pt-2">
                                <button
                                    className="w-full bg-[#FF2D20] hover:bg-[#e0281b] text-white font-bold py-3 px-4 rounded-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF2D20] focus:ring-offset-2 disabled:opacity-50 dark:ring-offset-black"
                                    disabled={processing}
                                >
                                    Register
                                </button>
                            </div>
                        </form>

                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                            <span className="text-sm text-black/50 dark:text-zinc-400">
                                Already have an account?{" "}
                            </span>
                            <Link
                                href={route("login")}
                                className="text-sm font-bold text-[#FF2D20] hover:text-[#e0281b]"
                            >
                                Log In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
