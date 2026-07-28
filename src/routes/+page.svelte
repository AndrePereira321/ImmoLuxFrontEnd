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

		<div class="reveal reveal-up reveal-d1 azulejo-panel mt-9 grid-cols-2 lg:grid-cols-4">
			{#each tiles as tile (tile.motif)}
				<div class="azulejo-cell flex flex-col">
					<div class="p-5 sm:p-7">
						<div class="mx-auto aspect-square w-full max-w-[10.5rem] text-primary-700 dark:text-primary-300">
							<AppAzulejo motif={tile.motif} />
						</div>
					</div>
					<!-- No mt-auto: the captions differ in length, and pushing each to its
					     own cell's floor would stagger the grout rules across the frieze. -->
					<div class="azulejo-rule border-t p-5 sm:p-6">
						<p class="type-label text-primary-700 dark:text-primary-300">{tile.label}</p>
						<p class="mt-2.5 text-sm leading-relaxed text-dark-500 dark:text-light-500">{tile.body}</p>
					</div>
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
		<div class="azulejo-panel grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
			<div class="azulejo-cell-ink p-8 sm:p-10 lg:p-12">
				<p class="type-label text-secondary-400">{$_('homepage.contact.eyebrow')}</p>
				<h2 class="type-display mt-6 text-[clamp(1.9rem,3.5vw,2.9rem)] text-light-50">
					{$_('homepage.contact.headline')}
				</h2>
				<p class="mt-6 max-w-[46ch] leading-relaxed text-light-300/80">{$_('homepage.contact.body')}</p>

				<!-- The one place the champagne runs at full strength on the whole page.
				     One label inside the button, not two competing for it. -->
				<a
					href="mailto:info@immolux.pt"
					translate="no"
					class="group mt-9 inline-flex w-fit max-w-full items-center gap-4 bg-secondary-400 px-7 py-4 text-dark-950 transition-colors hover:bg-secondary-300"
				>
					<span class="type-record min-w-0 truncate text-base sm:text-lg">info@immolux.pt</span>
					<span aria-hidden="true" class="shrink-0 transition-transform duration-300 group-hover:translate-x-1">→</span>
				</a>

				<p class="type-record mt-7 text-sm text-light-400/75">
					<a
						href="tel:+351913160232"
						translate="no"
						class="underline decoration-light-50/25 underline-offset-4 transition-colors hover:text-secondary-300 hover:decoration-secondary-400"
					>
						+351 913 160 232
					</a>
					<span aria-hidden="true" class="mx-2.5 opacity-40">·</span>
					<span translate="no">Lousada, Portugal</span>
				</p>
			</div>

			<!-- justify-center, not justify-between: pinning the action to the cell
			     floor left a stranded gap whenever this text ran short. -->
			<div class="azulejo-cell flex flex-col justify-center p-8 sm:p-10 lg:p-12">
				<p class="type-label text-primary-700 dark:text-primary-300">{$_('homepage.contact.ownersLabel')}</p>
				<span aria-hidden="true" class="azulejo-rule mt-4 block w-10 border-t"></span>
				<p class="mt-4 max-w-[38ch] leading-relaxed text-dark-600 dark:text-light-400">
					{$_('homepage.contact.ownersBody')}
				</p>
				<!-- A link, not a second button: two bordered buttons in one panel
				     compete, and this is the quieter of the two invitations. -->
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
