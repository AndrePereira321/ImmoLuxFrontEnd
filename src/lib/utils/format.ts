/**
 * Number and currency formatting for property records.
 *
 * Everything goes through Intl so a French visitor reads 345 000 € and an
 * English one reads €345,000 — the same number, spelled the way they expect.
 */

/** Maps the app's language codes onto the BCP 47 tags Intl expects. */
const INTL_LOCALES: Record<string, string> = {
	pt: 'pt-PT',
	en: 'en-GB',
	fr: 'fr-FR'
};

export const intlLocale = (lang?: string | null): string => INTL_LOCALES[lang ?? 'pt'] ?? 'pt-PT';

export const formatPrice = (price?: number | null, lang?: string | null): string => {
	if (price === undefined || price === null) return '—';
	return new Intl.NumberFormat(intlLocale(lang), {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	}).format(price);
};

/** Returns null when there is no area, so callers can drop the field entirely. */
export const formatArea = (area?: number | null, lang?: string | null): string | null => {
	if (!area) return null;
	// Non-breaking space: the number and its unit must never wrap apart.
	return `${new Intl.NumberFormat(intlLocale(lang)).format(area)}\u00a0m²`;
};

/** Catalogue reference: 1 → "01". */
export const formatLotNumber = (index: number): string => String(index + 1).padStart(2, '0');
