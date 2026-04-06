/**
 * Converts a location name to a URL-safe slug.
 * "Viana do Castelo" → "viana-do-castelo"
 * "São Brás de Alportel" → "sao-bras-de-alportel"
 */
export function slugify(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-{2,}/g, '-')
		.replace(/^-|-$/g, '');
}
