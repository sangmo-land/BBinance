<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# BBinance Project - Laravel with React, Inertia, Tailwind, and Filament

## Project Setup Completed ✅

- [x] Created copilot-instructions.md file
- [x] Clarified project requirements (Laravel + React + Inertia.js + Tailwind CSS + Filament)
- [x] Scaffolded Laravel project
- [x] Installed Laravel Breeze with React and Inertia
- [x] Installed and configured Filament v4 admin panel
- [x] Installed all PHP and JavaScript dependencies
- [x] Built frontend assets with Vite
- [x] Created comprehensive documentation

## Stack Information

- **Framework**: Laravel 12.x
- **Frontend**: React 18 with Inertia.js
- **Styling**: Tailwind CSS (Dark Mode enabled)
- **Admin Panel**: Filament v4
- **Build Tool**: Vite 7
- **Database**: MySQL

## Quick Start

```bash
# Ensure MySQL is running and database 'bbinance' exists

# Start backend server
php artisan serve

# Start frontend dev server (in another terminal)
npm run dev

# Access the application
# Main app: http://localhost:8000
# Admin panel: http://localhost:8000/admin
```

## Creating Admin User

```bash
php artisan make:filament-user
```

## Important Notes

- Node.js version 22.12+ or 20.19+ is recommended for Vite 7
- The project uses MySQL (configured in .env)
- Dark mode is enabled by default in Tailwind configuration
- Authentication is handled by Laravel Breeze (React/Inertia variant)
- Admin panel is accessible at `/admin` route

For complete documentation, see README.md
