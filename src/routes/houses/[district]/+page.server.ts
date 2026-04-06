import { error } from '@sveltejs/kit';
import { PRIVATE_SERVER_URL } from '$env/static/private';
import type { PageServerLoad } from './$types';
import type { PropertyDTO, LocationStatsDTO } from '$lib/types/property';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const districtSlug = params.district;

	// Resolve slug → canonical name + get stats (404 if unknown slug)
	const statsRes = await fetch(`${PRIVATE_SERVER_URL}/v1/api/locations/stats?district=${districtSlug}`);
	if (!statsRes.ok) {
		error(404, 'District not found');
	}
	const statsData = await statsRes.json();
	if (!statsData.success) {
		error(404, 'District not found');
	}

	const stats = statsData.data as LocationStatsDTO;
	const canonicalDistrict: string = stats.district;

	// Fetch first page of properties for this district
	const propsRes = await fetch(
		`${PRIVATE_SERVER_URL}/v1/api/properties?district=${encodeURIComponent(canonicalDistrict)}&limit=12&offset=0`
	);

	let properties: PropertyDTO[] = [];
	let total = 0;
	const propertyImageMap: Record<number, number[]> = {};

	if (propsRes.ok) {
		const propsData = await propsRes.json();
		if (propsData.success && propsData.data) {
			properties = propsData.data.properties ?? [];
			total = propsData.data.total ?? 0;

			await Promise.all(
				properties.map(async (property) => {
					if (!property.id) return;
					try {
						const imgRes = await fetch(`${PRIVATE_SERVER_URL}/v1/api/properties/${property.id}/images`);
						if (!imgRes.ok) return;
						const imgData = await imgRes.json();
						if (imgData.success && imgData.data?.images) {
							propertyImageMap[property.id] = imgData.data.images
								.sort(
									(a: { displayOrder?: number }, b: { displayOrder?: number }) =>
										(a.displayOrder ?? 0) - (b.displayOrder ?? 0)
								)
								.map((img: { id: number }) => img.id);
						}
					} catch {
						if (property.id) propertyImageMap[property.id] = [];
					}
				})
			);
		}
	}

	return {
		districtSlug,
		locationName: canonicalDistrict,
		stats,
		properties,
		total,
		propertyImageMap
	};
};
