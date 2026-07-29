<script lang="ts">
	/**
	 * One entry of the register, as the workshop sees it.
	 *
	 * The public card is a gallery piece; this one is a ledger line. A contact-sheet
	 * thumbnail identifies the entry, the record states what it is and what it
	 * costs, and the acts sit on the tile's edge where a hand expects them —
	 * no hover menu, nothing folded away.
	 *
	 * Rendered inside an `.azulejo-panel`, so the tile carries no border of its
	 * own: the grout between entries is the panel's.
	 */
	import { _, locale } from 'svelte-i18n';
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faArrowUpRightFromSquare, faEye, faEyeSlash, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
	import type { PropertyDTO } from '$lib/types/property';
	import { formatArea, formatPrice } from '$lib/utils/format';

	interface Props {
		property: PropertyDTO;
		imageIds?: number[];
		onPublish?: (property: PropertyDTO) => void;
		onUnpublish?: (property: PropertyDTO) => void;
		onDelete?: (property: PropertyDTO) => void;
	}

	let { property, imageIds = [], onPublish, onUnpublish, onDelete }: Props = $props();

	const serverUrl = import.meta.env.VITE_SERVER_URL ?? '';
	const editHref = $derived(resolve(`/panel/properties/${property.id}`));

	const place = $derived([property.municipality, property.district].filter(Boolean).join(', '));

	/** One mono line, same shorthand as the public card: T3 · 2 bath · 210 m² */
	const specs = $derived(
		[
			property.bedrooms ? $_('properties.short.typology', { values: { count: property.bedrooms } }) : null,
			property.bathrooms ? $_('properties.short.bathrooms', { values: { count: property.bathrooms } }) : null,
			formatArea(property.areaSqm, $locale),
			property.hasGarage ? $_('properties.short.garage') : null,
			property.hasGarden ? $_('properties.short.garden') : null,
			property.hasPool ? $_('properties.short.pool') : null,
			property.hasElevator ? $_('properties.short.elevator') : null
		].filter(Boolean)
	);

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

	/** The acts, quiet and named. Delete keeps its own colour and nothing else does. */
	const actClass =
		'flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-dark-500 transition-colors hover:bg-primary-50 hover:text-primary-800 dark:text-light-400 dark:hover:bg-primary-950/50 dark:hover:text-primary-200';
	const deleteActClass =
		'flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-error-600 transition-colors hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-error-950/40 dark:hover:text-error-300';
</script>

