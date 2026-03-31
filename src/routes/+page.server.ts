import type { PageServerLoad } from './$types';
import type { PropertyDTO } from '$lib/types/property';
import { PRIVATE_SERVER_URL } from '$env/static/private';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch(
			`${PRIVATE_SERVER_URL}/v1/api/properties?status=available&limit=3&orderBy=created_desc`
		);

		if (!response.ok) {
			return { featuredProperties: [], propertyImageMap: {} };
		}

		const data = await response.json();
		if (!data.success || !data.data) {
			return { featuredProperties: [], propertyImageMap: {} };
		}

		const properties: PropertyDTO[] = data.data.properties ?? [];
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

		return { featuredProperties: properties, propertyImageMap };
	} catch {
		return { featuredProperties: [], propertyImageMap: {} };
	}
};
