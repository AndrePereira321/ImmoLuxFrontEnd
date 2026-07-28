export type PropertyType = 'house' | 'apartment' | 'villa' | 'townhouse' | 'land' | 'commercial';
export type PropertyStatus = 'available' | 'pending' | 'sold' | 'rented';
export type EnergyRating = 'Aplus' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface PropertyDTO {
	id?: number;
	title?: string;
	description?: string;
	propertyType?: PropertyType;
	price?: number;
	status?: PropertyStatus;
	isPublished?: boolean;

	// Location
	address?: string;
	district?: string;
	municipality?: string;
	parish?: string;
	postalCode?: string;
	country?: string;
	latitude?: number;
	longitude?: number;

	// Property details
	bedrooms?: number;
	bathrooms?: number;
	areaSqm?: number;
	landAreaSqm?: number;
	yearBuilt?: number;
	floor?: number;
	totalFloors?: number;
	parkingSpaces?: number;

	// Features
	hasGarage?: boolean;
	hasGarden?: boolean;
	hasPool?: boolean;
	hasElevator?: boolean;
	energyRating?: EnergyRating;
	virtualTourUrl?: string;

	// Relationships
	contactIds?: number[];
	contacts?: import('./contact').ContactDTO[];
	publisherId?: number;

	// Metadata
	viewCount?: number;
	publishedAt?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface PropertyImageDTO {
	id?: number;
	propertyId?: number;
	contentType?: string;
	fileSize?: number;
	width?: number;
	height?: number;
	displayOrder?: number;
	createdAt?: string;
}

/** One choosable option in the search, and how many properties sit behind it. */
export interface FacetBucket {
	value: string;
	count: number;
	/** The district a municipality belongs to. Absent on every other dimension. */
	parent?: string;
}

/**
 * Returned by GET /v1/api/properties/facets. Every dimension is counted with the
 * current filters applied except its own, so a bucket's count is what choosing it
 * would actually yield — and an option missing from a list has nothing behind it.
 */
export interface PropertyFacets {
	total: number;
	districts: FacetBucket[];
	municipalities: FacetBucket[];
	parishes: FacetBucket[];
	propertyTypes: FacetBucket[];
	statuses: FacetBucket[];
	minPrice: number | null;
	maxPrice: number | null;
}

export interface LocationsResponse {
	districts: string[];
	municipalities: string[];
	parishes: string[];
}

export interface LocationStatsDTO {
	district: string;
	municipality: string | null;
	total: number;
	minPrice: number;
	maxPrice: number;
	avgPrice: number;
	mostCommonType: string;
}
