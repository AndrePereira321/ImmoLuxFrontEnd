import { init, register } from 'svelte-i18n';
import { getStoredLanguage } from './utils/language';

register('pt', () => import('./assets/labels/pt.json'));
register('en', () => import('./assets/labels/en.json'));
register('fr', () => import('./assets/labels/fr.json'));

const storedLanguage = getStoredLanguage();

init({
	fallbackLocale: 'en',
	initialLocale: storedLanguage || 'pt'
});
