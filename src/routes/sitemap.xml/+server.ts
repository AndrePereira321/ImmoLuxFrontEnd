import type { RequestHandler } from './$types';

const website = 'https://immolux.pt';

export const prerender = false;

export const GET: RequestHandler = async () => {
	const now = new Date().toISOString();

	const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${website}/sitemap-properties.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${website}/sitemap-locations.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>
</sitemapindex>`.trim();

	return new Response(index, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};