{#snippet acts()}
	<a href={editHref} class={actClass}>
		<FontAwesomeIcon icon={faPencil} class="w-3.5 text-[0.65rem] opacity-60" />
		{$_('properties.edit')}
	</a>

	{#if property.isPublished}
		{#if onUnpublish}
			<button type="button" onclick={() => onUnpublish(property)} class={actClass}>
				<FontAwesomeIcon icon={faEyeSlash} class="w-3.5 text-[0.65rem] opacity-60" />
				{$_('properties.unpublish')}
			</button>
		{/if}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href="/houses/{property.id}" class={actClass}>
			<FontAwesomeIcon icon={faArrowUpRightFromSquare} class="w-3.5 text-[0.65rem] opacity-60" />
			{$_('properties.viewListing')}
		</a>
	{:else if onPublish}
		<button type="button" onclick={() => onPublish(property)} class={actClass}>
			<FontAwesomeIcon icon={faEye} class="w-3.5 text-[0.65rem] opacity-60" />
			{$_('properties.publish')}
		</button>
	{/if}

	{#if onDelete}
		<button type="button" onclick={() => onDelete(property)} class={deleteActClass}>
			<FontAwesomeIcon icon={faTrash} class="w-3.5 text-[0.65rem] opacity-60" />
			{$_('properties.delete')}
		</button>
	{/if}
{/snippet}

<article id="entry-{property.id}" class="azulejo-cell scroll-mt-24">
	<div
		class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 p-4 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:gap-x-5 sm:p-5"
	>
		<!-- The contact sheet: enough to recognise the entry, no more. The link
		     duplicates the title's, so it stays out of the tab order. -->
		<a
			href={editHref}
			tabindex="-1"
			aria-hidden="true"
			class="relative block aspect-square self-start overflow-hidden bg-light-400 dark:bg-dark-700"
		>
			{#if imageIds.length > 0}
				<img
					src="{serverUrl}/v1/api/images/{imageIds[0]}"
					alt=""
					width="240"
					height="240"
					loading="lazy"
					class="h-full w-full object-cover"
				/>
			{:else}
				<span class="flex h-full items-center justify-center">
					<svg
						viewBox="0 0 96 96"
						class="h-10 w-10 text-primary-300/60 dark:text-primary-800"
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
				</span>
			{/if}

			{#if imageIds.length > 1}
				<span
					aria-hidden="true"
					class="type-record absolute right-0 bottom-0 bg-dark-950/70 px-2 py-1 text-[0.65rem] text-light-100 backdrop-blur-sm"
				>
					{imageIds.length}
				</span>
			{/if}
		</a>

		<!-- The record -->
		<div class="min-w-0">
			<p class="type-label truncate text-primary-700 dark:text-primary-300">
				{$_(`properties.types.${property.propertyType}`)}
				{#if place}
					<span aria-hidden="true" class="mx-1.5 opacity-45">·</span>{place}
				{/if}
			</p>

			<h3 class="mt-1.5 font-display text-lg leading-snug text-dark-900 dark:text-light-50">
				<a
					href={editHref}
					class="line-clamp-2 transition-colors first-letter:uppercase hover:text-primary-700 dark:hover:text-primary-300"
				>
					{property.title || $_('properties.untitled')}
				</a>
			</h3>

			<p class="type-record mt-1.5 text-base text-dark-800 tabular-nums dark:text-light-200">
				{formatPrice(property.price, $locale)}
			</p>

			<!-- The states of the entry: how the sale stands, and whether the tile is
			     fired — published cobalt, or still unglazed in the workshop. -->
			<div class="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
				{#if property.status}
					<span class="type-label flex items-center gap-1.5 text-dark-500 dark:text-light-500">
						<span aria-hidden="true" class="h-1.5 w-1.5 rounded-full {statusDot(property.status)}"></span>
						{$_(`properties.statuses.${property.status}`)}
					</span>
				{/if}

				{#if property.isPublished}
					<span class="type-label flex items-center gap-1.5 text-primary-700 dark:text-primary-300">
						<span aria-hidden="true" class="h-1.5 w-1.5 bg-primary-600 dark:bg-primary-400"></span>
						{$_('properties.published')}
					</span>
				{:else}
					<span class="type-label flex items-center gap-1.5 text-dark-400 dark:text-light-600">
						<span aria-hidden="true" class="h-1.5 w-1.5 border border-dark-400 dark:border-light-600"></span>
						{$_('properties.draft')}
					</span>
				{/if}

				{#if property.viewCount !== undefined}
					<span class="type-record text-xs text-dark-400 dark:text-light-600">
						{property.viewCount}
						{$_('properties.views')}
					</span>
				{/if}
			</div>

			{#if specs.length > 0}
				<p class="type-record mt-2 truncate text-xs text-dark-400 dark:text-light-600">
					{specs.join(' · ')}
				</p>
			{/if}
		</div>

		<!-- The acts, ruled off on the tile's right edge -->
		<div class="azulejo-rule hidden flex-col items-stretch justify-center border-l pl-3 sm:flex">
			{@render acts()}
		</div>
	</div>

	<!-- On a phone the acts run along the tile's bottom edge instead -->
	<div class="azulejo-rule flex flex-wrap justify-end gap-x-1 border-t px-2 py-1.5 sm:hidden">
		{@render acts()}
	</div>
</article>
