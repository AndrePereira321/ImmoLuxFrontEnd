import { init, register } from 'svelte-i18n';

register('pt', () => import('./assets/labels/pt.json'));
register('en', () => import('./assets/labels/en.json'));
register('fr', () => import('./assets/labels/fr.json'));

init({
	fallbackLocale: 'en',
	initialLocale: 'pt'
});
