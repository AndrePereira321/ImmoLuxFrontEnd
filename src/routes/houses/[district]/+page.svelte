<script lang="ts">
    import { _ } from 'svelte-i18n';
    import { resolve } from '$app/paths';
    import { apiClient } from '$lib/api/api-client';
    import { notificationStore } from '$lib/stores/notification';
    import AppPropertyGrid from '$lib/components/AppPropertyGrid.svelte';
    import type { PropertyDTO } from '$lib/types/property';

    let { data } = $props();

    let properties = $state<PropertyDTO[]>(data.properties);
    let total = $state<number>(data.total);
    let propertyImageMap = $state<Record<number, number[]>>(data.propertyImageMap);
    let loading = $state(false);
    let offset = $state(0);
    const limit = 12;

    const stats = $derived(data.stats);
    const locationName = $derived(data.locationName);
    const districtSlug = $derived(data.districtSlug);

    const formatPrice = (price: number) =>
        Math.round(price).toLocaleString('pt-PT');

    const loadPropertyImages = async (propertyId: number) => {
        try {
            const res = await apiClient.get<{ images: { id: number; displayOrder: number }[] }>(
                `/properties/${propertyId}/images`
            );
            if (res.data.success && res.data.data) {
                propertyImageMap[propertyId] = res.data.data.images
                    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                    .map((img) => img.id!);
            } else {
                propertyImageMap[propertyId] = [];
            }
        } catch {
            propertyImageMap[propertyId] = [];
        }
    };

    const handlePageChange = async (newOffset: number) => {
        loading = true;
        offset = newOffset;
        try {
            const res = await apiClient.get<{ properties: PropertyDTO[]; total: number }>(
                `/properties?district=${encodeURIComponent(locationName)}&limit=${limit}&offset=${newOffset}`
            );
            if (res.data.success && res.data.data) {
                properties = res.data.data.properties ?? [];
                total = res.data.data.total ?? 0;
                propertyImageMap = {};
                await Promise.all(
                    properties.map((p) => p.id && loadPropertyImages(p.id))
                );
            }
        } catch {
            notificationStore.error($_('houses.noProperties'));
        } finally {
            loading = false;
        }
    };
</script>

<svelte:head>
    <title>{$_('location.district.metaTitle', { values: { location: locationName } })}</title>
    <meta name="description" content={$_('location.district.metaDescription', { values: { location: locationName, total: stats.total, min: formatPrice(stats.minPrice), max: formatPrice(stats.maxPrice) } })} />
    <meta property="og:title" content={$_('location.district.metaTitle', { values: { location: locationName } })} />
    <meta property="og:description" content={$_('location.district.metaDescription', { values: { location: locationName, total: stats.total, min: formatPrice(stats.minPrice), max: formatPrice(stats.maxPrice) } })} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://immolux.pt/houses/{districtSlug}" />
    <link rel="canonical" href="https://immolux.pt/houses/{districtSlug}" />
    {@html `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Houses", "item": "https://immolux.pt/houses" },
            { "@type": "ListItem", "position": 2, "name": locationName, "item": "https://immolux.pt/houses/" + districtSlug }
        ]
    })}<\/script>`}
</svelte:head>

<div class="min-h-screen bg-light-50 dark:bg-dark-900">
    <!-- Hero -->
    <section class="bg-primary-950 px-4 py-12 dark:bg-dark-950 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
            <!-- Breadcrumb -->
            <nav class="mb-4 flex items-center gap-2 text-xs text-primary-300/70">
                <a href={resolve('/houses')} class="transition-colors hover:text-primary-200">
                    {$_('location.breadcrumb.houses')}
                </a>
                <span>/</span>
                <span class="text-primary-100">{locationName}</span>
            </nav>
            <h1
                class="mb-3 text-4xl font-normal tracking-tight text-white sm:text-5xl"
                style="font-family: 'Playfair Display', Georgia, serif"
            >
                {$_('location.district.heroTitle', { values: { location: locationName } })}
            </h1>
            <!-- Stats block -->
            {#if stats.total > 0}
                <div class="mt-6 flex flex-wrap gap-4">
                    <div class="rounded-xl bg-white/8 px-4 py-2.5">
                        <p class="text-xs text-primary-300/70" style="font-family: 'Plus Jakarta Sans', sans-serif">
                            {$_('location.stats.available', { values: { total: stats.total } })}
                        </p>
                    </div>
                    <div class="rounded-xl bg-white/8 px-4 py-2.5">
                        <p class="text-xs text-primary-300/70" style="font-family: 'Plus Jakarta Sans', sans-serif">
                            {$_('location.stats.priceRange', { values: { min: formatPrice(stats.minPrice), max: formatPrice(stats.maxPrice) } })}
                        </p>
                    </div>
                    <div class="rounded-xl bg-white/8 px-4 py-2.5">
                        <p class="text-xs text-primary-300/70" style="font-family: 'Plus Jakarta Sans', sans-serif">
                            {$_('location.stats.mostCommon', { values: { type: $_('properties.types.' + stats.mostCommonType) } })}
                        </p>
                    </div>
                </div>
            {/if}
        </div>
    </section>

    <!-- Property grid -->
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <AppPropertyGrid
            {properties}
            {propertyImageMap}
            {total}
            {limit}
            {offset}
            {loading}
            onPageChange={handlePageChange}
            emptyMessage={$_('location.stats.noProperties')}
            emptyLinkHref={resolve('/houses')}
            emptyLinkLabel={$_('location.stats.browsAll')}
        />
    </div>
</div>
