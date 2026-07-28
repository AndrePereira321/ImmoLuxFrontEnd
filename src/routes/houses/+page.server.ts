import type { PageServerLoad } from './$types';
import type { PropertyDTO, PropertyFacets } from '$lib/types/property';
import { PRIVATE_SERVER_URL } from '$env/static/private';
import { SEARCH_PAGE_SIZE, readSearchParams, toQueryString } from '$lib/utils/property-search';

const emptyFacets: PropertyFacets = {
	total: 0,
	districts: [],
	municipalities: [],
	parishes: [],
	propertyTypes: [],
	statuses: [],
	minPrice: null,
	maxPrice: null
};

/**
 * The query string is the whole state of this page, so the load function is the
 * only thing that fetches: no client-side mirror of the same filters to drift
 * out of step with it, and every search is a URL somebody can send to someone.
 */
export const load: PageServerLoad = async ({ fetch, url, setHeaders }) => {
	const search = readSearchParams(url.searchParams);
	const query = toQueryString(search);

	const listUrl = `${PRIVATE_SERVER_URL}/v1/api/properties?${query}&limit=${SEARCH_PAGE_SIZE}&offset=${search.offset}`;
	const facetsUrl = `${PRIVATE_SERVER_URL}/v1/api/properties/facets?${query}`;

	try {
		// Facets are what the filter rail is built from, so they travel with the
		// results rather than arriving later and reflowing the page under the reader.
		const [listResponse, facetsResponse] = await Promise.all([fetch(listUrl), fetch(facetsUrl)]);

		const listJson = listResponse.ok ? await listResponse.json() : null;
		const facetsJson = facetsResponse.ok ? await facetsResponse.json() : null;

		const properties: PropertyDTO[] = listJson?.success ? (listJson.data?.properties ?? []) : [];
		const total: number = listJson?.success ? (listJson.data?.total ?? 0) : 0;
		const facets: PropertyFacets = facetsJson?.success ? { ...emptyFacets, ...facetsJson.data } : emptyFacets;

		const propertyImageMap: Record<number, number[]> = {};
		await Promise.all(
			properties.map(async (property) => {
				if (!property.id) return;
				try {
					const imageResponse = await fetch(`${PRIVATE_SERVER_URL}/v1/api/properties/${property.id}/images`);
					if (!imageResponse.ok) return;
					const imageJson = await imageResponse.json();
					if (imageJson.success && imageJson.data?.images) {
						propertyImageMap[property.id] = imageJson.data.images
							.sort(
								(a: { displayOrder?: number }, b: { displayOrder?: number }) =>
									(a.displayOrder ?? 0) - (b.displayOrder ?? 0)
							)
							.map((image: { id: number }) => image.id);
					}
				} catch {
					if (property.id) propertyImageMap[property.id] = [];
				}
			})
		);

		// A catalogue of ten changes a few times a month, and the counts are derived
		// from it, so a short shared cache costs nothing and absorbs filter-clicking.
		setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60' });

		return { properties, total, propertyImageMap, facets, search };
	} catch {
		return { properties: [], total: 0, propertyImageMap: {}, facets: emptyFacets, search };
	}
};
