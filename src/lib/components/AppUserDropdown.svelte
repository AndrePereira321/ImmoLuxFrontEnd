<script lang="ts">
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBuilding, faChevronDown, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
	import { _ } from 'svelte-i18n';
	import type { User } from '$lib/types/auth';
	import AppTooltip from '$lib/components/AppTooltip.svelte';

	interface Props {
		user: User;
		onLogout: () => void;
	}

	let { user, onLogout }: Props = $props();

	let dropdownOpen = $state(false);
	let dropdownRef: HTMLDivElement;

	const toggleDropdown = () => {
		dropdownOpen = !dropdownOpen;
	};

	const handleLogout = () => {
		dropdownOpen = false;
		onLogout();
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			dropdownOpen = false;
		}
	};

	$effect(() => {
		if (dropdownOpen) {
			document.addEventListener('click', handleClickOutside);
		} else {
			document.removeEventListener('click', handleClickOutside);
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="relative" bind:this={dropdownRef}>
	<button
		id="user-dropdown-button"
		onclick={toggleDropdown}
		class="flex h-9 items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-dark-600 transition-all hover:bg-light-200/80 dark:text-light-400 dark:hover:bg-dark-800/80"
		aria-label={$_('menu.userMenu')}
		aria-expanded={dropdownOpen}
		aria-haspopup="true"
	>
		<FontAwesomeIcon icon={faUser} class="text-xs" />
		<FontAwesomeIcon icon={faChevronDown} class="text-[0.6rem]" />
	</button>
	<AppTooltip triggeredBy="#user-dropdown-button" placement="bottom">
		{$_('menu.userMenu')}
	</AppTooltip>

	<!-- Dropdown Menu -->
	{#if dropdownOpen}
		<div
			class="anim-fade-in-up absolute top-11 right-0 z-50 w-60 overflow-hidden rounded-xl border border-light-300 bg-white py-1.5 shadow-xl dark:border-dark-700 dark:bg-dark-800"
			style="animation-duration: 0.15s"
		>
			<!-- User Info -->
			<div class="border-b border-light-200 px-4 py-3 dark:border-dark-700">
				<p class="truncate text-sm font-semibold text-dark-900 dark:text-light-50">
					{user.firstName}
					{user.lastName}
				</p>
				<p class="truncate text-xs text-dark-400 dark:text-light-600">
					{user.email}
				</p>
			</div>

			<!-- Property Management Option -->
			<a
				href={resolve('/panel/properties')}
				class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-dark-700 transition-colors hover:bg-light-100 dark:text-light-300 dark:hover:bg-dark-700"
			>
				<FontAwesomeIcon icon={faBuilding} class="text-xs text-dark-400 dark:text-light-600" />
				<span>{$_('menu.myProperties')}</span>
			</a>

			<!-- Logout Option -->
			<button
				onclick={handleLogout}
				class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-dark-700 transition-colors hover:bg-light-100 dark:text-light-300 dark:hover:bg-dark-700"
			>
				<FontAwesomeIcon icon={faRightFromBracket} class="text-xs text-dark-400 dark:text-light-600" />
				<span>{$_('menu.logout')}</span>
			</button>
		</div>
	{/if}
</div>
