<script lang="ts">
	/**
	 * The footer closes on the same cobalt ground the page opened with.
	 *
	 * Every column starts its heading on one baseline; the brand column carries
	 * no heading at all, so the mark can sit where the labels do rather than
	 * pushing its own column out of alignment.
	 */
	import { resolve } from '$app/paths';
	import { _, locale } from 'svelte-i18n';
	import { LANGUAGES } from '$lib/constants/languages';
	import { changeLanguage } from '$lib/utils/language';
	import pacaGroupLogo from '$lib/assets/images/paca_group.jpg';
	import immoLuxLogo from '$lib/assets/images/logo_transparent_white.png';

	const currentYear = new Date().getFullYear();
	const contactEmail = 'info@immolux.pt';
	const contactPhone = '+351 913 160 232';
	const contactAddress = 'Lousada, Portugal';

	const linkClass =
		'text-sm text-light-400/80 transition-colors hover:text-secondary-300 focus-visible:text-secondary-300';
</script>

<footer class="bg-primary-950 text-light-400">
	<div class="mx-auto max-w-[84rem] px-5 sm:px-8 lg:px-12">
		<!-- Columns. items-start keeps every heading on the same baseline. -->
		<div class="grid items-start gap-x-10 gap-y-12 py-16 sm:grid-cols-2 lg:grid-cols-12 lg:py-20">
			<div class="lg:col-span-4">
				<a href={resolve('/')} class="inline-block transition-opacity hover:opacity-80">
					<img src={immoLuxLogo} alt="ImmoLux" width="200" height="210" class="h-16 w-auto" />
				</a>
				<p class="mt-6 max-w-[34ch] text-sm leading-relaxed text-light-500/70">
					{$_('footer.aboutDescription')}
				</p>
			</div>

			<nav class="lg:col-span-2 lg:col-start-6" aria-label={$_('footer.quickLinks')}>
				<h2 class="type-label text-secondary-400">{$_('footer.browse')}</h2>
				<ul class="mt-5 flex flex-col gap-3">
					<li><a href={resolve('/')} class={linkClass}>{$_('home')}</a></li>
					<li><a href={resolve('/houses')} class={linkClass}>{$_('houses.title')}</a></li>
				</ul>
			</nav>

			<div class="lg:col-span-3">
				<h2 class="type-label text-secondary-400">{$_('footer.contact')}</h2>
				<ul class="mt-5 flex flex-col gap-3">
					<li>
						<a href="mailto:{contactEmail}" translate="no" class={linkClass}>{contactEmail}</a>
					</li>
					<li>
						<a href="tel:{contactPhone.replace(/\s/g, '')}" translate="no" class={linkClass}>{contactPhone}</a>
					</li>
					<li><span translate="no" class="text-sm text-light-500/70">{contactAddress}</span></li>
				</ul>
			</div>

			<div class="lg:col-span-2">
				<h2 class="type-label text-secondary-400">{$_('footer.language')}</h2>
				<ul class="mt-5 flex flex-wrap gap-2">
					{#each LANGUAGES as lang (lang.code)}
						<li>
							<button
								type="button"
								onclick={() => changeLanguage(lang.code)}
								aria-current={$locale === lang.code ? 'true' : undefined}
								class="type-record border px-3 py-1.5 text-xs uppercase transition-colors {$locale === lang.code
									? 'border-secondary-400 text-secondary-300'
									: 'border-light-50/20 text-light-500/70 hover:border-light-50/50 hover:text-light-200'}"
							>
								<span class="sr-only">{lang.name}</span>
								<span aria-hidden="true">{lang.code}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- The partner, credited at a size its mark can be read at -->
		<div class="flex flex-col gap-5 border-t border-light-50/12 py-8 sm:flex-row sm:items-center sm:gap-8">
			<a
				href="https://www.pacaconstruct.be"
				target="_blank"
				rel="noopener noreferrer"
				class="w-fit shrink-0 border border-light-50/20 bg-white p-2.5 transition-colors hover:border-secondary-400"
				aria-label="PacaGroup"
			>
				<img src={pacaGroupLogo} alt="PacaGroup" width="120" height="52" loading="lazy" class="h-11 w-auto" />
			</a>
			<div class="min-w-0">
				<p class="type-label text-secondary-400">{$_('footer.partnerRole')}</p>
				<a
					href="https://www.pacaconstruct.be"
					target="_blank"
					rel="noopener noreferrer"
					translate="no"
					class="type-record mt-2 inline-block text-sm text-light-300 underline decoration-light-50/25 underline-offset-4 transition-colors hover:text-secondary-300 hover:decoration-secondary-400"
				>
					pacaconstruct.be
				</a>
			</div>
		</div>

		<div class="border-t border-light-50/12 py-7">
			<p class="type-record text-xs text-light-600/60">
				&copy; {currentYear}
				{$_('footer.author')}. {$_('footer.allRightsReserved')}
			</p>
		</div>
	</div>
</footer>
