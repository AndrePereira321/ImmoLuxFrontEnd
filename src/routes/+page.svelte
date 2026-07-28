<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { PropertyDTO } from '$lib/types/property';
	import { inview } from '$lib/actions/inview';
	import AppHomeHero from '$lib/components/AppHomeHero.svelte';
	import AppAzulejo from '$lib/components/AppAzulejo.svelte';
	import pacaGroupLogo from '$lib/assets/images/paca_group.jpg';
	import homeImage from '$lib/assets/images/home_image.jpeg';

	interface PropertyImageMap {
		[propertyId: number]: number[];
	}

	let { data } = $props();

	let properties = $derived<PropertyDTO[]>(data.featuredProperties);
	let propertyImageMap = $derived<PropertyImageMap>(data.propertyImageMap);

	/** Reasons buyers actually raise, each with the tile that carries it. */
	const tiles = $derived([
		{ motif: 'sol' as const, label: $_('homepage.portugal.solLabel'), body: $_('homepage.portugal.solBody') },
		{
			motif: 'mercado' as const,
			label: $_('homepage.portugal.mercadoLabel'),
			body: $_('homepage.portugal.mercadoBody')
		},
		{ motif: 'mesa' as const, label: $_('homepage.portugal.mesaLabel'), body: $_('homepage.portugal.mesaBody') },
		{
			motif: 'abrigo' as const,
			label: $_('homepage.portugal.abrigoLabel'),
			body: $_('homepage.portugal.abrigoBody')
		}
	]);

	/** The studio's own record: three fields, then the partner it builds with. */
	const facts = $derived([
		{ label: $_('homepage.studio.whereLabel'), value: $_('homepage.studio.whereValue') },
		{ label: $_('homepage.studio.howLabel'), value: $_('homepage.studio.howValue') },
		{ label: $_('homepage.studio.whoLabel'), value: $_('homepage.studio.whoValue') }
	]);
</script>

<svelte:head>
	<title>ImmoLux — {$_('homepage.meta.title')}</title>
	<meta name="description" content={$_('homepage.meta.description')} />
	<meta property="og:title" content="ImmoLux — {$_('homepage.meta.title')}" />
	<meta property="og:description" content={$_('homepage.meta.description')} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://immolux.pt/" />
	<meta property="og:image" content="https://immolux.pt{homeImage}" />
	<meta property="og:image:alt" content="ImmoLux — {$_('homepage.meta.title')}" />
	<meta name="twitter:title" content="ImmoLux — {$_('homepage.meta.title')}" />
	<meta name="twitter:description" content={$_('homepage.meta.description')} />
	<meta name="twitter:image" content="https://immolux.pt{homeImage}" />
	<link rel="canonical" href="https://immolux.pt/" />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"@id": "https://immolux.pt/#website",
			"url": "https://immolux.pt",
			"name": "ImmoLux",
			"publisher": { "@id": "https://immolux.pt/#organization" }
		}
	</script>
	<!-- no-JS fallback: make reveal elements visible -->
	<noscript>
		<style>
			.reveal {
				opacity: 1 !important;
				transform: none !important;
			}
		</style>
	</noscript>
</svelte:head>

<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     THE INVENTORY — words, photograph and record, laid up as three fields
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<AppHomeHero {properties} {propertyImageMap} />

