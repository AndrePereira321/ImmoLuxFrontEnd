<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { LANGUAGES } from '$lib/constants/languages';
	import { changeLanguage } from '$lib/utils/language';

	const currentYear = new Date().getFullYear();
</script>

<footer class="bg-dark-800 text-light-200">
	<div class="px-4 py-6">
		<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
			<!-- Copyright -->
			<div class="text-center text-sm md:text-left">
				<p>© {currentYear} {$_('footer.author')}</p>
			</div>

			<!-- Language Selector -->
			<div class="flex items-center gap-2">
				<span class="text-sm">{$_('footer.language')}:</span>
				<div class="flex gap-2">
					{#each LANGUAGES as lang (lang.code)}
						<button
							onclick={() => changeLanguage(lang.code)}
							class="group relative overflow-hidden rounded transition-all hover:ring-2 hover:ring-secondary-500"
							class:ring-2={$locale === lang.code}
							class:ring-secondary-500={$locale === lang.code}
							aria-label={lang.name}
							title={lang.name}
						>
							<img src={lang.flag} alt={lang.name} class="h-6 w-8 object-cover" />
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</footer>
