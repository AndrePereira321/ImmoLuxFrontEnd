<!-- ImmoLuxFrontEnd/src/lib/components/AppPropertyGrid.svelte -->
<script lang="ts">
    import { _ } from 'svelte-i18n';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import {
        faChevronLeft,
        faChevronRight,
        faHome
    } from '@fortawesome/free-solid-svg-icons';
    import AppPublicPropertyCard from '$lib/components/AppPublicPropertyCard.svelte';
    import type { PropertyDTO } from '$lib/types/property';

    interface Props {
        properties: PropertyDTO[];
        propertyImageMap: Record<number, number[]>;
        total: number;
        limit: number;
        offset: number;
        loading: boolean;
        onPageChange: (newOffset: number) => void;
        emptyMessage?: string;
        emptyLinkHref?: string;
        emptyLinkLabel?: string;
    }

    let {
        properties,
        propertyImageMap,
        total,
        limit,
        offset,
        loading,
        onPageChange,
        emptyMessage,
        emptyLinkHref,
        emptyLinkLabel
    }: Props = $props();

    const currentPage = $derived(Math.floor(offset / limit) + 1);
    const totalPages = $derived(Math.ceil(total / limit));
    const hasNextPage = $derived(currentPage < totalPages);
    const hasPrevPage = $derived(currentPage > 1);

    const goToPage = (page: number) => {
        onPageChange((page - 1) * limit);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
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
        <div
            class="flex min-h-[50vh] items-center justify-center rounded-2xl border border-dashed border-light-300/80 dark:border-dark-700/60"
        >
            <div class="px-8 py-16 text-center">
                <div
                    class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-light-300/80 bg-light-100 dark:border-dark-700/60 dark:bg-dark-800"
                >
                    <FontAwesomeIcon icon={faHome} class="text-3xl text-dark-300/50 dark:text-light-700/30" />
                </div>
                <h2
                    class="mb-2 text-xl font-normal text-dark-800 dark:text-light-100"
                    style="font-family: 'Playfair Display', Georgia, serif"
                >
                    {emptyMessage ?? $_('houses.noProperties')}
                </h2>
                {#if emptyLinkHref && emptyLinkLabel}
                    <a
                        href={emptyLinkHref}
                        class="mt-4 inline-block rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
                    >
                        {emptyLinkLabel}
                    </a>
                {/if}
            </div>
        </div>
    {:else}
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {#each properties as property, i (property.id)}
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                <a
                    href="/houses/{property.id}"
                    class="group block transition-all duration-300 hover:-translate-y-1"
                    style="animation: fadeInUp 0.45s ease-out {i * 0.05}s both"
                >
                    <AppPublicPropertyCard {property} imageIds={propertyImageMap[property.id ?? 0] || []} />
                </a>
            {/each}
        </div>

        {#if totalPages > 1}
            <div class="mt-14 flex flex-col items-center gap-3">
                <div class="flex items-center gap-1.5">
                    <button
                        type="button"
                        onclick={() => goToPage(currentPage - 1)}
                        disabled={!hasPrevPage}
                        aria-label="Previous page"
                        class="flex h-9 w-9 items-center justify-center rounded-lg border border-light-300 bg-white text-dark-600 shadow-sm transition-all hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-dark-700 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-600 dark:hover:text-primary-400"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} class="text-xs" />
                    </button>

                    {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page (page)}
                        {#if page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)}
                            <button
                                type="button"
                                onclick={() => goToPage(page)}
                                class="flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all {page === currentPage
                                    ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                                    : 'border-light-300 bg-white text-dark-600 shadow-sm hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-dark-700 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-600 dark:hover:text-primary-300'}"
                            >
                                {page}
                            </button>
                        {:else if page === currentPage - 3 || page === currentPage + 3}
                            <span class="flex h-9 w-9 items-center justify-center text-sm text-dark-400 dark:text-light-600">…</span>
                        {/if}
                    {/each}

                    <button
                        type="button"
                        onclick={() => goToPage(currentPage + 1)}
                        disabled={!hasNextPage}
                        aria-label="Next page"
                        class="flex h-9 w-9 items-center justify-center rounded-lg border border-light-300 bg-white text-dark-600 shadow-sm transition-all hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-dark-700 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-600 dark:hover:text-primary-400"
                    >
                        <FontAwesomeIcon icon={faChevronRight} class="text-xs" />
                    </button>
                </div>

                <p class="text-xs text-dark-400 dark:text-light-600" style="font-family: 'Plus Jakarta Sans', sans-serif">
                    {$_('houses.pageInfo', { values: { current: currentPage, total: totalPages } })}
                </p>
            </div>
        {/if}
    {/if}
</div>
