import React from 'react';
import { Head } from '@inertiajs/react';

/**
 * SEO-optimized Head component with support for:
 * - Meta tags (title, description, keywords, og:*, twitter:*)
 * - Structured data (JSON-LD schema.org)
 * - Canonical URLs
 * - Language meta tags
 */
export default function SEOHead({
    title = "AppDemo",
    description = "Secure, instant multi-currency transfers with AppDemo. Experience the future of digital banking with competitive exchange rates and 99.98% uptime.",
    keywords = "digital banking, money transfer, cryptocurrency, exchange, financial services",
    canonicalUrl = "",
    ogImage = "/images/og-image.jpg",
    ogType = "website",
    twitterHandle = "@AppDemo",
    structuredData = null,
    children = null,
}) {
    // Build structured data script if provided
    const jsonLdScript = structuredData
        ? {
              __html: JSON.stringify(structuredData, null, 2),
          }
        : null;

    const baseUrl = window.location.origin;
    const currentUrl = canonicalUrl || window.location.href;

    return (
        <>
            <Head title={title}>
                {/* Basic Meta Tags */}
                <meta name="description" content={description} />
                <meta name="keywords" content={keywords} />
                <meta name="author" content="HSBC" />
                <meta
                    name="robots"
                    content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
                />
                <meta name="language" content="English" />
                <meta httpEquiv="Content-Language" content="en-us" />
                <meta name="revisit-after" content="7 days" />

                {/* Canonical URL */}
                <link rel="canonical" href={currentUrl} />

                {/* Open Graph Meta Tags */}
                <meta property="og:type" content={ogType} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:url" content={currentUrl} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:site_name" content="HSBC" />
                <meta property="og:locale" content="en_US" />

                {/* Twitter Card Meta Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content={ogImage} />
                <meta name="twitter:creator" content={twitterHandle} />
                <meta name="twitter:site" content={twitterHandle} />

                {/* Additional Meta Tags */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <meta name="apple-mobile-web-app-title" content="HSBC" />
                <meta name="msapplication-TileColor" content="#1e293b" />
                <meta name="theme-color" content="#1e293b" />

                {/* JSON-LD Structured Data */}
                {jsonLdScript && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={jsonLdScript}
                    />
                )}
            </Head>
            {children}
        </>
    );
}
