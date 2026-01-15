<?php

/**
* SEO Configuration for Civicon Exchange
 * 
 * This file contains SEO best practices and settings
 */

return [
    /**
     * Organization Information
     */
    'organization' => [
'name' => 'Civicon Exchange',
        'description' => 'The future of digital banking with secure, instant multi-currency transfers',
        'url' => env('APP_URL', 'http://localhost:8000'),
'logo' => env('APP_URL', 'http://localhost:8000') . '/images/logo.png',
        'type' => 'FinancialService',
    ],

    /**
     * Social Media Profiles for structured data
     */
    'social' => [
'facebook' => 'https://facebook.com/civiconexchange',
        'twitter' => 'https://twitter.com/civiconexchange',
        'linkedin' => 'https://linkedin.com/company/civiconexchange',
        'instagram' => 'https://instagram.com/civiconexchange',
        'youtube' => 'https://youtube.com/@civiconexchange',
    ],

    /**
     * Contact Information
     */
    'contact' => [
'email' => env('MAIL_FROM_ADDRESS', 'support@civicon.com'),
        'phone' => '+1-800-CIVICON',
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
'title' => 'Civicon Exchange - The Future of Digital Banking',
        'description' => 'Experience secure, instant multi-currency transfers with Civicon Exchange. Competitive exchange rates,
        real-time updates, and 99.98% uptime.',
        'keywords' => 'digital banking, money transfer, cryptocurrency exchange, secure transfers, financial services, multi-currency',
        'ogImage' => env('APP_URL', 'http://localhost:8000') . '/og-image.jpg',
'twitterHandle' => '@CiviconExchange',
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
'site_name' => 'Civicon Exchange',
    ],

    /**
     * Twitter Card Settings
     */
    'twitter' => [
        'enabled' => true,
        'card_type' => 'summary_large_image',
'creator' => '@CiviconExchange',
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
