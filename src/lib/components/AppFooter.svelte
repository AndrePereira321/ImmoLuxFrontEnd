<script lang="ts">
	import { resolve } from '$app/paths';
	import { _, locale } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEnvelope, faHome, faMapMarkerAlt, faPhone, faSearch } from '@fortawesome/free-solid-svg-icons';
	import { LANGUAGES } from '$lib/constants/languages';
	import { changeLanguage } from '$lib/utils/language';
	import AppTooltip from '$lib/components/AppTooltip.svelte';
	import pacaGroupLogo from '$lib/assets/images/paca_group.jpg';
	import immoLuxLogo from '$lib/assets/images/logo_transparent_white.png';

	const currentYear = new Date().getFullYear();
	const contactEmail = 'info@immolux.pt';
	const contactPhone = '+351 913 160 232';
	const contactAddress = 'Lousada, Portugal';
</script>

<footer class="border-t border-dark-700/30 bg-dark-900 text-light-400 dark:border-dark-800 dark:bg-dark-950">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
			<!-- Company Info -->
			<div class="space-y-4">
				<a href={resolve('/')} class="mb-2 inline-block transition-opacity hover:opacity-80">
					<img src={immoLuxLogo} alt="ImmoLux" class="h-10 w-auto" />
				</a>
				<h3
					class="text-sm font-semibold tracking-wider text-light-200 uppercase"
					style="font-family: 'Plus Jakarta Sans', sans-serif"
				>
					{$_('footer.about')}
				</h3>
				<p class="text-sm leading-relaxed text-light-600">
					{$_('footer.aboutDescription')}
				</p>
			</div>

			<!-- Partners -->
			<div class="space-y-4">
				<h3
					class="text-sm font-semibold tracking-wider text-light-200 uppercase"
					style="font-family: 'Plus Jakarta Sans', sans-serif"
				>
					{$_('footer.partners')}
				</h3>
				<div class="flex items-start">
					<a
						href="http://www.pacaconstruct.be"
						target="_blank"
						rel="noopener noreferrer"
						class="group block transition-all hover:scale-105"
						aria-label="Paca Group - Partner"
					>
						<img
							src={pacaGroupLogo}
							alt="Paca Group"
							class="h-14 w-auto rounded-lg bg-white p-1.5 shadow-md transition-shadow group-hover:shadow-lg"
						/>
					</a>
				</div>
			</div>

			<!-- Quick Links -->
			<div class="space-y-4">
				<h3
					class="text-sm font-semibold tracking-wider text-light-200 uppercase"
					style="font-family: 'Plus Jakarta Sans', sans-serif"
				>
					{$_('footer.quickLinks')}
				</h3>
				<nav class="flex flex-col gap-2.5">
					<a
						href={resolve('/')}
						class="flex items-center gap-2.5 text-sm text-light-600 transition-colors hover:text-secondary-400"
					>
						<FontAwesomeIcon icon={faHome} class="w-3 text-xs text-light-800" />
						<span>{$_('home')}</span>
					</a>
					<a
						href={resolve('/houses')}
						class="flex items-center gap-2.5 text-sm text-light-600 transition-colors hover:text-secondary-400"
					>
						<FontAwesomeIcon icon={faSearch} class="w-3 text-xs text-light-800" />
						<span>{$_('houses.title')}</span>
					</a>
				</nav>
			</div>

			<!-- Contact Info -->
			<div class="space-y-4">
				<h3
					class="text-sm font-semibold tracking-wider text-light-200 uppercase"
					style="font-family: 'Plus Jakarta Sans', sans-serif"
				>
					{$_('footer.contact')}
				</h3>
				<div class="flex flex-col gap-2.5">
					<a
						href="mailto:{contactEmail}"
						class="flex items-center gap-2.5 text-sm text-light-600 transition-colors hover:text-secondary-400"
						aria-label="Email contact"
					>
						<FontAwesomeIcon icon={faEnvelope} class="w-3 text-xs text-light-800" />
						<span>{contactEmail}</span>
					</a>
					<a
						href="tel:{contactPhone.replace(/\s/g, '')}"
						class="flex items-center gap-2.5 text-sm text-light-600 transition-colors hover:text-secondary-400"
						aria-label="Phone contact"
					>
						<FontAwesomeIcon icon={faPhone} class="w-3 text-xs text-light-800" />
						<span>{contactPhone}</span>
					</a>
					<div class="flex items-center gap-2.5 text-sm text-light-600">
						<FontAwesomeIcon icon={faMapMarkerAlt} class="w-3 text-xs text-light-800" />
						<span>{contactAddress}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom Section -->
		<div class="mt-10 border-t border-dark-700/40 pt-8 dark:border-dark-800/60">
			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<!-- Copyright -->
				<div class="text-center text-xs text-light-700 md:text-left">
					<p>&copy; {currentYear} {$_('footer.author')}. {$_('footer.allRightsReserved')}</p>
				</div>

				<!-- Language Selector -->
				<div class="flex items-center gap-3">
					<span class="text-xs text-light-700">{$_('footer.language')}:</span>
					<div class="flex gap-1.5">
						{#each LANGUAGES as lang (lang.code)}
							<button
								id="footer-lang-{lang.code}"
								onclick={() => changeLanguage(lang.code)}
								class="group relative overflow-hidden rounded-sm transition-all hover:ring-2 hover:ring-secondary-500/60 {$locale ===
								lang.code
									? 'ring-2 ring-secondary-400'
									: 'opacity-60 hover:opacity-100'}"
								aria-label={lang.name}
							>
								<img src={lang.flag} alt={lang.name} class="h-5 w-7 object-cover" />
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
