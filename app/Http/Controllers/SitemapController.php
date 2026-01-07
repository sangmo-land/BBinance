<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    /**
     * Generate XML sitemap for search engines
     */
    public function index(): Response
    {
        $pages = [
            [
                'url' => url('/'),
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'daily',
                'priority' => '1.0'
            ],
            [
                'url' => url('/login'),
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.8'
            ],
            [
                'url' => url('/register'),
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.9'
            ],
            [
                'url' => url('/dashboard'),
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'daily',
                'priority' => '0.9'
            ],
            [
                'url' => url('/transfer'),
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.8'
            ],
        ];

        $xml = $this->generateSitemap($pages);

        return response($xml)
            ->header('Content-Type', 'application/xml; charset=utf-8')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    /**
     * Generate mobile sitemap for search engines
     */
    public function mobile(): Response
    {
        $pages = [
            [
                'url' => url('/'),
                'lastmod' => now()->toAtomString(),
            ],
            [
                'url' => url('/dashboard'),
                'lastmod' => now()->toAtomString(),
            ],
            [
                'url' => url('/transfer'),
                'lastmod' => now()->toAtomString(),
            ],
        ];

        $xml = $this->generateMobileSitemap($pages);

        return response($xml)
            ->header('Content-Type', 'application/xml; charset=utf-8')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    /**
     * Generate sitemap XML content
     */
    private function generateSitemap(array $pages): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' .
                'xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">' . "\n";

        foreach ($pages as $page) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . htmlspecialchars($page['url'], ENT_XML1, 'UTF-8') . "</loc>\n";
            $xml .= "    <lastmod>" . $page['lastmod'] . "</lastmod>\n";
            $xml .= "    <changefreq>" . $page['changefreq'] . "</changefreq>\n";
            $xml .= "    <priority>" . $page['priority'] . "</priority>\n";
            $xml .= "    <mobile:mobile />\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Generate mobile-specific sitemap XML content
     */
    private function generateMobileSitemap(array $pages): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' .
                'xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">' . "\n";

        foreach ($pages as $page) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . htmlspecialchars($page['url'], ENT_XML1, 'UTF-8') . "</loc>\n";
            $xml .= "    <lastmod>" . $page['lastmod'] . "</lastmod>\n";
            $xml .= "    <mobile:mobile />\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Generate sitemap index for large sitemaps
     */
    public function sitemapIndex(): Response
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        $xml .= "  <sitemap>\n";
        $xml .= "    <loc>" . url('/sitemap.xml') . "</loc>\n";
        $xml .= "    <lastmod>" . now()->toAtomString() . "</lastmod>\n";
        $xml .= "  </sitemap>\n";
        $xml .= "  <sitemap>\n";
        $xml .= "    <loc>" . url('/sitemap-mobile.xml') . "</loc>\n";
        $xml .= "    <lastmod>" . now()->toAtomString() . "</lastmod>\n";
        $xml .= "  </sitemap>\n";
        $xml .= '</sitemapindex>';

        return response($xml)
            ->header('Content-Type', 'application/xml; charset=utf-8')
            ->header('Cache-Control', 'public, max-age=3600');
    }
}
