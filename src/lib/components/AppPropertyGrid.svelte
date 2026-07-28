<!-- ImmoLuxFrontEnd/src/lib/components/AppPropertyGrid.svelte -->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faChevronLeft, faChevronRight, faHome } from '@fortawesome/free-solid-svg-icons';
	import AppPublicPropertyCard from '$lib/components/AppPublicPropertyCard.svelte';
	import type { PropertyDTO } from '$lib/types/property';

	interface Props {
		properties: PropertyDTO[];
		propertyImageMap: Record<number, number[]>;
		total: number;
		limit: number;
		offset: number;
		loading: boolean;
		onPageChange?: (newOffset: number) => void;
		/**
		 * Renders the pager as links instead of buttons. Callers that keep their
		 * paging in the URL pass this so a page can be bookmarked, opened in a new
		 * tab and reached by the back button; the rest keep the callback.
		 */
		pageHref?: (newOffset: number) => string;
		emptyMessage?: string;
		emptyLinkHref?: string;
		emptyLinkLabel?: string;
		/** Replaces the built-in empty panel, for callers that can offer a way out. */
		empty?: import('svelte').Snippet;
	}

	let {
		properties,
		propertyImageMap,
		total,
		limit,
		offset,
		loading,
		onPageChange,
		pageHref,
		emptyMessage,
		emptyLinkHref,
		emptyLinkLabel,
		empty
	}: Props = $props();

	const currentPage = $derived(Math.floor(offset / limit) + 1);
	const totalPages = $derived(Math.ceil(total / limit));
	const hasNextPage = $derived(currentPage < totalPages);
	const hasPrevPage = $derived(currentPage > 1);

	const goToPage = (page: number) => {
		onPageChange?.((page - 1) * limit);
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
	};

	/** The pages worth drawing: the ends, and a window around where you are. */
	const visiblePages = $derived(
		Array.from({ length: totalPages }, (_, index) => index + 1).filter(
			(page) => page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)
		)
	);

	/** The same glaze and grout as the tiles above it, so the pager belongs to them. */
	const pageButtonClass = (page: number): string =>
		page === currentPage
			? 'border-primary-700 bg-primary-700 text-light-50 dark:border-primary-500 dark:bg-primary-600'
			: 'azulejo-cell azulejo-rule text-dark-600 hover:border-primary-400 hover:text-primary-700 dark:text-light-300 dark:hover:border-primary-600 dark:hover:text-primary-300';

	const stepClass =
		'azulejo-cell azulejo-rule flex h-9 w-9 items-center justify-center border text-dark-600 transition-colors hover:border-primary-400 hover:text-primary-700 dark:text-light-300 dark:hover:border-primary-600 dark:hover:text-primary-300';
</script>

<div class="min-w-0">
	{#if loading}
		<div class="flex min-h-[50vh] items-center justify-center">
			<div class="text-center">
				<div class="relative mx-auto mb-4 h-10 w-10">
					<div class="absolute inset-0 rounded-full border-2 border-light-300 dark:border-dark-700"></div>
					<div
						class="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary-600 dark:border-t-primary-400"
						style="animation-duration: 0.75s"
					></div>
				</div>
				<p class="text-sm text-dark-400 dark:text-light-600">{$_('houses.loading')}</p>
			</div>
		</div>
	{:else if properties.length === 0}
		{#if empty}
			{@render empty()}
		{:else}
			<div
				class="flex min-h-[50vh] items-center justify-center border border-dashed border-light-800 dark:border-dark-700"
			>
				<div class="px-8 py-16 text-center">
					<div
						class="mx-auto mb-6 flex h-20 w-20 items-center justify-center border border-light-800 bg-light-100 dark:border-dark-700 dark:bg-dark-800"
					>
						<FontAwesomeIcon icon={faHome} class="text-3xl text-primary-300/60 dark:text-primary-800" />
					</div>
					<h2 class="mb-2 font-display text-xl font-normal text-dark-800 dark:text-light-100">
						{emptyMessage ?? $_('houses.noProperties')}
					</h2>
					{#if emptyLinkHref && emptyLinkLabel}
						<a
							href={emptyLinkHref}
							class="mt-5 inline-block bg-primary-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
						>
							{emptyLinkLabel}
						</a>
					{/if}
				</div>
			</div>
		{/if}
	{:else}
		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
			{#each properties as property, i (property.id)}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href="/houses/{property.id}" class="anim-fade-in-up group block" style="animation-delay: {i * 0.05}s">
					<AppPublicPropertyCard {property} imageIds={propertyImageMap[property.id ?? 0] || []} />
				</a>
			{/each}
		</div>

		{#if totalPages > 1}
			<nav class="mt-14 flex flex-col items-center gap-3" aria-label={$_('houses.pagination')}>
				<div class="flex items-center gap-1.5">
					{#if pageHref}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href={hasPrevPage ? pageHref((currentPage - 2) * limit) : undefined}
							aria-disabled={!hasPrevPage}
							aria-label={$_('houses.prevPage')}
							class="{stepClass} {hasPrevPage ? '' : 'pointer-events-none opacity-30'}"
						>
							<FontAwesomeIcon icon={faChevronLeft} class="text-xs" />
						</a>
					{:else}
						<button
							type="button"
							onclick={() => goToPage(currentPage - 1)}
							disabled={!hasPrevPage}
							aria-label={$_('houses.prevPage')}
							class="{stepClass} disabled:cursor-not-allowed disabled:opacity-30"
						>
							<FontAwesomeIcon icon={faChevronLeft} class="text-xs" />
						</button>
					{/if}

					{#each visiblePages as page, index (page)}
						{#if index > 0 && page - visiblePages[index - 1] > 1}
							<span
								aria-hidden="true"
								class="flex h-9 w-9 items-center justify-center text-sm text-dark-400 dark:text-light-600"
							>
								…
							</span>
						{/if}
						{#if pageHref}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href={pageHref((page - 1) * limit)}
								aria-current={page === currentPage ? 'page' : undefined}
								class="type-record flex h-9 w-9 items-center justify-center border text-sm transition-colors {pageButtonClass(
									page
								)}"
							>
								{page}
							</a>
						{:else}
							<button
								type="button"
								onclick={() => goToPage(page)}
								aria-current={page === currentPage ? 'page' : undefined}
								class="type-record flex h-9 w-9 items-center justify-center border text-sm transition-colors {pageButtonClass(
									page
								)}"
							>
								{page}
							</button>
						{/if}
					{/each}

					{#if pageHref}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href={hasNextPage ? pageHref(currentPage * limit) : undefined}
							aria-disabled={!hasNextPage}
							aria-label={$_('houses.nextPage')}
							class="{stepClass} {hasNextPage ? '' : 'pointer-events-none opacity-30'}"
						>
							<FontAwesomeIcon icon={faChevronRight} class="text-xs" />
						</a>
					{:else}
						<button
							type="button"
							onclick={() => goToPage(currentPage + 1)}
							disabled={!hasNextPage}
							aria-label={$_('houses.nextPage')}
							class="{stepClass} disabled:cursor-not-allowed disabled:opacity-30"
						>
							<FontAwesomeIcon icon={faChevronRight} class="text-xs" />
						</button>
					{/if}
				</div>

				<p class="type-record text-xs text-dark-400 dark:text-light-600">
					{$_('houses.pageInfo', { values: { current: currentPage, total: totalPages } })}
				</p>
			</nav>
		{/if}
	{/if}
</div>
