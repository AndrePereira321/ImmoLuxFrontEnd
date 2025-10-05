<script>
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
	import { _ } from 'svelte-i18n';

	let showMenu = false;

	function toggleNavbar() {
		showMenu = !showMenu;
	}
</script>

<div class="md:flex md:items-center md:justify-between">
	<div class="flex items-center justify-between">
		<a
			class="cursor-pointer text-xl font-bold text-dark-900 hover:text-secondary-500 focus:text-secondary-500 md:text-2xl"
			href={resolve('/')}
		>
			ImmoLux
		</a>
		<button
			class="cursor-pointer text-dark-900 hover:text-dark-100 focus:outline-none md:hidden"
			on:click={toggleNavbar}
			title="toggle_menu"
			type="button"
		>
			<FontAwesomeIcon icon={faBars}></FontAwesomeIcon>
		</button>
	</div>

	<div
		class="mt-8 flex-col space-y-4 md:mt-0 md:flex md:flex-row md:items-center md:space-y-0 md:space-x-10 {showMenu
			? 'flex'
			: 'hidden'}"
	>
		{#snippet menuItem(path, label)}
			<a
				class="text-dark-900 hover:font-medium hover:text-primary-400 hover:underline focus:text-primary-400 focus:underline"
				href={resolve(path)}>{$_(label)}</a
			>
		{/snippet}
		{@render menuItem('/', 'home')}
		{@render menuItem('/houses', 'houses')}
	</div>
</div>
