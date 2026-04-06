import type { RequestHandler } from './$types';

const serverUrl = import.meta.env.VITE_SERVER_URL ?? '';
const website = 'https://immolux.pt';

export const prerender = false;

interface PublishedLocationDTO {
	name: string;
	slug: string;
	district?: string;
	districtSlug?: string;
	updatedAt: string;
}

interface PublishedLocationsData {
	districts: PublishedLocationDTO[];
	municipalities: PublishedLocationDTO[];
}

export const GET: RequestHandler = async ({ fetch }) => {
	let locations: PublishedLocationsData = { districts: [], municipalities: [] };

	try {
		const response = await fetch(`${serverUrl}/v1/api/locations/published`);
		if (response.ok) {
			const data = await response.json();
			if (data.success && data.data) {
				locations = data.data;
			}
		}
	} catch {
		// return empty urlset on error
	}

	const districtUrls = locations.districts
		.map(
			(d) => `    <url>
        <loc>${website}/houses/${d.slug}</loc>
        <lastmod>${new Date(d.updatedAt).toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>`
		)
		.join('\n');

	const municipalityUrls = locations.municipalities
		.filter((m) => m.districtSlug)
		.map(
			(m) => `    <url>
        <loc>${website}/houses/${m.districtSlug}/${m.slug}</loc>
        <lastmod>${new Date(m.updatedAt).toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.85</priority>
    </url>`
		)
		.join('\n');

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${districtUrls}
${municipalityUrls}
</urlset>`.trim();

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};
