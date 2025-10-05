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
		<a class="text-dark-900 hover:text-secondary-500 cursor-pointer text-xl font-bold md:text-2xl" href={resolve('/')}>
			ImmoLux
		</a>
		<button
			class="text-dark-900 hover:text-dark-100 cursor-pointer focus:outline-none md:hidden"
			on:click={toggleNavbar}
			title="toggle_menu"
			type="button"
		>
			<FontAwesomeIcon icon={faBars}></FontAwesomeIcon>
		</button>
	</div>

	<div
		class="mt-8 flex-col space-y-4 md:mt-0 md:flex md:flex-row md:items-center md:space-x-10 md:space-y-0 {showMenu
			? 'flex'
			: 'hidden'}"
	>
		<a class="text-dark-900 hover:text-primary-400" href={resolve('/')}>{$_('home')}</a>
		<a class="text-dark-900 hover:text-primary-400" href={resolve('/houses')}>{$_('houses')}</a>
	</div>
</div>
