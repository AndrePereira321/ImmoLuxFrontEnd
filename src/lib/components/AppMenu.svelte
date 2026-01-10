<script lang="ts">
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBars, faBuilding, faGlobe, faHome, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
	import { _, locale } from 'svelte-i18n';
	import { LANGUAGES } from '$lib/constants/languages';
	import { changeLanguage as setLanguage } from '$lib/utils/language';
	import { themeStore } from '$lib/stores/theme';
	import AppTooltip from '$lib/components/AppTooltip.svelte';
	import AppThemeToggler from '$lib/components/AppThemeToggler.svelte';

	let mobileMenuOpen = $state(false);
	let languageDropdownOpen = $state(false);

	const toggleMenu = () => {
		mobileMenuOpen = !mobileMenuOpen;
	};

	const toggleLanguageDropdown = () => {
		languageDropdownOpen = !languageDropdownOpen;
	};

	const changeLanguage = (lang: string) => {
		setLanguage(lang);
		languageDropdownOpen = false;
	};

	const toggleTheme = () => {
		themeStore.toggle();
	};
</script>

<nav class="bg-primary-600 shadow-xl dark:bg-dark-900">
	<div class="px-4">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo and Menu Items (Left Side) -->
			<div class="flex items-center gap-8">
				<!-- Logo/Brand -->
				<a href={resolve('/')} class="flex items-center gap-3 transition-opacity hover:opacity-90">
					<FontAwesomeIcon icon={faBuilding} class="text-2xl text-light-50" />
					<span class="text-2xl font-bold tracking-tight text-light-50">ImmoLux</span>
				</a>

				<!-- Vertical Divider -->
				<div class="hidden h-8 w-px bg-primary-400 md:block dark:bg-dark-700"></div>

				<!-- Desktop Menu Items -->
				<div class="hidden items-center gap-1 md:flex">
					<a
						href={resolve('/')}
						class="flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-light-50 transition-all hover:bg-primary-700"
					>
						<FontAwesomeIcon icon={faHome} />
						<span>{$_('home')}</span>
					</a>
					<a
						href={resolve('/houses')}
						class="flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-light-50 transition-all hover:bg-primary-700"
					>
						<FontAwesomeIcon icon={faSearch} />
						<span>{$_('houses')}</span>
					</a>
				</div>
			</div>

			<!-- Right Side Controls (Desktop) -->
			<div class="hidden items-center gap-1 md:flex">
				<!-- Language Dropdown -->
				<button
					id="language-button"
					onclick={toggleLanguageDropdown}
					class="flex h-10 items-center gap-2 rounded-lg px-4 py-2 font-medium text-light-50 transition-all hover:bg-primary-700"
					aria-label={$_('menu.selectLanguage')}
				>
					<FontAwesomeIcon icon={faGlobe} />
				</button>
				<AppTooltip triggeredBy="#language-button" placement="bottom">
					{$_('menu.selectLanguage')}
				</AppTooltip>

				<!-- Language Dropdown Menu -->
				{#if languageDropdownOpen}
					<div
						class="ring-opacity-5 absolute top-16 right-0 w-40 rounded-lg bg-light-50 py-2 shadow-lg ring-1 ring-dark-900 dark:bg-dark-800 dark:ring-light-300"
					>
						{#each LANGUAGES as lang (lang.code)}
							<button
								onclick={() => changeLanguage(lang.code)}
								class="flex w-full items-center gap-3 px-4 py-2 text-sm text-dark-900 transition-colors hover:bg-primary-100 dark:text-light-50 dark:hover:bg-dark-700"
								class:bg-primary-200={$locale === lang.code}
								class:dark:bg-dark-700={$locale === lang.code}
							>
								<img src={lang.flag} alt={lang.name} class="h-4 w-6 object-cover" />
								<span>{lang.name}</span>
							</button>
						{/each}
					</div>
				{/if}

				<!-- Theme Toggle -->
				<div id="theme-toggler-wrapper" class="flex h-10 items-center">
					<AppThemeToggler />
				</div>
				<AppTooltip triggeredBy="#theme-toggler-wrapper" placement="bottom">
					{$_('menu.toggleTheme')}
				</AppTooltip>
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="rounded-lg p-2 text-light-50 transition-all hover:bg-primary-700 md:hidden"
				onclick={toggleMenu}
				aria-label="Toggle menu"
			>
				<FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} size="lg" />
			</button>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div
				class="max-h-[calc(100vh-4rem)] space-y-2 overflow-y-auto pb-4 md:hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary-500 hover:[&::-webkit-scrollbar-thumb]:bg-primary-400 dark:[&::-webkit-scrollbar-thumb]:bg-dark-700 dark:hover:[&::-webkit-scrollbar-thumb]:bg-dark-600 [&::-webkit-scrollbar-track]:bg-primary-700 dark:[&::-webkit-scrollbar-track]:bg-dark-800"
			>
				<a
					href={resolve('/')}
					class="flex items-center gap-3 rounded-lg px-4 py-3 font-medium text-light-50 transition-all hover:bg-primary-700"
					onclick={toggleMenu}
				>
					<FontAwesomeIcon icon={faHome} />
					<span>{$_('home')}</span>
				</a>
				<a
					href={resolve('/houses')}
					class="flex items-center gap-3 rounded-lg px-4 py-3 font-medium text-light-50 transition-all hover:bg-primary-700"
					onclick={toggleMenu}
				>
					<FontAwesomeIcon icon={faSearch} />
					<span>{$_('houses')}</span>
				</a>

				<!-- Theme Toggle Mobile -->
				<div class="border-t border-primary-700 pt-2">
					<div class="flex w-full items-center justify-between px-4 py-3">
						<span class="font-medium text-light-50">{$_('menu.toggleTheme')}</span>
						<AppThemeToggler />
					</div>
				</div>

				<!-- Language Selector Mobile -->
				<div class="border-t border-primary-700 pt-2">
					<div class="px-4 py-2 text-xs font-semibold text-light-300 uppercase">
						{$_('footer.language')}
					</div>
					{#each LANGUAGES as lang (lang.code)}
						<button
							onclick={() => {
								changeLanguage(lang.code);
								toggleMenu();
							}}
							class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-light-50 transition-all hover:bg-primary-700"
							class:bg-primary-700={$locale === lang.code}
						>
							<img src={lang.flag} alt={lang.name} class="h-4 w-6 object-cover" />
							<span>{lang.name}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</nav>
