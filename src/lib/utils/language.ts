import { locale } from 'svelte-i18n';

const LANGUAGE_STORAGE_KEY = 'immo-lux-language';

export const changeLanguage = (lang: string): void => {
	locale.set(lang);
	if (typeof window !== 'undefined') {
		localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
	}
};

export const getStoredLanguage = (): string | null => {
	if (typeof window !== 'undefined') {
		return localStorage.getItem(LANGUAGE_STORAGE_KEY);
	}
	return null;
};
