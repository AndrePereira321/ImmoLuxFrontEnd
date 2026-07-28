<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBars, faHome, faRightToBracket, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
	import logoTransparentWhite from '$lib/assets/images/logo_transparent_white.png';
	import logoTransparentDark from '$lib/assets/images/logo_transparent_dark.png';
	import { _, locale } from 'svelte-i18n';
	import { themeStore } from '$lib/stores/theme';
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

	/** "PT" — the bar says which language you are reading, not just that a choice exists. */
	const currentLanguageCode = $derived(($locale ?? 'pt').slice(0, 2).toUpperCase());

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

<!-- The bar is the top edge of the tile field, not a pane floating over it: the
     same lime-washed ground as the page, closed by the same 1px grout line. Its
     container matches every section's container, so the wordmark stands exactly
     above the page's own left margin. Height stays 16 + 1px — the hero measures
     itself against it. -->
<nav class="azulejo-rule border-b bg-light-200/90 backdrop-blur-md dark:bg-dark-850/90">
	<div class="mx-auto max-w-[84rem] px-5 sm:px-8 lg:px-12">
		<div class="flex h-16 items-center justify-between gap-4">
			<!-- Logo and Menu Items (Left Side) -->
			<div class="flex min-w-0 items-center gap-9">
				<!-- Logo/Brand -->
				<a href={resolve('/')} class="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-75">
					<img src={logoTransparentDark} alt="" width="40" height="42" class="h-9 w-auto dark:hidden" />
					<img src={logoTransparentWhite} alt="" width="40" height="42" class="hidden h-9 w-auto dark:block" />
					<span class="type-display text-2xl text-primary-900 dark:text-light-50">ImmoLux</span>
				</a>

				<!-- Desktop Menu Items. Active state is an underline, not a filled pill:
				     the bar reads as a rule on the page rather than as stacked chips. -->
				<div class="hidden items-center gap-7 md:flex">
					<a
						href={resolve('/')}
						aria-current={isActive('/') ? 'page' : undefined}
						class="border-b-2 py-1 text-sm font-medium transition-colors {isActive('/')
							? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300'
							: 'border-transparent text-dark-500 hover:border-light-900 hover:text-dark-900 dark:text-light-400 dark:hover:border-dark-500 dark:hover:text-light-50'}"
					>
						{$_('home')}
					</a>
					<a
						href={resolve('/houses')}
						aria-current={isActive('/houses') ? 'page' : undefined}
						class="border-b-2 py-1 text-sm font-medium transition-colors {isActive('/houses')
							? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300'
							: 'border-transparent text-dark-500 hover:border-light-900 hover:text-dark-900 dark:text-light-400 dark:hover:border-dark-500 dark:hover:text-light-50'}"
					>
						{$_('houses.title')}
					</a>
				</div>
			</div>

			<!-- Right Side Controls (Desktop) -->
			<div class="hidden shrink-0 items-center gap-1 md:flex">
				<!-- Language. The bar carries the code you are reading rather than a
				     globe, which only ever says "languages exist". -->
				<div class="relative" bind:this={languageDropdownRef}>
					<button
						onclick={toggleLanguageDropdown}
						class="type-record flex h-9 items-center gap-1.5 px-3 text-sm text-dark-500 transition-colors hover:bg-light-400/70 hover:text-dark-900 dark:text-light-500 dark:hover:bg-dark-700/70 dark:hover:text-light-100"
						aria-expanded={languageDropdownOpen}
					>
						<span class="sr-only">{$_('menu.selectLanguage')}</span>
						<span aria-hidden="true">{currentLanguageCode}</span>
						<span aria-hidden="true" class="text-[0.55rem] opacity-60">▼</span>
					</button>

					<!-- Language Dropdown Menu -->
					{#if languageDropdownOpen}
						<div
							class="azulejo-rule absolute top-[calc(100%+0.5rem)] right-0 z-50 w-44 overflow-hidden border bg-light-50 shadow-xl dark:bg-dark-800"
						>
							{#each LANGUAGES as lang (lang.code)}
								<button
									onclick={() => changeLanguage(lang.code)}
									class="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-light-300 dark:hover:bg-dark-700 {$locale ===
									lang.code
										? 'bg-primary-50 font-medium text-primary-800 dark:bg-primary-950/60 dark:text-primary-200'
										: 'text-dark-700 dark:text-light-200'}"
								>
									<img src={lang.flag} alt="" width="24" height="16" class="h-4 w-6 object-cover" />
									<span class="min-w-0 truncate">{lang.name}</span>
									<span aria-hidden="true" class="type-record ml-auto text-xs opacity-50">
										{lang.code.toUpperCase()}
									</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Theme Toggle -->
				<div id="theme-toggler-wrapper" class="flex h-9 items-center">
					<AppThemeToggler variant="icon" />
				</div>
				<AppTooltip triggeredBy="#theme-toggler-wrapper" placement="bottom">
					{$_($themeStore === 'dark' ? 'menu.themeToLight' : 'menu.themeToDark')}
				</AppTooltip>

				<!-- Login/User Dropdown Button -->
				{#if !authState.isLoading}
					{#if authState.isAuthenticated && authState.user}
						<!-- User Dropdown -->
						<AppUserDropdown user={authState.user} onLogout={handleLogout} />
					{:else}
						<!-- Named, and squared off like the page's other calls to action —
						     an arrow-into-a-door icon on its own is a guess. -->
						<button
							onclick={openLoginModal}
							class="ml-2 flex h-9 items-center gap-2 border border-light-900 px-3.5 text-sm font-medium text-dark-600 transition-colors hover:border-primary-600 hover:text-primary-700 dark:border-dark-500 dark:text-light-400 dark:hover:border-primary-400 dark:hover:text-primary-300"
						>
							<FontAwesomeIcon icon={faRightToBracket} class="text-xs" />
							{$_('menu.login')}
						</button>
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
							class="flex h-10 w-10 items-center justify-center text-dark-600 transition-colors hover:bg-light-400/70 dark:text-light-400 dark:hover:bg-dark-700/70"
							aria-label={$_('menu.login')}
						>
							<FontAwesomeIcon icon={faRightToBracket} />
						</button>
					{/if}
				{/if}

				<!-- Mobile Menu Button -->
				<button
					class="flex h-10 w-10 items-center justify-center text-dark-600 transition-colors hover:bg-light-400/70 dark:text-light-400 dark:hover:bg-dark-700/70"
					onclick={toggleMenu}
					aria-label={$_('menu.mainMenu')}
					aria-expanded={mobileMenuOpen}
				>
					<!-- Separate blocks, not one switched prop: svelte-fontawesome reads its
					     icon once at creation, so the bars never became a cross. -->
					{#if mobileMenuOpen}
						<FontAwesomeIcon icon={faTimes} size="lg" />
					{:else}
						<FontAwesomeIcon icon={faBars} size="lg" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<!-- The panel bleeds to the viewport edge and its rows carry the container's
			     own padding, so highlights run full width, the text starts on the same
			     line as the wordmark, and nothing overflows the scroll box sideways. -->
			<div class="azulejo-rule -mx-5 max-h-[calc(100svh-4rem)] overflow-y-auto border-t pt-2 pb-4 sm:-mx-8 md:hidden">
				<a
					href={resolve('/')}
					class="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors sm:px-8 {isActive('/')
						? 'bg-primary-50 text-primary-800 dark:bg-primary-950/60 dark:text-primary-200'
						: 'text-dark-700 hover:bg-light-400/60 dark:text-light-300 dark:hover:bg-dark-700/60'}"
					onclick={toggleMenu}
				>
					<FontAwesomeIcon icon={faHome} class="w-4 text-xs opacity-60" />
					<span>{$_('home')}</span>
				</a>
				<a
					href={resolve('/houses')}
					class="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors sm:px-8 {isActive('/houses')
						? 'bg-primary-50 text-primary-800 dark:bg-primary-950/60 dark:text-primary-200'
						: 'text-dark-700 hover:bg-light-400/60 dark:text-light-300 dark:hover:bg-dark-700/60'}"
					onclick={toggleMenu}
				>
					<FontAwesomeIcon icon={faSearch} class="w-4 text-xs opacity-60" />
					<span>{$_('houses.title')}</span>
				</a>

				<!-- Theme Toggle Mobile -->
				<div class="azulejo-rule mt-3 border-t pt-3">
					<div class="flex w-full items-center justify-between px-5 py-2 sm:px-8">
						<span class="text-sm font-medium text-dark-600 dark:text-light-400">{$_('menu.toggleTheme')}</span>
						<AppThemeToggler />
					</div>
				</div>

				<!-- Language Selector Mobile -->
				<div class="azulejo-rule mt-3 border-t pt-3">
					<p class="type-label px-5 py-1.5 text-primary-700 sm:px-8 dark:text-primary-300">
						{$_('footer.language')}
					</p>
					{#each LANGUAGES as lang (lang.code)}
						<button
							onclick={() => {
								changeLanguage(lang.code);
								toggleMenu();
							}}
							class="flex w-full items-center gap-3 px-5 py-2.5 text-sm transition-colors sm:px-8 {$locale === lang.code
								? 'bg-primary-50 font-medium text-primary-800 dark:bg-primary-950/60 dark:text-primary-200'
								: 'text-dark-700 hover:bg-light-400/60 dark:text-light-300 dark:hover:bg-dark-700/60'}"
						>
							<img src={lang.flag} alt="" width="24" height="16" class="h-4 w-6 object-cover" />
							<span class="min-w-0 truncate">{lang.name}</span>
							<span aria-hidden="true" class="type-record ml-auto text-xs opacity-50">{lang.code.toUpperCase()}</span>
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
