<?php

/**
 * SEO Configuration for BBinance
 * 
 * This file contains SEO best practices and settings
 */

return [
    /**
     * Organization Information
     */
    'organization' => [
        'name' => 'HSBC',
        'description' => 'The future of digital banking with secure, instant multi-currency transfers',
        'url' => env('APP_URL', 'http://localhost:8000'),
        'logo' => env('APP_URL', 'http://localhost:8000') . '/hsbc-logo.png',
        'type' => 'FinancialService',
    ],

    /**
     * Social Media Profiles for structured data
     */
    'social' => [
        'facebook' => 'https://facebook.com/hsbc',
        'twitter' => 'https://twitter.com/hsbc',
        'linkedin' => 'https://linkedin.com/company/hsbc',
        'instagram' => 'https://instagram.com/hsbc',
        'youtube' => 'https://youtube.com/@hsbc',
    ],

    /**
     * Contact Information
     */
    'contact' => [
        'email' => env('MAIL_FROM_ADDRESS', 'support@hsbc.com'),
        'phone' => '+1-800-HSBC',
        'address' => [
            'streetAddress' => '123 Finance Street',
            'addressLocality' => 'San Francisco',
            'addressRegion' => 'CA',
            'postalCode' => '94105',
            'addressCountry' => 'US',
        ],
    ],

    /**
     * Default Meta Tags
     */
    'meta' => [
        'title' => 'HSBC - The Future of Digital Banking',
        'description' => 'Experience secure, instant multi-currency transfers with HSBC. Competitive exchange rates, real-time updates, and 99.98% uptime.',
        'keywords' => 'digital banking, money transfer, cryptocurrency exchange, secure transfers, financial services, multi-currency',
        'ogImage' => env('APP_URL', 'http://localhost:8000') . '/og-image.jpg',
        'twitterHandle' => '@HSBC',
    ],

    /**
     * SEO Performance Settings
     */
    'performance' => [
        'enable_minification' => true,
        'enable_caching' => true,
        'cache_duration' => 3600, // 1 hour
        'enable_compression' => true,
    ],

    /**
     * Sitemap Configuration
     */
    'sitemap' => [
        'enabled' => true,
        'cache_duration' => 3600,
        'include_mobile' => true,
    ],

    /**
     * Structured Data Settings (Schema.org)
     */
    'structured_data' => [
        'enabled' => true,
        'types' => [
            'Organization',
            'FinancialService',
            'BankAccount',
        ],
    ],

    /**
     * OpenGraph Settings
     */
    'opengraph' => [
        'enabled' => true,
        'locale' => 'en_US',
        'site_name' => 'HSBC',
    ],

    /**
     * Twitter Card Settings
     */
    'twitter' => [
        'enabled' => true,
        'card_type' => 'summary_large_image',
        'creator' => '@HSBC',
    ],

    /**
     * Robots.txt Configuration
     */
    'robots' => [
        'allow' => [
            '/',
        ],
        'disallow' => [
            '/admin',
            '/login',
            '/register',
            '/password-reset',
            '/api/',
            '/storage/',
            '/vendor/',
        ],
    ],
];
