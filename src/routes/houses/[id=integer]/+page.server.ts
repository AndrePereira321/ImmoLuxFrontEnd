import type { PageServerLoad } from './$types';
import type { PropertyDTO } from '$lib/types/property';
import { error } from '@sveltejs/kit';
import { PRIVATE_SERVER_URL } from '$env/static/private';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const response = await fetch(`${PRIVATE_SERVER_URL}/v1/api/properties/${params.id}`);

	if (!response.ok) {
		error(404, 'Property not found');
	}

	const json = await response.json();

	if (!json.success || !json.data) {
		error(404, 'Property not found');
	}

	const property: PropertyDTO = json.data;

	let imageIds: number[] = [];
	try {
		const imgResponse = await fetch(`${PRIVATE_SERVER_URL}/v1/api/properties/${params.id}/images`);
		if (imgResponse.ok) {
			const imgData = await imgResponse.json();
			if (imgData.success && imgData.data?.images) {
				imageIds = imgData.data.images
					.sort(
						(a: { displayOrder?: number }, b: { displayOrder?: number }) =>
							(a.displayOrder ?? 0) - (b.displayOrder ?? 0)
					)
					.map((img: { id: number }) => img.id);
			}
		}
	} catch {
		/* images are optional */
	}

	return { property, imageIds };
};
