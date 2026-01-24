<script lang="ts">
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

<nav class="bg-primary-600 shadow-xl dark:bg-dark-900">
	<div class="px-4">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo and Menu Items (Left Side) -->
			<div class="flex items-center gap-8">
				<!-- Logo/Brand -->
				<a href={resolve('/')} class="flex items-center gap-3 transition-opacity hover:opacity-90">
					<img src={logoTransparentWhite} alt="ImmoLux" class="h-8 w-auto dark:hidden" />
					<img src={logoTransparentDark} alt="ImmoLux" class="hidden h-8 w-auto dark:block" />
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
							class="ring-opacity-5 absolute top-12 right-0 z-50 w-40 rounded-lg bg-light-50 py-2 shadow-lg ring-1 ring-dark-900 dark:bg-dark-800 dark:ring-light-300"
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
				</div>

				<!-- Theme Toggle -->
				<div id="theme-toggler-wrapper" class="flex h-10 items-center">
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
						<!-- Login Button (icon only) -->
						<button
							id="login-button"
							onclick={openLoginModal}
							class="flex h-10 items-center gap-2 rounded-lg px-4 py-2 font-medium text-light-50 transition-all hover:bg-primary-700 dark:hover:bg-dark-800"
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
						<!-- User Dropdown (Mobile) -->
						<AppUserDropdown user={authState.user} onLogout={handleLogout} />
					{:else}
						<!-- Login Button (Mobile) -->
						<button
							onclick={openLoginModal}
							class="flex h-10 items-center gap-2 rounded-lg px-3 py-2 font-medium text-light-50 transition-all hover:bg-primary-700 dark:hover:bg-dark-800"
							aria-label={$_('menu.login')}
						>
							<FontAwesomeIcon icon={faRightToBracket} />
						</button>
					{/if}
				{/if}

				<!-- Mobile Menu Button -->
				<button
					class="rounded-lg p-2 text-light-50 transition-all hover:bg-primary-700"
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
					<span>{$_('houses.title')}</span>
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
