<script lang="ts">
	import { resolve } from '$app/paths';
	import { _, locale } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEnvelope, faHome, faMapMarkerAlt, faPhone, faSearch } from '@fortawesome/free-solid-svg-icons';
	import { LANGUAGES } from '$lib/constants/languages';
	import { changeLanguage } from '$lib/utils/language';
	import AppTooltip from '$lib/components/AppTooltip.svelte';

	const currentYear = new Date().getFullYear();
	const contactEmail = 'info@immolux.pt';
	const contactPhone = '';
	const contactAddress = 'Lousada, Portugal';
</script>

<footer class="bg-dark-800 text-light-200 dark:bg-dark-950 dark:text-light-300">
	<div class="container mx-auto px-4 py-8">
		<div class="grid gap-8 md:grid-cols-3">
			<!-- Company Info -->
			<div class="space-y-3">
				<h3 class="text-lg font-semibold text-light-50">{$_('footer.about')}</h3>
				<p class="text-sm leading-relaxed">
					{$_('footer.aboutDescription')}
				</p>
			</div>

			<!-- Quick Links -->
			<div class="space-y-3">
				<h3 class="text-lg font-semibold text-light-50">{$_('footer.quickLinks')}</h3>
				<nav class="flex flex-col gap-2">
					<a href={resolve('/')} class="flex items-center gap-2 text-sm transition-colors hover:text-secondary-400">
						<FontAwesomeIcon icon={faHome} class="text-xs" />
						<span>{$_('home')}</span>
					</a>
					<a
						href={resolve('/houses')}
						class="flex items-center gap-2 text-sm transition-colors hover:text-secondary-400"
					>
						<FontAwesomeIcon icon={faSearch} class="text-xs" />
						<span>{$_('houses.title')}</span>
					</a>
				</nav>
			</div>

			<!-- Contact Info -->
			<div class="space-y-3">
				<h3 class="text-lg font-semibold text-light-50">{$_('footer.contact')}</h3>
				<div class="flex flex-col gap-2">
					<a
						href="mailto:{contactEmail}"
						class="flex items-center gap-2 text-sm transition-colors hover:text-secondary-400"
						aria-label="Email contact"
					>
						<FontAwesomeIcon icon={faEnvelope} class="text-xs" />
						<span>{contactEmail}</span>
					</a>
					<a
						href="tel:{contactPhone.replace(/\s/g, '')}"
						class="flex items-center gap-2 text-sm transition-colors hover:text-secondary-400"
						aria-label="Phone contact"
					>
						<FontAwesomeIcon icon={faPhone} class="text-xs" />
						<span>{contactPhone}</span>
					</a>
					<div class="flex items-center gap-2 text-sm">
						<FontAwesomeIcon icon={faMapMarkerAlt} class="text-xs" />
						<span>{contactAddress}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom Section -->
		<div class="mt-8 border-t border-dark-700 pt-6 dark:border-dark-900">
			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<!-- Copyright -->
				<div class="text-center text-sm md:text-left">
					<p>© {currentYear} {$_('footer.author')}. {$_('footer.allRightsReserved')}</p>
				</div>

				<!-- Language Selector -->
				<div class="flex items-center gap-2">
					<span class="text-sm">{$_('footer.language')}:</span>
					<div class="flex gap-2">
						{#each LANGUAGES as lang (lang.code)}
							<button
								id="footer-lang-{lang.code}"
								onclick={() => changeLanguage(lang.code)}
								class="group relative overflow-hidden rounded transition-all hover:ring-2 hover:ring-secondary-500 dark:hover:ring-secondary-400"
								class:ring-2={$locale === lang.code}
								class:ring-secondary-500={$locale === lang.code}
								class:dark:ring-secondary-400={$locale === lang.code}
								aria-label={lang.name}
							>
								<img src={lang.flag} alt={lang.name} class="h-6 w-8 object-cover" />
							</button>
							<AppTooltip triggeredBy="#footer-lang-{lang.code}" placement="top">
								{lang.name}
							</AppTooltip>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</footer>
