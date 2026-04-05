<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBars, faGlobe, faHome, faRightToBracket, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
	import logoTransparentWhite from '$lib/assets/images/logo_transparent_white.png';
	import logoTransparentDark from '$lib/assets/images/logo_transparent_dark.png';
	import { _, locale } from 'svelte-i18n';
	import { LANGUAGES } from '$lib/constants/languages';
	import { changeLanguage as setLanguage } from '$lib/utils/language';
	import { authStore } from '$lib/stores/auth';
	import { notificationStore } from '$lib/stores/notification';
	import AppTooltip from '$lib/components/AppTooltip.svelte';
	import AppThemeToggler from '$lib/components/AppThemeToggler.svelte';
	import AppModal from '$lib/components/AppModal.svelte';
	import AppLoadingSpinner from '$lib/components/AppLoadingSpinner.svelte';
	import AppUserDropdown from '$lib/components/AppUserDropdown.svelte';

	const isActive = (path: string) => {
		const currentPath = $page.url.pathname;
		if (path === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(path);
	};

	let mobileMenuOpen = $state(false);
	let languageDropdownOpen = $state(false);
	let loginModalOpen = $state(false);
	let isLoggingOut = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let AppLoginForm: any = $state(null);
	let languageDropdownRef: HTMLDivElement;

	const authState = $derived($authStore);

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

	const handleClickOutsideLanguage = (event: MouseEvent) => {
		if (languageDropdownRef && !languageDropdownRef.contains(event.target as Node)) {
			languageDropdownOpen = false;
		}
	};

	$effect(() => {
		if (languageDropdownOpen) {
			document.addEventListener('click', handleClickOutsideLanguage);
		} else {
			document.removeEventListener('click', handleClickOutsideLanguage);
		}

		return () => {
			document.removeEventListener('click', handleClickOutsideLanguage);
		};
	});

	const openLoginModal = async () => {
		if (!AppLoginForm) {
			const module = await import('$lib/components/AppLoginForm.svelte');
			AppLoginForm = module.default;
		}
		loginModalOpen = true;
	};

	const closeLoginModal = () => {
		loginModalOpen = false;
	};

	const handleLoginSuccess = () => {
		closeLoginModal();
	};

	const handleLogout = async () => {
		isLoggingOut = true;
		const result = await authStore.logout();
		isLoggingOut = false;

		if (result.success) {
			notificationStore.success($_('auth.logoutSuccess'));
		} else {
			notificationStore.error($_('auth.logoutError'));
		}
	};
</script>

<nav class="glass border-b border-light-300/60 shadow-sm dark:border-dark-700/60">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo and Menu Items (Left Side) -->
			<div class="flex items-center gap-8">
				<!-- Logo/Brand -->
				<a href={resolve('/')} class="flex items-center gap-2.5 transition-all hover:opacity-80">
					<img src={logoTransparentDark} alt="ImmoLux" class="h-10 w-auto dark:hidden" />
					<img src={logoTransparentWhite} alt="ImmoLux" class="hidden h-10 w-auto dark:block" />
					<span
						class="text-2xl font-bold tracking-tight text-primary-900 dark:text-light-50"
						style="font-family: 'Playfair Display', Georgia, serif"
					>
						ImmoLux
					</span>
				</a>

				<!-- Subtle Divider -->
				<div class="hidden h-6 w-px bg-light-400/60 md:block dark:bg-dark-600/60"></div>

				<!-- Desktop Menu Items -->
				<div class="hidden items-center gap-1 md:flex">
					<a
						href={resolve('/')}
						class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all {isActive('/')
							? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
							: 'text-dark-600 hover:bg-light-200/80 hover:text-dark-900 dark:text-light-400 dark:hover:bg-dark-800/80 dark:hover:text-light-50'}"
					>
						<FontAwesomeIcon icon={faHome} class="text-xs" />
						<span>{$_('home')}</span>
					</a>
					<a
						href={resolve('/houses')}
						class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all {isActive(
							'/houses'
						)
							? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
							: 'text-dark-600 hover:bg-light-200/80 hover:text-dark-900 dark:text-light-400 dark:hover:bg-dark-800/80 dark:hover:text-light-50'}"
					>
						<FontAwesomeIcon icon={faSearch} class="text-xs" />
						<span>{$_('houses.title')}</span>
					</a>
				</div>
			</div>

			<!-- Right Side Controls (Desktop) -->
			<div class="hidden items-center gap-1 md:flex">
				<!-- Language Dropdown -->
				<div class="relative" bind:this={languageDropdownRef}>
					<button
						id="language-button"
						onclick={toggleLanguageDropdown}
						class="flex h-9 items-center gap-2 rounded-lg px-3 py-2 text-sm text-dark-500 transition-all hover:bg-light-200/80 hover:text-dark-800 dark:text-light-500 dark:hover:bg-dark-800/80 dark:hover:text-light-200"
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
							class="absolute top-11 right-0 z-50 w-40 overflow-hidden rounded-xl border border-light-300 bg-white py-1.5 shadow-xl dark:border-dark-700 dark:bg-dark-800"
						>
							{#each LANGUAGES as lang (lang.code)}
								<button
									onclick={() => changeLanguage(lang.code)}
									class="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-light-100 dark:hover:bg-dark-700 {$locale ===
									lang.code
										? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
										: 'text-dark-700 dark:text-light-200'}"
								>
									<img src={lang.flag} alt={lang.name} class="h-4 w-6 rounded-sm object-cover shadow-sm" />
									<span>{lang.name}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Theme Toggle -->
				<div id="theme-toggler-wrapper" class="flex h-9 items-center">
					<AppThemeToggler />
				</div>
				<AppTooltip triggeredBy="#theme-toggler-wrapper" placement="bottom">
					{$_('menu.toggleTheme')}
				</AppTooltip>

				<!-- Login/User Dropdown Button -->
				{#if !authState.isLoading}
					{#if authState.isAuthenticated && authState.user}
						<!-- User Dropdown -->
						<AppUserDropdown user={authState.user} onLogout={handleLogout} />
					{:else}
						<!-- Login Button -->
						<button
							id="login-button"
							onclick={openLoginModal}
							class="flex h-9 items-center gap-2 rounded-lg px-3 py-2 text-sm text-dark-500 transition-all hover:bg-light-200/80 hover:text-dark-800 dark:text-light-500 dark:hover:bg-dark-800/80 dark:hover:text-light-200"
							aria-label={$_('menu.login')}
						>
							<FontAwesomeIcon icon={faRightToBracket} />
						</button>
						<AppTooltip triggeredBy="#login-button" placement="bottom">
							{$_('menu.login')}
						</AppTooltip>
					{/if}
				{/if}
			</div>

			<!-- Mobile Right Side Controls -->
			<div class="flex items-center gap-2 md:hidden">
				<!-- Login/User Dropdown Button (Mobile) -->
				{#if !authState.isLoading}
					{#if authState.isAuthenticated && authState.user}
						<AppUserDropdown user={authState.user} onLogout={handleLogout} />
					{:else}
						<button
							onclick={openLoginModal}
							class="flex h-9 items-center gap-2 rounded-lg px-2.5 py-2 text-dark-600 transition-all hover:bg-light-200/80 dark:text-light-400 dark:hover:bg-dark-800/80"
							aria-label={$_('menu.login')}
						>
							<FontAwesomeIcon icon={faRightToBracket} />
						</button>
					{/if}
				{/if}

				<!-- Mobile Menu Button -->
				<button
					class="rounded-lg p-2 text-dark-600 transition-all hover:bg-light-200/80 dark:text-light-400 dark:hover:bg-dark-800/80"
					onclick={toggleMenu}
					aria-label="Toggle menu"
				>
					<FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} size="lg" />
				</button>
			</div>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div
				class="max-h-[calc(100vh-4rem)] space-y-1 overflow-y-auto border-t border-light-300/60 pt-3 pb-4 md:hidden dark:border-dark-700/60"
			>
				<a
					href={resolve('/')}
					class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all {isActive('/')
						? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
						: 'text-dark-700 hover:bg-light-200/60 dark:text-light-300 dark:hover:bg-dark-800/60'}"
					onclick={toggleMenu}
				>
					<FontAwesomeIcon icon={faHome} />
					<span>{$_('home')}</span>
				</a>
				<a
					href={resolve('/houses')}
					class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all {isActive('/houses')
						? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
						: 'text-dark-700 hover:bg-light-200/60 dark:text-light-300 dark:hover:bg-dark-800/60'}"
					onclick={toggleMenu}
				>
					<FontAwesomeIcon icon={faSearch} />
					<span>{$_('houses.title')}</span>
				</a>

				<!-- Theme Toggle Mobile -->
				<div class="mt-2 border-t border-light-300/60 pt-3 dark:border-dark-700/60">
					<div class="flex w-full items-center justify-between px-4 py-2">
						<span class="text-sm font-medium text-dark-600 dark:text-light-400">{$_('menu.toggleTheme')}</span>
						<AppThemeToggler />
					</div>
				</div>

				<!-- Language Selector Mobile -->
				<div class="border-t border-light-300/60 pt-3 dark:border-dark-700/60">
					<div class="px-4 py-1.5 text-xs font-semibold tracking-wider text-dark-400 uppercase dark:text-light-600">
						{$_('footer.language')}
					</div>
					{#each LANGUAGES as lang (lang.code)}
						<button
							onclick={() => {
								changeLanguage(lang.code);
								toggleMenu();
							}}
							class="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-all {$locale === lang.code
								? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
								: 'text-dark-700 hover:bg-light-200/60 dark:text-light-300 dark:hover:bg-dark-800/60'}"
						>
							<img src={lang.flag} alt={lang.name} class="h-4 w-6 rounded-sm object-cover shadow-sm" />
							<span>{lang.name}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</nav>

<!-- Login Modal -->
<AppModal
	bind:open={loginModalOpen}
	title={$_('auth.login')}
	size="md"
	closeOnBackdrop={false}
	onClose={closeLoginModal}
>
	{#if AppLoginForm}
		<AppLoginForm onSuccess={handleLoginSuccess} />
	{/if}
</AppModal>

<!-- Logout Loading -->
{#if isLoggingOut}
	<AppLoadingSpinner message={$_('auth.loggingOut')} overlay={true} />
{/if}
