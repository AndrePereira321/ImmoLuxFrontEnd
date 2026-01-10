import { locale } from 'svelte-i18n';

export const changeLanguage = (lang: string): void => {
	locale.set(lang);
};
