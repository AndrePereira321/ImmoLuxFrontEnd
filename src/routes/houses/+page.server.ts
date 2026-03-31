import type { PageServerLoad } from './$types';
import type { PropertyDTO } from '$lib/types/property';
import { PRIVATE_SERVER_URL } from '$env/static/private';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const district = url.searchParams.get('district') ?? '';
	const municipality = url.searchParams.get('municipality') ?? '';
	const parish = url.searchParams.get('parish') ?? '';
	const propertyType = url.searchParams.get('propertyType') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const minPrice = url.searchParams.get('minPrice');
	const maxPrice = url.searchParams.get('maxPrice');
	const orderBy = url.searchParams.get('orderBy') ?? 'created_desc';
	const limit = parseInt(url.searchParams.get('limit') ?? '12', 10);
	const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

	const params = new URLSearchParams();
	if (district) params.set('district', district);
	if (municipality) params.set('municipality', municipality);
	if (parish) params.set('parish', parish);
	if (propertyType) params.set('propertyType', propertyType);
	if (status) params.set('status', status);
	if (minPrice) params.set('minPrice', minPrice);
	if (maxPrice) params.set('maxPrice', maxPrice);
	params.set('orderBy', orderBy);
	params.set('limit', String(limit));
	params.set('offset', String(offset));

	try {
		const response = await fetch(`${PRIVATE_SERVER_URL}/v1/api/properties?${params}`);

		if (!response.ok) {
			return { properties: [], total: 0, propertyImageMap: {} };
		}

		const data = await response.json();
		if (!data.success || !data.data) {
			return { properties: [], total: 0, propertyImageMap: {} };
		}

		const properties: PropertyDTO[] = data.data.properties ?? [];
		const total: number = data.data.total ?? 0;
		const propertyImageMap: Record<number, number[]> = {};

		await Promise.all(
			properties.map(async (property) => {
				if (!property.id) return;
				try {
					const imgResponse = await fetch(`${PRIVATE_SERVER_URL}/v1/api/properties/${property.id}/images`);
					if (!imgResponse.ok) return;
					const imgData = await imgResponse.json();
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

		return { properties, total, propertyImageMap };
	} catch {
		return { properties: [], total: 0, propertyImageMap: {} };
	}
};
