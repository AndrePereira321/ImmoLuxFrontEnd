import { z } from 'zod';

const postalCodeRegex = /^\d{4}-\d{3}$/;

export const propertySchema = z.object({
	title: z.string().min(1, 'properties.titleRequired').max(200, 'properties.titleMaxLength').trim(),
	description: z.string().min(1, 'properties.descriptionRequired').trim(),
	propertyType: z.enum(['house', 'apartment', 'villa', 'townhouse', 'land', 'commercial']),
	price: z.number().positive('properties.pricePositive'),
	status: z.enum(['available', 'pending', 'sold', 'rented']).default('available'),

	// Location (required)
	address: z.string().min(1, 'properties.addressRequired').max(255, 'properties.addressMaxLength').trim(),
	district: z.string().min(1, 'properties.districtRequired').max(100).trim(),
	municipality: z.string().min(1, 'properties.municipalityRequired').max(100).trim(),
	parish: z.string().max(100).optional(),
	postalCode: z.string().regex(postalCodeRegex, 'properties.postalCodeInvalid').optional().or(z.literal('')),
	country: z.string().max(2).default('PT'),
	latitude: z.number().optional(),
	longitude: z.number().optional(),

	// Property details (optional)
	bedrooms: z.number().int().min(0, 'properties.bedroomsMin').optional(),
	bathrooms: z.number().int().min(0, 'properties.bathroomsMin').optional(),
	areaSqm: z.number().positive('properties.areaSqmPositive').optional(),
	landAreaSqm: z.number().positive('properties.landAreaSqmPositive').optional(),
	yearBuilt: z
		.number()
		.int()
		.min(1800)
		.max(new Date().getFullYear() + 2)
		.optional(),
	floor: z.number().int().optional(),
	totalFloors: z.number().int().min(1).optional(),
	parkingSpaces: z.number().int().min(0).optional(),

	// Features (optional booleans)
	hasGarage: z.boolean().default(false),
	hasGarden: z.boolean().default(false),
	hasPool: z.boolean().default(false),
	hasElevator: z.boolean().default(false),
	energyRating: z.enum(['Aplus', 'A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
	virtualTourUrl: z.string().url('properties.virtualTourUrlInvalid').max(500).optional().or(z.literal('')),

	// Contact
	contactId: z.number().int().positive('properties.contactRequired')
});

export type PropertyFormData = z.infer<typeof propertySchema>;
