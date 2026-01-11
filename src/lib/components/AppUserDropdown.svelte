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
		class="flex h-10 items-center gap-2 rounded-lg px-4 py-2 font-medium text-light-50 transition-all hover:bg-primary-700 dark:hover:bg-dark-800"
		aria-label={$_('menu.userMenu')}
		aria-expanded={dropdownOpen}
		aria-haspopup="true"
	>
		<FontAwesomeIcon icon={faUser} />
		<FontAwesomeIcon icon={faChevronDown} class="text-xs" />
	</button>
	<AppTooltip triggeredBy="#user-dropdown-button" placement="bottom">
		{$_('menu.userMenu')}
	</AppTooltip>

	<!-- Dropdown Menu -->
	{#if dropdownOpen}
		<div
			class="ring-opacity-5 absolute top-12 right-0 z-50 w-64 rounded-lg bg-light-50 py-2 shadow-lg ring-1 ring-dark-900 dark:bg-dark-800 dark:ring-light-300"
		>
			<!-- User Info -->
			<div class="border-b border-light-300 px-4 py-3 dark:border-dark-700">
				<p class="truncate text-sm font-semibold text-dark-900 dark:text-light-50">
					{user.firstName}
					{user.lastName}
				</p>
				<p class="truncate text-xs text-dark-300 dark:text-light-300">
					{user.email}
				</p>
			</div>

			<!-- Property Management Option -->
			<a
				href={resolve('/panel/properties')}
				class="flex w-full items-center gap-3 px-4 py-3 text-sm text-dark-900 transition-colors hover:bg-primary-100 dark:text-light-50 dark:hover:bg-dark-700"
			>
				<FontAwesomeIcon icon={faBuilding} />
				<span>{$_('menu.myProperties')}</span>
			</a>

			<!-- Logout Option -->
			<button
				onclick={handleLogout}
				class="flex w-full items-center gap-3 px-4 py-3 text-sm text-dark-900 transition-colors hover:bg-primary-100 dark:text-light-50 dark:hover:bg-dark-700"
			>
				<FontAwesomeIcon icon={faRightFromBracket} />
				<span>{$_('menu.logout')}</span>
			</button>
		</div>
	{/if}
</div>
