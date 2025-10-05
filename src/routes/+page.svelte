<script>
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faArrowsToEye } from '@fortawesome/free-solid-svg-icons/faArrowsToEye';
	import { locale, locales } from 'svelte-i18n';
</script>

<div>
	<h1>Home</h1>

	<div class="flex items-center gap-2">
		<button class="bg-primary-500">Primary</button>
		<button class="bg-secondary-500">Secondary</button>
		<button class="bg-tertiary-500">Tertiary</button>
		<button class="bg-error-500">Error</button>
		<button class="bg-warning-500">Warning</button>
		<button class="bg-success-500">Success</button>
		<button class="bg-info-500">Info</button>
		<button class="bg-dark-500">Dark</button>
		<button class="bg-light-500">Light</button>
	</div>

	<div class="flex items-center gap-2">
		<FontAwesomeIcon icon={faArrowsToEye}></FontAwesomeIcon>
	</div>

	<select bind:value={$locale}>
		{#each $locales as locale (locale)}
			<option value={locale}>{locale}</option>
		{/each}
	</select>
</div>
