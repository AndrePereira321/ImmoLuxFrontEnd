<script lang="ts">
	/**
	 * A centred introduction, then the inventory directly beneath it.
	 *
	 * The shape the site opened with, rebuilt: the mark, the statement and the
	 * lead on the lime-washed ground, with no photograph behind the type and no
	 * gradient wash under it. The properties follow in the same block, at full
	 * size, rather than shrunk into the margins of the introduction.
	 */
	import { _, locale } from 'svelte-i18n';
	import { resolve } from '$app/paths';
	import type { PropertyDTO } from '$lib/types/property';
	import { formatArea, formatLotNumber, formatPrice } from '$lib/utils/format';
	import immoLuxLogo from '$lib/assets/images/logo_transparent_white.png';
	import immoLuxLogoDark from '$lib/assets/images/logo_transparent_dark.png';
	import fallbackImage from '$lib/assets/images/home_image.jpeg';

	interface Props {
		properties: PropertyDTO[];
		propertyImageMap: Record<number, number[]>;
	}

	let { properties, propertyImageMap }: Props = $props();

	const serverUrl = import.meta.env.VITE_SERVER_URL ?? '';

	const hasProperties = $derived(properties.length > 0);
	const single = $derived(properties.length === 1);

	/** Only as many columns as there are properties, so no cell is left bare. */
	const columnsClass = $derived(
		properties.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
	);

	const imageFor = (property: PropertyDTO): string => {
		const ids = property.id ? (propertyImageMap[property.id] ?? []) : [];
		return ids.length > 0 ? `${serverUrl}/v1/api/images/${ids[0]}` : fallbackImage;
	};

	/** "Cristelos, Lousada" — the two place names a buyer actually recognises. */
	const placeOf = (property: PropertyDTO): string =>
		[property.parish ?? property.municipality, property.district].filter(Boolean).join(', ');

	/** "T3 · 210 m²" — only the fields this property actually has. */
	const specsOf = (property: PropertyDTO): string =>
		[
			property.bedrooms ? $_('properties.short.typology', { values: { count: property.bedrooms } }) : null,
			formatArea(property.areaSqm, $locale)
		]
			.filter(Boolean)
			.join(' · ');
</script>

<!-- Sized so the introduction and the inventory share one screen on desktop.
     svh, not vh, so a mobile browser's collapsing toolbar cannot clip the CTA. -->
