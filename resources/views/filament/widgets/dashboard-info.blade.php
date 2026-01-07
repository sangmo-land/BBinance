<x-filament::section
    class="bg-white dark:bg-gray-900 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
    <div class="relative overflow-hidden">
        <!-- Background Decoration -->
        <div
            class="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-red-50 dark:bg-red-900/10 blur-3xl opacity-50">
        </div>
        <div
            class="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-gray-50 dark:bg-gray-800/50 blur-3xl opacity-50">
        </div>

        <div class="relative p-6 sm:p-8">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <!-- Icon -->
                <div class="flex-shrink-0 p-4 bg-red-600 rounded-2xl shadow-lg shadow-red-200 dark:shadow-none">
                    <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>

                <div class="flex-1">
<h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Welcome to <span class="text-red-600">HSBC</span> Administration
</h2>
</div>
                
                <!-- Quick Actions -->
                <div class="flex gap-3 mt-4 sm:mt-0">

                </div>
</div>

<div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 dark:border-gray-800 pt-8">
                <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</span>
                    <span class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ \App\Models\User::count() }}</span>
                </div>
<div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">System Status</span>
                    <div class="flex items-center mt-1">
                        <span class="relative flex h-3 w-3 mr-2">
                            <span
                                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span class="text-sm font-bold text-green-600 dark:text-green-400">Operational</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-filament::section>
