# BBinance

A modern Laravel application with React, Inertia.js, Tailwind CSS, and Filament admin panel.

## Tech Stack

- **Backend**: Laravel 12.x
- **Frontend**: React 18 with Inertia.js
- **Styling**: Tailwind CSS (Dark Mode)
- **Admin Panel**: Filament v4
- **Database**: SQLite (default) / MySQL / PostgreSQL
- **Build Tool**: Vite

## Requirements

- PHP 8.2 or higher
- Composer
- Node.js 22.12+ or 20.19+ (for Vite 7)
- npm or yarn

## Installation

1. **Install PHP dependencies**:
   ```bash
   composer install
   ```

2. **Install JavaScript dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   - Copy `.env.example` to `.env` (if not already done)
   - Update database configuration in `.env` if needed
   - The project is configured with SQLite by default

4. **Generate application key** (if not already generated):
   ```bash
   php artisan key:generate
   ```

5. **Run migrations**:
   ```bash
   php artisan migrate
   ```

6. **Build frontend assets**:
   ```bash
   npm run build
   ```

## Development

### Start Development Server

**Backend**:
```bash
php artisan serve
```
The application will be available at `http://localhost:8000`

**Frontend (with hot reload)**:
```bash
npm run dev
```

### Access Points

- **Main Application**: `http://localhost:8000`
- **Filament Admin Panel**: `http://localhost:8000/admin`

### Creating Admin User

To access the Filament admin panel, create a user:

```bash
php artisan make:filament-user
```

## Project Structure

```
BBinance/
├── app/
│   └── Providers/
│       └── Filament/          # Filament panel providers
├── resources/
│   ├── js/                    # React components and Inertia pages
│   │   ├── Components/        # Reusable React components
│   │   ├── Layouts/           # Layout components
│   │   └── Pages/             # Inertia page components
│   └── css/                   # Tailwind CSS styles
├── routes/
│   └── web.php                # Web routes with Inertia
└── public/
    └── build/                 # Compiled assets
```

## Available Scripts

- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build production assets
- `php artisan serve` - Start Laravel development server
- `php artisan migrate` - Run database migrations
- `php artisan make:filament-resource` - Create new Filament resource

## Features

- ✅ Laravel Breeze authentication (React/Inertia)
- ✅ Filament admin panel
- ✅ Tailwind CSS with dark mode support
- ✅ React 18 with Hooks
- ✅ Inertia.js for SPA-like experience
- ✅ Vite for fast development and optimized builds
- ✅ SQLite database (easily switchable to MySQL/PostgreSQL)

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