<section class="flex flex-col bg-light-200 lg:min-h-[calc(100svh-65px)] dark:bg-dark-850">
	<div
		class="mx-auto flex w-full max-w-[84rem] flex-col justify-center px-5 py-10 sm:px-8 sm:py-12 lg:flex-1 lg:px-12 lg:py-9"
	>
		<header class="hero-rise mx-auto max-w-3xl text-center">
			<img
				src={immoLuxLogoDark}
				alt="ImmoLux"
				width="320"
				height="336"
				class="mx-auto h-14 w-auto sm:h-16 dark:hidden"
			/>
			<img
				src={immoLuxLogo}
				alt="ImmoLux"
				width="320"
				height="336"
				class="mx-auto hidden h-14 w-auto sm:h-16 dark:block"
			/>

			<p class="type-label mt-6 text-primary-600 dark:text-primary-300">{$_('homepage.hero.eyebrow')}</p>

			<h1 class="type-display mt-4 text-[clamp(1.9rem,3.6vw,3rem)] text-dark-900 dark:text-light-50">
				{$_('homepage.hero.headline')}
			</h1>

			<p class="mx-auto mt-5 max-w-[52ch] leading-relaxed text-dark-400 dark:text-light-500">
				<!-- The full lead ends on "these are the ones for sale now", which would
				     contradict the field below when nothing is listed. -->
				{hasProperties ? $_('homepage.hero.lead') : $_('homepage.hero.leadEmpty')}
			</p>
		</header>

		{#snippet record(property: PropertyDTO, index: number)}
			<p class="type-label min-w-0 truncate text-primary-700 dark:text-primary-300">
				<span class="text-secondary-900 dark:text-secondary-400">{formatLotNumber(index)}</span>
				<span aria-hidden="true" class="mx-2 opacity-45">—</span>
				{$_(`properties.types.${property.propertyType}`)}
				{#if placeOf(property)}
					<span aria-hidden="true" class="mx-2 opacity-45">·</span>{placeOf(property)}
				{/if}
			</p>

			<p class="type-display mt-3.5 text-[clamp(1.5rem,2.2vw,1.95rem)] text-dark-900 dark:text-light-50">
				{formatPrice(property.price, $locale)}
			</p>

			{#if specsOf(property)}
				<p class="type-record mt-2 text-sm text-dark-400 dark:text-light-600">{specsOf(property)}</p>
			{/if}

			<span
				class="mt-5 inline-flex items-center gap-2 pt-1 text-sm font-medium text-primary-700 transition-colors group-hover:text-primary-600 dark:text-primary-300 dark:group-hover:text-primary-200"
			>
				<span class="underline decoration-primary-300 underline-offset-[6px] dark:decoration-primary-700">
					{$_('homepage.hero.viewProperty')}
				</span>
				<span aria-hidden="true" class="transition-transform duration-300 group-hover:translate-x-1">→</span>
			</span>
		{/snippet}

		<div class="hero-rise mt-8 sm:mt-10" style="animation-delay: 140ms">
			{#if single}
				<!-- A lone property gets a wide two-field panel. Running it through the
				     three-up grid would leave two empty cells showing bare grout. -->
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a
					href="/houses/{properties[0].id}"
					class="azulejo-panel group grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
				>
					<div class="azulejo-cell-image relative min-h-[15rem] lg:min-h-[21rem]">
						<img
							src={imageFor(properties[0])}
							alt={properties[0].title ?? ''}
							width="1280"
							height="960"
							fetchpriority="high"
							class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
						/>
					</div>
					<div class="azulejo-cell flex flex-col justify-center p-8 sm:p-10">
						{@render record(properties[0], 0)}
					</div>
				</a>
			{:else if hasProperties}
				<div class="azulejo-panel {columnsClass}">
					{#each properties as property, index (property.id)}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href="/houses/{property.id}" class="azulejo-cell group flex flex-col">
							<div class="azulejo-cell-image relative aspect-[3/2] w-full">
								<img
									src={imageFor(property)}
									alt={property.title ?? ''}
									width="960"
									height="720"
									fetchpriority={index === 0 ? 'high' : 'low'}
									loading="eager"
									class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
								/>
							</div>

							<div class="azulejo-rule flex flex-1 flex-col border-t p-5 sm:p-6">
								{@render record(property, index)}
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="azulejo-panel grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
					<div class="azulejo-cell-image relative min-h-[15rem] lg:min-h-[20rem]">
						<img
							src={fallbackImage}
							alt=""
							width="1280"
							height="960"
							fetchpriority="high"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
					<div class="azulejo-cell flex flex-col justify-center p-8 sm:p-10">
						<p class="type-label text-secondary-900 dark:text-secondary-400">
							{$_('homepage.hero.comingSoonTitle')}
						</p>
						<p class="mt-4 max-w-[46ch] leading-relaxed text-dark-500 dark:text-light-500">
							{$_('homepage.hero.comingSoonBody')}
						</p>
					</div>
				</div>
			{/if}
		</div>

		<div class="mt-8 flex justify-center">
			<a
				href={resolve('/houses')}
				class="group inline-flex items-center gap-3 border border-primary-700 px-7 py-3.5 text-sm font-medium tracking-wide text-primary-700 transition-colors hover:bg-primary-700 hover:text-light-50 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-600 dark:hover:text-light-50"
			>
				{$_('homepage.hero.viewAll')}
				<span aria-hidden="true" class="transition-transform duration-300 group-hover:translate-x-1">→</span>
			</a>
		</div>
	</div>
</section>
