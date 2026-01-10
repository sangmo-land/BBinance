import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Checkbox from "@/Components/Checkbox";
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useRef } from "react";
import { countries, civilities } from "@/Constants/countries";

const languages = [
    "English", "Spanish", "French", "German", "Chinese", "Japanese", "Russian", "Arabic", "Portuguese", "Italian", "Hindi", "Korean", "Turkish", "Dutch", "Other"
];

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        civility: civilities[0],
        name: "",
        surname: "",
        spoken_language: "",
        profession: "",
        phone: "",
        email: "",
        country_of_residence: "",
        date_of_birth: "",
        nationality: "",
        identity_card_front: null,
        identity_card_back: null,
        password: "",
        password_confirmation: "",
        terms: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Calculate max date for 18+ age restriction
    const today = new Date();
    const cutoffDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const year = cutoffDate.getFullYear();
    const month = String(cutoffDate.getMonth() + 1).padStart(2, '0');
    const day = String(cutoffDate.getDate()).padStart(2, '0');
    const maxDate = `${year}-${month}-${day}`;

    // Refs for file inputs
    const idFrontInput = useRef(null);
    const idBackInput = useRef(null);

    const isFormValid = () => {
        return (
            data.civility &&
            data.name !== "" &&
            data.surname !== "" &&
            data.spoken_language !== "" &&
            data.profession !== "" &&
            data.phone !== "" &&
            data.email !== "" &&
            data.country_of_residence !== "" &&
            data.date_of_birth !== "" &&
            data.date_of_birth <= maxDate &&
            data.nationality !== "" &&
            data.password !== "" &&
            data.password_confirmation !== "" &&
            data.identity_card_front &&
            data.identity_card_back &&
            data.terms
        );
    };

    const submit = (e) => {
        e.preventDefault();

        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    // Helper to render file upload area
    const FileUploadArea = ({ label, id, error, file, inputRef, onChange }) => (
        <div className="w-full">
            <InputLabel value={label} className="mb-1.5" />
            <div
                onClick={() => inputRef.current.click()}
                className={`relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${
                        file
                            ? "border-[#FF2D20] bg-[#FF2D20]/5"
                            : "border-zinc-300 dark:border-zinc-700 hover:border-[#FF2D20] dark:hover:border-[#FF2D20] bg-zinc-50 dark:bg-zinc-900/50"
                    }
                `}
            >
                <input
                    ref={inputRef}
                    id={id}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={onChange}
                    required={!file}
                />

                {file ? (
                    <div className="relative w-full h-full p-2 group">
                        <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-full h-full object-contain rounded"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                            <span className="text-white text-sm font-medium">
                                Click to change
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
                        <svg
                            className="w-8 h-8 mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <span className="text-sm font-medium">
                            Upload Image
                        </span>
                        <span className="text-xs mt-1 text-zinc-400">
                            PNG, JPG up to 5MB
                        </span>
                    </div>
                )}
            </div>
            <InputError message={error} className="mt-1" />
        </div>
    );

    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen flex w-full bg-slate-50 dark:bg-black text-black/50 dark:text-white/50">
                {/* Left Side - Brand Panel (Dark/Zinc Theme) */}
                <div className="hidden lg:flex w-[400px] xl:w-[500px] flex-col justify-between bg-[#18181b] p-12 relative overflow-hidden shrink-0 border-r border-[#ffffff1a]">
                    <div className="absolute inset-0 bg-[url('https://laravel.com/assets/img/welcome/background.svg')] bg-cover opacity-10"></div>

                    <div className="space-y-12">
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
                    </div>

                    <div className="relative z-10 text-xs text-zinc-600">
                        &copy; {new Date().getFullYear()} BBinance.
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative dark:bg-black">
                    {/* Desktop Back Button */}
                    <Link
                        href="/"
                        className="absolute top-8 right-8 hidden lg:flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Back to Home
                    </Link>

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

                    <div className="w-full max-w-2xl space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-2">
                                Create an account
                            </h2>
                            <p className="text-sm text-black/50 dark:text-zinc-400">
                                Join thousands of users trading today.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-12 gap-x-4 gap-y-6">
                                {/* Civility */}
                                <div className="col-span-12 sm:col-span-4">
                                    <InputLabel
                                        htmlFor="civility"
                                        value="Civility"
                                        className="mb-1.5"
                                    />
                                    <div className="relative">
                                        <select
                                            id="civility"
                                            name="civility"
                                            value={data.civility}
                                            className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400 appearance-none"
                                            onChange={(e) =>
                                                setData(
                                                    "civility",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        >
                                            {civilities.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                ></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError
                                        message={errors.civility}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Name */}
                                <div className="col-span-12 sm:col-span-8">
                                    <InputLabel
                                        htmlFor="name"
                                        value="Name"
                                        className="mb-1.5"
                                    />
                                    <div className="relative">
                                        <input
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400"
                                            autoComplete="given-name"
                                            onChange={(e) =>
                                                setData("name", e.target.value)
                                            }
                                            required
                                            placeholder="John"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError
                                        message={errors.name}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Surname */}
                                <div className="col-span-12">
                                    <InputLabel
                                        htmlFor="surname"
                                        value="Surname"
                                        className="mb-1.5"
                                    />
                                    <div className="relative">
                                        <input
                                            id="surname"
                                            name="surname"
                                            value={data.surname}
                                            className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400"
                                            autoComplete="family-name"
                                            onChange={(e) =>
                                                setData(
                                                    "surname",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            placeholder="Doe"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError
                                        message={errors.surname}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Spoken Language */}
                                <div className="col-span-12 sm:col-span-6">
                                    <InputLabel
                                        htmlFor="spoken_language"
                                        value="Spoken Language"
                                        className="mb-1.5"
                                    />
                                    <div className="relative">
                                        <select
                                            id="spoken_language"
                                            name="spoken_language"
                                            value={data.spoken_language}
                                            className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400 appearance-none"
                                            onChange={(e) =>
                                                setData(
                                                    "spoken_language",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select Language
                                            </option>
                                            {languages.map((lang) => (
                                                <option key={lang} value={lang}>
                                                    {lang}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                                />
                                            </svg>
                                        </div>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                ></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError
                                        message={errors.spoken_language}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Profession */}
                                <div className="col-span-12 sm:col-span-6">
                                    <InputLabel
                                        htmlFor="profession"
                                        value="Profession"
                                        className="mb-1.5"
                                    />
                                    <div className="relative">
                                        <input
                                            id="profession"
                                            name="profession"
                                            value={data.profession}
                                            className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400"
                                            onChange={(e) =>
                                                setData(
                                                    "profession",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            placeholder="Trader"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError
                                        message={errors.profession}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="col-span-12">
                                    <InputLabel
                                        htmlFor="phone"
                                        value="Phone Number"
                                        className="mb-1.5"
                                    />
                                    <div className="relative">
                                        <input
                                            id="phone"
                                            name="phone"
                                            value={data.phone}
                                            className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400"
                                            autoComplete="tel"
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9+() -]/g, '');
                                                setData("phone", value);
                                            }}
                                            required
                                            placeholder="+1 (555) 000-0000"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError
                                        message={errors.phone}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Email */}
                                <div className="col-span-12">
                                    <InputLabel
                                        htmlFor="email"
                                        value="Email"
                                        className="mb-1.5"
                                    />
                                    <div className="relative">
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400"
                                            autoComplete="email"
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
                                            required
                                            placeholder="john@example.com"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError
                                        message={errors.email}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Country of Residence */}
                                <div className="col-span-12 sm:col-span-6">
                                    <InputLabel
                                        htmlFor="country_of_residence"
                                        value="Country of Residence"
                                        className="mb-1.5"
                                    />
                                    <div className="relative">
                                        <select
                                            id="country_of_residence"
                                            name="country_of_residence"
                                            value={data.country_of_residence}
                                            className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400 appearance-none"
                                            onChange={(e) =>
                                                setData(
                                                    "country_of_residence",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select Country
                                            </option>
                                            {countries.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                ></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError
                                        message={errors.country_of_residence}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Nationality */}
                                <div className="col-span-12 sm:col-span-6">
                                    <InputLabel
                                        htmlFor="nationality"
                                        value="Nationality"
                                        className="mb-1.5"
                                    />
                                    <div className="relative">
                                        <select
                                            id="nationality"
                                            name="nationality"
                                            value={data.nationality}
                                            className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400 appearance-none"
                                            onChange={(e) =>
                                                setData(
                                                    "nationality",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select Nationality
                                            </option>
                                            {countries.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M12 3v18M3 8l9-5 9 5M3 8v3a2 2 0 002 2h3"
                                                />
                                            </svg>
                                        </div>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                ></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError
                                        message={errors.nationality}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Date of Birth */}
                                <div className="col-span-12">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <InputLabel
                                            htmlFor="date_of_birth"
                                            value="Date of Birth"
                                        />
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Must be at least 18 years old
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="date_of_birth"
                                            type="date"
                                            name="date_of_birth"
                                            value={data.date_of_birth}
                                            className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400"
                                            onChange={(e) => {
                                                const selectedDate = e.target.value; // YYYY-MM-DD
                                                
                                                // Calculate 18 years ago from today
                                                const today = new Date();
                                                const cutoffDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                                                
                                                // Format cutoffDate to YYYY-MM-DD (Local time)
                                                const year = cutoffDate.getFullYear();
                                                const month = String(cutoffDate.getMonth() + 1).padStart(2, '0');
                                                const day = String(cutoffDate.getDate()).padStart(2, '0');
                                                const maxDateString = `${year}-${month}-${day}`;

                                                if (selectedDate > maxDateString) {
                                                    alert("You must be at least 18 years old to register.");
                                                    setData("date_of_birth", "");
                                                } else {
                                                    setData("date_of_birth", selectedDate);
                                                }
                                            }}
                                            required
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError
                                        message={errors.date_of_birth}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Identity Cards Section */}
                                <div className="col-span-12">
                                    <h3 className="text-lg font-medium text-black dark:text-white mb-4">
                                        Identity Verification
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FileUploadArea
                                            label="Identity Card Front"
                                            id="identity_card_front"
                                            error={errors.identity_card_front}
                                            file={data.identity_card_front}
                                            inputRef={idFrontInput}
                                            onChange={(e) =>
                                                setData(
                                                    "identity_card_front",
                                                    e.target.files[0]
                                                )
                                            }
                                        />

                                        <FileUploadArea
                                            label="Identity Card Back"
                                            id="identity_card_back"
                                            error={errors.identity_card_back}
                                            file={data.identity_card_back}
                                            inputRef={idBackInput}
                                            onChange={(e) =>
                                                setData(
                                                    "identity_card_back",
                                                    e.target.files[0]
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Password fields */}
                                <div className="col-span-12 space-y-5">
                                    <div>
                                        <InputLabel
                                            htmlFor="password"
                                            value="Password"
                                            className="mb-1.5"
                                        />
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                name="password"
                                                value={data.password}
                                                className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400 pr-10"
                                                autoComplete="new-password"
                                                onChange={(e) =>
                                                    setData(
                                                        "password",
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="1.5"
                                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                    />
                                                </svg>
                                            </div>
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                            >
                                                {showPassword ? (
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                        />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
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
                                        <div className="relative">
                                            <input
                                                id="password_confirmation"
                                                type={
                                                    showConfirmPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                name="password_confirmation"
                                                value={
                                                    data.password_confirmation
                                                }
                                                className="block w-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 pl-11 text-black dark:text-white shadow-sm focus:border-[#FF2D20] focus:ring-1 focus:ring-[#FF2D20] sm:text-sm placeholder:text-zinc-400 pr-10"
                                                autoComplete="new-password"
                                                onChange={(e) =>
                                                    setData(
                                                        "password_confirmation",
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="1.5"
                                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                    />
                                                </svg>
                                            </div>
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        !showConfirmPassword
                                                    )
                                                }
                                            >
                                                {showConfirmPassword ? (
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                        />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-start">
                                    <Checkbox
                                        name="terms"
                                        checked={data.terms}
                                        onChange={(e) => setData('terms', e.target.checked)}
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
                                    className="w-full bg-[#FF2D20] hover:bg-[#e0281b] text-white font-bold py-3 px-4 rounded-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF2D20] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-offset-black flex items-center justify-center gap-2"
                                    disabled={!isFormValid() || processing}
                                >
                                    {processing && (
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
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
                                    )}
                                    {processing ? 'Registering...' : 'Register'}
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
