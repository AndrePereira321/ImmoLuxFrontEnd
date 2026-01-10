import ptFlag from '$lib/assets/flags/pt.svg';
import gbFlag from '$lib/assets/flags/gb.svg';
import frFlag from '$lib/assets/flags/fr.svg';
import type { Language } from '$lib/types/language';

export const LANGUAGES: Language[] = [
	{ code: 'pt', flag: ptFlag, name: 'Português' },
	{ code: 'en', flag: gbFlag, name: 'English' },
	{ code: 'fr', flag: frFlag, name: 'Français' }
];
