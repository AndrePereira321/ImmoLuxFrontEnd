<script lang="ts">
	/**
	 * A property in the listing grid, set as a catalogue entry.
	 *
	 * The card carries no controls of its own: every caller wraps it in a link to
	 * the property, and buttons nested inside a link are invalid markup that
	 * keyboard users cannot reach. The gallery lives on the detail page, where
	 * there is room for it.
	 */
	import { _, locale } from 'svelte-i18n';
	import type { PropertyDTO } from '$lib/types/property';
	import { formatArea, formatPrice } from '$lib/utils/format';

	interface Props {
		property: PropertyDTO;
		imageIds?: number[];
	}

	let { property, imageIds = [] }: Props = $props();

	const serverUrl = import.meta.env.VITE_SERVER_URL ?? '';

	const place = $derived([property.parish ?? property.municipality, property.district].filter(Boolean).join(', '));

	/** One mono line instead of a cluster of pills: T3 · 2 WC · 210 m² · Garagem */
	const specs = $derived(
		[
			property.bedrooms ? $_('properties.short.typology', { values: { count: property.bedrooms } }) : null,
			property.bathrooms ? $_('properties.short.bathrooms', { values: { count: property.bathrooms } }) : null,
			formatArea(property.areaSqm, $locale),
			property.landAreaSqm
				? $_('properties.short.land', { values: { value: formatArea(property.landAreaSqm, $locale) } })
				: null,
			property.hasGarage ? $_('properties.short.garage') : null,
			property.hasGarden ? $_('properties.short.garden') : null,
			property.hasPool ? $_('properties.short.pool') : null,
			property.hasElevator ? $_('properties.short.elevator') : null
		].filter(Boolean)
	);

	/**
	 * Status rides on a near-opaque ink plate so it stays legible over any
	 * photograph; the colour is carried by a dot rather than by the background,
	 * which no status palette can guarantee enough contrast for.
	 */
	const statusDot = (status?: string): string => {
		switch (status) {
			case 'available':
				return 'bg-success-500';
			case 'pending':
				return 'bg-warning-400';
			case 'sold':
				return 'bg-error-500';
			case 'rented':
				return 'bg-info-400';
			default:
				return 'bg-light-600';
		}
	};
</script>

<article
	class="flex h-full flex-col border border-light-800/70 bg-white transition-colors duration-300 group-hover:border-primary-400 dark:border-dark-700 dark:bg-dark-800 dark:group-hover:border-primary-600"
>
	<div class="relative aspect-[4/3] w-full overflow-hidden bg-light-400 dark:bg-dark-700">
		{#if imageIds.length > 0}
			<img
				src="{serverUrl}/v1/api/images/{imageIds[0]}"
				alt={property.title ?? ''}
				width="800"
				height="600"
				loading="lazy"
				class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
			/>
		{:else}
			<!-- Empty state: the tile grid stands in for the missing photograph -->
			<div class="flex h-full items-center justify-center">
				<svg
					viewBox="0 0 96 96"
					class="h-16 w-16 text-primary-300/60 dark:text-primary-800"
					fill="none"
					stroke="currentColor"
					stroke-width="1.3"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<path d="M17 52 L48 25 L79 52" />
					<path d="M28 52 L48 34 L68 52" />
					<path d="M36 79 L36 67 A12 12 0 0 1 60 67 L60 79" />
					<path d="M26 79 L70 79" />
				</svg>
			</div>
		{/if}

		{#if property.status}
			<span
				class="type-label absolute top-0 left-0 flex items-center gap-2 bg-dark-950/90 px-3 py-2 text-light-50 backdrop-blur-sm"
			>
				<span aria-hidden="true" class="h-1.5 w-1.5 rounded-full {statusDot(property.status)}"></span>
				{$_(`properties.statuses.${property.status}`)}
			</span>
		{/if}

		{#if imageIds.length > 1}
			<!-- Photo count: decorative for assistive tech — a bare figure carries
			     no meaning read out of context inside the card link. -->
			<span
				aria-hidden="true"
				class="type-record absolute right-0 bottom-0 bg-dark-950/70 px-2.5 py-1.5 text-xs text-light-100 backdrop-blur-sm"
			>
				{imageIds.length}
			</span>
		{/if}
	</div>

	<div class="flex flex-1 flex-col p-5">
		<p class="type-label min-w-0 truncate text-primary-700 dark:text-primary-300">
			{$_(`properties.types.${property.propertyType}`)}
			{#if place}
				<span aria-hidden="true" class="mx-1.5 opacity-45">·</span>{place}
			{/if}
		</p>

		<h3 class="mt-2.5 line-clamp-2 font-display text-lg leading-snug text-dark-900 dark:text-light-50">
			{property.title ?? $_('properties.untitled')}
		</h3>

		<p class="type-display mt-3 text-2xl text-primary-700 tabular-nums dark:text-primary-300">
			{formatPrice(property.price, $locale)}
		</p>

		{#if specs.length > 0}
			<p
				class="type-record mt-auto border-t border-light-800/60 pt-4 text-xs leading-relaxed text-dark-400 dark:border-dark-700 dark:text-light-600"
			>
				{specs.join(' · ')}
			</p>
		{/if}
	</div>
</article>
