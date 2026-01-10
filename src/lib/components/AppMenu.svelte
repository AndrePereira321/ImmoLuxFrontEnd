<script>
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBars, faHome, faHouse, faTimes } from '@fortawesome/free-solid-svg-icons';
	import { _ } from 'svelte-i18n';

	let mobileMenuOpen = $state(false);

	function toggleMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<nav class="bg-primary-600 shadow-xl">
	<div class="container mx-auto px-4">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo/Brand -->
			<a href={resolve('/')} class="flex items-center gap-3 transition-opacity hover:opacity-90">
				<FontAwesomeIcon icon={faHouse} class="text-2xl text-light-50" />
				<span class="text-2xl font-bold tracking-tight text-light-50">ImmoLux</span>
			</a>

			<!-- Desktop Menu -->
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
					<FontAwesomeIcon icon={faHouse} />
					<span>{$_('houses')}</span>
				</a>
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
			<div class="space-y-2 pb-4 md:hidden">
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
					<FontAwesomeIcon icon={faHouse} />
					<span>{$_('houses')}</span>
				</a>
			</div>
		{/if}
	</div>
</nav>
