/**
 * The shape of a property search, and how it is written into a URL.
 *
 * The listing keeps no filter state of its own — the query string is the state.
 * Both the server load and the page read it through here so they cannot drift,
 * and so a filtered search survives a reload, a back button and a paste into
 * somebody else's chat window.
 */

export const SEARCH_PAGE_SIZE = 12;

export const PROPERTY_SORTS = [
	'created_desc',
	'popularity',
	'price_asc',
	'price_desc',
	'created_asc',
	'location'
] as const;

export type PropertySort = (typeof PROPERTY_SORTS)[number];

export const DEFAULT_SORT: PropertySort = 'created_desc';

export interface PropertySearch {
	q: string;
	district: string;
	municipality: string;
	parish: string;
	propertyType: string;
	status: string;
	minPrice: number | null;
	maxPrice: number | null;
	orderBy: PropertySort;
	offset: number;
}

/** Every filter that narrows results, in the order the rail presents them. */
export const NARROWING_KEYS = [
	'q',
	'municipality',
	'district',
	'parish',
	'propertyType',
	'status',
	'minPrice',
	'maxPrice'
] as const;

export type NarrowingKey = (typeof NARROWING_KEYS)[number];

const positiveNumber = (raw: string | null): number | null => {
	if (!raw) return null;
	const value = Number(raw);
	return Number.isFinite(value) && value >= 0 ? value : null;
};

const wholeNumber = (raw: string | null): number => {
	const value = Number(raw);
	return Number.isInteger(value) && value >= 0 ? value : 0;
};

export const readSearchParams = (params: URLSearchParams): PropertySearch => {
	const orderBy = params.get('orderBy') as PropertySort | null;

	return {
		q: (params.get('q') ?? '').trim(),
		district: params.get('district') ?? '',
		municipality: params.get('municipality') ?? '',
		parish: params.get('parish') ?? '',
		propertyType: params.get('propertyType') ?? '',
		status: params.get('status') ?? '',
		minPrice: positiveNumber(params.get('minPrice')),
		maxPrice: positiveNumber(params.get('maxPrice')),
		// An unknown sort in a hand-edited URL falls back rather than reaching the API.
		orderBy: orderBy && PROPERTY_SORTS.includes(orderBy) ? orderBy : DEFAULT_SORT,
		offset: wholeNumber(params.get('offset'))
	};
};

/** The filters as the API wants them. Paging and sort are added by the caller. */
export const toQueryString = (search: PropertySearch): string => {
	const params = new URLSearchParams();
	if (search.q) params.set('q', search.q);
	if (search.district) params.set('district', search.district);
	if (search.municipality) params.set('municipality', search.municipality);
	if (search.parish) params.set('parish', search.parish);
	if (search.propertyType) params.set('propertyType', search.propertyType);
	if (search.status) params.set('status', search.status);
	if (search.minPrice !== null) params.set('minPrice', String(search.minPrice));
	if (search.maxPrice !== null) params.set('maxPrice', String(search.maxPrice));
	params.set('orderBy', search.orderBy);
	return params.toString();
};

/**
 * The same search as a browser URL. Defaults are left out so that the address bar
 * shows what was actually chosen — `/houses` stays `/houses`, not `/houses?offset=0`.
 */
export const toPageQuery = (search: PropertySearch): string => {
	const params = new URLSearchParams();
	if (search.q) params.set('q', search.q);
	if (search.district) params.set('district', search.district);
	if (search.municipality) params.set('municipality', search.municipality);
	if (search.parish) params.set('parish', search.parish);
	if (search.propertyType) params.set('propertyType', search.propertyType);
	if (search.status) params.set('status', search.status);
	if (search.minPrice !== null) params.set('minPrice', String(search.minPrice));
	if (search.maxPrice !== null) params.set('maxPrice', String(search.maxPrice));
	if (search.orderBy !== DEFAULT_SORT) params.set('orderBy', search.orderBy);
	if (search.offset > 0) params.set('offset', String(search.offset));

	const query = params.toString();
	return query ? `?${query}` : '';
};

/** Which narrowing filters are set, so they can be listed and dropped one by one. */
export const activeFilters = (search: PropertySearch): NarrowingKey[] =>
	NARROWING_KEYS.filter((key) => {
		const value = search[key];
		return value !== '' && value !== null;
	});

/** The same search with one filter released. Paging resets: page 3 of a wider result is a different page. */
export const without = (search: PropertySearch, key: NarrowingKey): PropertySearch => ({
	...search,
	[key]: key === 'minPrice' || key === 'maxPrice' ? null : '',
	offset: 0
});
