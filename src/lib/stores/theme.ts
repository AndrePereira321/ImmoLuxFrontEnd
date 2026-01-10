import { get, writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'auto';
type ThemeMode = 'light' | 'dark';

const getStoredTheme = (): Theme => {
	if (!browser) return 'auto';
	const stored = localStorage.getItem('theme');
	if (stored === 'light' || stored === 'dark' || stored === 'auto') {
		return stored;
	}
	return 'auto';
};

const getPrefersDark = (): boolean => {
	if (!browser) return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const resolveThemeMode = (theme: Theme): ThemeMode => {
	if (theme === 'auto') {
		return getPrefersDark() ? 'dark' : 'light';
	}
	return theme;
};

const updateDocumentClass = (mode: ThemeMode): void => {
	if (!browser) return;
	if (mode === 'dark') {
		document.documentElement.classList.add('dark');
	} else {
		document.documentElement.classList.remove('dark');
	}
};

const createThemeStore = () => {
	const initialTheme = getStoredTheme();
	const initialMode = resolveThemeMode(initialTheme);

	const themeStore = writable<Theme>(initialTheme);
	const modeStore = writable<ThemeMode>(initialMode);

	if (browser) {
		updateDocumentClass(initialMode);

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleMediaChange = () => {
			const currentTheme = get(themeStore);
			if (currentTheme === 'auto') {
				const newMode = resolveThemeMode('auto');
				modeStore.set(newMode);
				updateDocumentClass(newMode);
			}
		};
		mediaQuery.addEventListener('change', handleMediaChange);
	}

	const setTheme = (theme: Theme): void => {
		themeStore.set(theme);
		if (browser) {
			localStorage.setItem('theme', theme);
		}
		const newMode = resolveThemeMode(theme);
		modeStore.set(newMode);
		updateDocumentClass(newMode);
	};

	const toggle = (): void => {
		const currentTheme = get(themeStore);
		if (currentTheme === 'auto') {
			const isDark = getPrefersDark();
			setTheme(isDark ? 'light' : 'dark');
		} else {
			setTheme(currentTheme === 'dark' ? 'light' : 'dark');
		}
	};

	return {
		subscribe: modeStore.subscribe,
		setTheme,
		toggle
	};
};

export const themeStore = createThemeStore();
