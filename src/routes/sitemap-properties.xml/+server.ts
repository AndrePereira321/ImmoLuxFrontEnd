import type { RequestHandler } from './$types';
import type { PropertyDTO } from '$lib/types/property';

const serverUrl = import.meta.env.VITE_SERVER_URL ?? '';
const website = 'https://immolux.pt';

export const prerender = false;

export const GET: RequestHandler = async ({ fetch }) => {
    let properties: PropertyDTO[] = [];

    try {
        const response = await fetch(`${serverUrl}/v1/api/properties?status=available&limit=1000`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                properties = data.data.properties;
            }
        }
    } catch {
        // return empty urlset on error
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${website}/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${website}/houses</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    ${properties
        .map(
            (property) => `    <url>
        <loc>${website}/houses/${property.id}</loc>
        <lastmod>${property.updatedAt ? new Date(property.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`
        )
        .join('\n')}
</urlset>`.trim();

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'max-age=0, s-maxage=3600'
        }
    });
};