<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     THE STUDIO — three fields of record, then the partner it builds with
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<section class="bg-light-200 dark:bg-dark-850">
	<div class="mx-auto max-w-[84rem] px-5 pt-10 pb-16 sm:px-8 sm:pt-12 sm:pb-20 lg:px-12 lg:pt-14 lg:pb-24" use:inview>
		<div class="reveal reveal-up max-w-[56ch]">
			<p class="type-label text-primary-600 dark:text-primary-300">{$_('homepage.studio.eyebrow')}</p>
			<h2 class="type-display mt-6 text-[clamp(1.9rem,3.5vw,2.9rem)] text-dark-900 dark:text-light-50">
				{$_('homepage.studio.headline')}
			</h2>
			<p class="mt-6 leading-relaxed text-dark-400 dark:text-light-500">{$_('homepage.studio.body')}</p>
		</div>

		<div class="reveal reveal-up reveal-d1 azulejo-panel mt-10 grid-cols-1 sm:grid-cols-3">
			{#each facts as fact (fact.label)}
				<div class="azulejo-cell p-7 sm:p-8">
					<p class="type-label text-primary-700 dark:text-primary-300">{fact.label}</p>
					<span aria-hidden="true" class="azulejo-rule mt-4 block w-10 border-t"></span>
					<p class="mt-4 leading-relaxed text-dark-600 dark:text-light-400">{fact.value}</p>
				</div>
			{/each}
		</div>

		<!-- The partner gets a field of its own, at a size the mark can be read at.
		     -mt-px overlaps the two panel borders so the joint is the same 1px
		     grout line as every other rule in the panel. -->
		<div class="reveal reveal-up reveal-d2 azulejo-panel -mt-px grid-cols-1">
			<div class="azulejo-cell flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:gap-9 sm:p-8">
				<a
					href="https://www.pacaconstruct.be"
					target="_blank"
					rel="noopener noreferrer"
					class="azulejo-rule w-fit shrink-0 border bg-white p-3 transition-colors hover:border-primary-400"
					aria-label="PacaGroup"
				>
					<img src={pacaGroupLogo} alt="PacaGroup" width="150" height="64" loading="lazy" class="h-14 w-auto" />
				</a>
				<div class="min-w-0">
					<p class="type-label text-primary-700 dark:text-primary-300">{$_('homepage.studio.partnerLabel')}</p>
					<p class="mt-3 leading-relaxed text-dark-600 dark:text-light-400">
						{$_('homepage.studio.partnerValue')}
					</p>
					<a
						href="https://www.pacaconstruct.be"
						target="_blank"
						rel="noopener noreferrer"
						translate="no"
						class="type-record mt-3 inline-block text-sm text-primary-700 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-600 hover:decoration-primary-500 dark:text-primary-300 dark:decoration-primary-700 dark:hover:text-primary-200"
					>
						pacaconstruct.be
					</a>
				</div>
			</div>
		</div>

		<p class="type-record mt-8 text-xs text-dark-300 dark:text-light-700">{$_('homepage.studio.facts')}</p>
	</div>
</section>

<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     WHY PORTUGAL — the four tiles, run as a frieze
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<section class="border-t border-light-800/70 bg-light-200 dark:border-dark-700 dark:bg-dark-850">
	<div class="mx-auto max-w-[84rem] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24" use:inview>
		<div class="reveal reveal-up flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
			<div>
				<p class="type-label text-primary-600 dark:text-primary-300">{$_('homepage.portugal.eyebrow')}</p>
				<h2 class="type-display mt-5 max-w-[20ch] text-[clamp(1.75rem,3.2vw,2.6rem)] text-dark-900 dark:text-light-50">
					{$_('homepage.portugal.headline')}
				</h2>
			</div>
		</div>

		<!-- A frieze of four where there is room to lay one, and a run of single
		     tiles where there is not. Two columns at phone width left each caption
		     in an 18-character gutter, seven lines deep and staggered against its
		     neighbour; below sm the mark moves beside its name and the sentence
		     gets the full width of the field. -->
		<div class="reveal reveal-up reveal-d1 azulejo-panel mt-9 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
			{#each tiles as tile (tile.motif)}
				<div class="azulejo-cell grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-4 p-5 sm:block sm:p-0">
					<div class="sm:p-7">
						<div class="mx-auto aspect-square w-full text-primary-700 sm:max-w-[10.5rem] dark:text-primary-300">
							<AppAzulejo motif={tile.motif} />
						</div>
					</div>
					<!-- azulejo-rule carries only the colour; the width arrives at sm, where
					     the caption sits below the mark instead of beside it. -->
					<p class="type-label azulejo-rule text-primary-700 sm:border-t sm:px-6 sm:pt-5 dark:text-primary-300">
						{tile.label}
					</p>
					<p
						class="col-span-2 mt-3 text-sm leading-relaxed text-dark-500 sm:mt-2.5 sm:px-6 sm:pb-6 dark:text-light-500"
					>
						{tile.body}
					</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     CONTACT — a cobalt field to close on, answering the one the page opened with
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<section class="bg-light-200 pb-14 dark:bg-dark-850">
	<div class="mx-auto max-w-[84rem] px-5 sm:px-8 lg:px-12">
		<!-- One tall ink field, and beside it two glazed ones stacked. The row gap
		     is the same grout as everywhere else, so the split reads as masonry
		     rather than as a column that ran short. -->
		<div class="azulejo-panel grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[auto_1fr]">
			<div class="azulejo-cell-ink p-8 sm:p-10 lg:row-span-2 lg:p-12">
				<p class="type-label text-secondary-300">{$_('homepage.contact.eyebrow')}</p>
				<h2 class="type-display mt-6 text-[clamp(1.9rem,3.5vw,2.9rem)] text-light-50">
					{$_('homepage.contact.headline')}
				</h2>
				<p class="mt-6 max-w-[46ch] leading-relaxed text-light-300/80">{$_('homepage.contact.body')}</p>

				<!-- The one champagne field on the page. Set as a plate — label left,
				     address right — so it belongs to the same run of fields as
				     everything else, instead of floating as a button. -->
				<a
					href="mailto:info@immolux.pt"
					class="group mt-9 flex w-full max-w-[30rem] flex-col items-start gap-1.5 bg-secondary-300 px-6 py-4 text-dark-950 transition-colors hover:bg-secondary-200 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
				>
					<span class="type-label shrink-0">{$_('homepage.contact.emailCta')}</span>
					<span class="flex min-w-0 items-center gap-3">
						<span translate="no" class="type-record min-w-0 truncate text-base">info@immolux.pt</span>
						<span aria-hidden="true" class="shrink-0 transition-transform duration-300 group-hover:translate-x-1">
							→
						</span>
					</span>
				</a>
			</div>

			<div class="azulejo-cell p-8 sm:p-10 lg:p-12 lg:py-10">
				<p class="type-label text-primary-700 dark:text-primary-300">{$_('footer.contact')}</p>
				<p class="mt-4">
					<a
						href="tel:+351913160232"
						translate="no"
						class="type-record text-base text-dark-800 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-700 hover:decoration-primary-500 dark:text-light-200 dark:decoration-primary-700 dark:hover:text-primary-300"
					>
						+351 913 160 232
					</a>
				</p>
				<p translate="no" class="type-record mt-2 text-sm text-dark-400 dark:text-light-600">Lousada, Portugal</p>
			</div>

			<div class="azulejo-cell flex flex-col justify-center p-8 sm:p-10 lg:p-12 lg:py-10">
				<p class="type-label text-primary-700 dark:text-primary-300">{$_('homepage.contact.ownersLabel')}</p>
				<p class="mt-4 max-w-[38ch] leading-relaxed text-dark-600 dark:text-light-400">
					{$_('homepage.contact.ownersBody')}
				</p>
				<!-- A link, not a second plate: this is the quieter of the two invitations. -->
				<a
					href="mailto:info@immolux.pt?subject=Im%C3%B3vel"
					class="group mt-6 inline-flex w-fit items-center gap-2.5 text-sm font-medium text-primary-700 transition-colors hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-200"
				>
					<span class="underline decoration-primary-300 underline-offset-[6px] dark:decoration-primary-700">
						{$_('homepage.contact.ownersCta')}
					</span>
					<span aria-hidden="true" class="transition-transform duration-300 group-hover:translate-x-1">→</span>
				</a>
			</div>
		</div>
	</div>
</section>
