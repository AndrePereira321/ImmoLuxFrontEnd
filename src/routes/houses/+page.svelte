<script lang="ts">
	/**
	 * The catalogue.
	 *
	 * Ten buildings in two towns, so the page is built as a register rather than a
	 * search engine: the rail is an index of what exists, every entry carries the
	 * number of properties behind it, and an entry that would find nothing is not
	 * offered at all. Counts come from the API with each dimension measured against
	 * the other filters, which is what lets the page promise that every remaining
	 * choice leads somewhere.
	 *
	 * All of the state is in the query string. Nothing here mirrors it, so a search
	 * survives a reload, answers the back button, and can be sent to somebody else.
	 */
	import { _, locale } from 'svelte-i18n';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faMagnifyingGlass, faSliders, faXmark } from '@fortawesome/free-solid-svg-icons';
	import AppPropertyGrid from '$lib/components/AppPropertyGrid.svelte';
	import type { FacetBucket, PropertyDTO } from '$lib/types/property';
	import { formatPrice } from '$lib/utils/format';
	import {
		DEFAULT_SORT,
		PROPERTY_SORTS,
		SEARCH_PAGE_SIZE,
		activeFilters,
		toPageQuery,
		without,
		type NarrowingKey,
		type PropertySearch,
		type PropertySort
	} from '$lib/utils/property-search';
	import homeImage from '$lib/assets/images/home_image.jpeg';

	let { data } = $props();

	const search = $derived(data.search);
	const facets = $derived(data.facets);
	const active = $derived(activeFilters(search));
	const busy = $derived(Boolean(navigating.to));

	const base = resolve('/houses');
	const urlFor = (patch: Partial<PropertySearch>): string =>
		`${base}${toPageQuery({ ...search, ...patch, offset: 0 })}`;

	/** Choosing what is already chosen releases it — the rail has no separate undo. */
	const toggleUrl = (key: NarrowingKey, value: string): string => urlFor({ [key]: search[key] === value ? '' : value });

	/**
	 * Types and availability have a settled order — a plan of a house, then the
	 * stages of a sale — and shuffling them by how many there are would move the
	 * ground under a reader who is scanning the same list for the second time.
	 */
	const inOrder = (buckets: FacetBucket[], order: string[]): FacetBucket[] =>
		[...buckets].sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));

	const typeBuckets = $derived(
		inOrder(facets.propertyTypes, ['house', 'apartment', 'villa', 'townhouse', 'land', 'commercial'])
	);
	const statusBuckets = $derived(inOrder(facets.statuses, ['available', 'pending', 'sold', 'rented']));

	/** "Lousada, Porto" — the town first, because that is what a buyer is looking for. */
	const placeLabel = (bucket: FacetBucket): string =>
		bucket.parent ? `${bucket.value}, ${bucket.parent}` : bucket.value;

	const filterLabel = (key: NarrowingKey): string => {
		switch (key) {
			case 'q':
				return `“${search.q}”`;
			case 'municipality':
			case 'district':
			case 'parish':
				return search[key];
			case 'propertyType':
				return $_(`properties.types.${search.propertyType}`);
			case 'status':
				return $_(`properties.statuses.${search.status}`);
			case 'minPrice':
				return $_('houses.applied.from', { values: { value: formatPrice(search.minPrice, $locale) } });
			case 'maxPrice':
				return $_('houses.applied.to', { values: { value: formatPrice(search.maxPrice, $locale) } });
		}
	};

	/**
	 * The box navigates as you type. The value is read from the URL rather than
	 * bound to it, so the back button rewinds the field along with the results and
	 * a stale keystroke can never overwrite a newer one.
	 */
	let searchTimer: ReturnType<typeof setTimeout>;
	const onSearchInput = (event: Event) => {
		const value = (event.currentTarget as HTMLInputElement).value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			// replaceState: typing is one act of searching, not a dozen history entries.
			goto(urlFor({ q: value.trim() }), { keepFocus: true, noScroll: true, replaceState: true });
		}, 280);
	};

	const onSortChange = (event: Event) => {
		const value = (event.currentTarget as HTMLSelectElement).value as PropertySort;
		goto(urlFor({ orderBy: value }), { noScroll: true });
	};

	let filtersOpen = $state(false);

	/**
	 * What the price fields are worth typing, given everything else that is set.
	 * Narrow far enough and the range closes onto a single property, where naming
	 * one figure twice would read as a mistake rather than as a range.
	 */
	const rangeCaption = $derived.by(() => {
		const { minPrice, maxPrice } = facets;
		if (minPrice === null || maxPrice === null) return '';
		const min = formatPrice(minPrice, $locale);
		if (minPrice === maxPrice) return $_('houses.facets.rangeSingle', { values: { min } });
		return $_('houses.facets.rangeIs', { values: { min, max: formatPrice(maxPrice, $locale) } });
	});

	const properties = $derived(data.properties as PropertyDTO[]);
</script>

<svelte:head>
	<title>{$_('houses.meta.title')} - ImmoLux</title>
	<meta name="description" content={$_('houses.meta.description')} />
	<meta property="og:title" content="{$_('houses.meta.title')} - ImmoLux" />
	<meta property="og:description" content={$_('houses.meta.description')} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://immolux.pt/houses" />
	<meta property="og:image" content="https://immolux.pt{homeImage}" />
	<meta property="og:image:alt" content={$_('houses.hero.title')} />
	<meta name="twitter:title" content="{$_('houses.meta.title')} - ImmoLux" />
	<meta name="twitter:description" content={$_('houses.meta.description')} />
	<meta name="twitter:image" content="https://immolux.pt{homeImage}" />
	<!-- A filtered view is the same collection seen through a filter, not a page of
	     its own: one canonical target keeps the ten listings from being indexed
	     dozens of times over. -->
	<link rel="canonical" href="https://immolux.pt/houses" />
	{#if active.length > 0}
		<meta name="robots" content="noindex, follow" />
	{/if}
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			"@id": "https://immolux.pt/houses#collection",
			"name": "Properties in Portugal",
			"url": "https://immolux.pt/houses",
			"description": "Browse houses, apartments and land for sale in Portugal",
			"publisher": { "@id": "https://immolux.pt/#organization" }
		}
	</script>
</svelte:head>

{#snippet facetSection(title: string, key: NarrowingKey, buckets: FacetBucket[], label: (b: FacetBucket) => string)}
	{#if buckets.length > 0}
		<section>
			<h3 class="type-label mb-2.5 text-dark-400 dark:text-light-600">{title}</h3>
			<div class="azulejo-panel grid-cols-1">
				{#each buckets as bucket (bucket.value)}
					{@const selected = search[key] === bucket.value}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a
						href={toggleUrl(key, bucket.value)}
						aria-current={selected ? 'true' : undefined}
						data-sveltekit-noscroll
						class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors {selected
							? 'bg-primary-700 text-light-50 dark:bg-primary-600'
							: 'azulejo-cell text-dark-700 hover:bg-primary-50 hover:text-primary-800 dark:text-light-300 dark:hover:bg-primary-950/50 dark:hover:text-primary-200'}"
					>
						<span class="min-w-0 flex-1 truncate">{label(bucket)}</span>
						<!-- The count keeps its column whether or not the row is chosen, so the
						     figures still read down the panel as one list. -->
						<span
							class="type-record shrink-0 text-xs tabular-nums {selected
								? 'text-light-50/85'
								: 'text-dark-400 dark:text-light-600'}"
						>
							{bucket.count}
						</span>
						{#if selected}
							<span class="sr-only">{$_('houses.applied.selectedRemove')}</span>
							<FontAwesomeIcon icon={faXmark} class="-mr-1 shrink-0 text-[0.7rem] opacity-80" />
						{/if}
					</a>
				{/each}
			</div>
		</section>
	{/if}
{/snippet}

{#snippet filterRail()}
	<div class="space-y-6">
		{@render facetSection($_('houses.facets.where'), 'municipality', facets.municipalities, placeLabel)}
		{@render facetSection($_('houses.facets.type'), 'propertyType', typeBuckets, (b) =>
			$_(`properties.types.${b.value}`)
		)}
		{@render facetSection($_('houses.facets.availability'), 'status', statusBuckets, (b) =>
			$_(`properties.statuses.${b.value}`)
		)}

		<section>
			<h3 class="type-label mb-2.5 text-dark-400 dark:text-light-600">{$_('houses.facets.price')}</h3>
			<!-- A plain GET form: it files the same search the links do, and it works
			     before any of this page's JavaScript has arrived. -->
			<form
				method="GET"
				action={base}
				data-sveltekit-keepfocus
				data-sveltekit-noscroll
				class="azulejo-panel grid-cols-1"
			>
				<div class="azulejo-cell p-4">
					<div class="grid grid-cols-2 gap-2">
						<label class="block">
							<span class="type-label mb-1.5 block text-dark-400 dark:text-light-600">{$_('houses.min')}</span>
							<input
								type="number"
								name="minPrice"
								inputmode="numeric"
								min="0"
								step="1000"
								value={search.minPrice ?? ''}
								class="type-record w-full border border-light-800 bg-light-50 px-2.5 py-2 text-sm text-dark-800 tabular-nums transition-colors placeholder:text-dark-300 focus:border-primary-600 dark:border-dark-600 dark:bg-dark-800 dark:text-light-100 dark:placeholder:text-light-700"
							/>
						</label>
						<label class="block">
							<span class="type-label mb-1.5 block text-dark-400 dark:text-light-600">{$_('houses.max')}</span>
							<input
								type="number"
								name="maxPrice"
								inputmode="numeric"
								min="0"
								step="1000"
								value={search.maxPrice ?? ''}
								class="type-record w-full border border-light-800 bg-light-50 px-2.5 py-2 text-sm text-dark-800 tabular-nums transition-colors placeholder:text-dark-300 focus:border-primary-600 dark:border-dark-600 dark:bg-dark-800 dark:text-light-100 dark:placeholder:text-light-700"
							/>
						</label>
					</div>

					<!-- Everything the rail is holding travels with the form, or filing a
					     price would quietly drop the town and the type. -->
					{#if search.q}<input type="hidden" name="q" value={search.q} />{/if}
					{#if search.municipality}<input type="hidden" name="municipality" value={search.municipality} />{/if}
					{#if search.district}<input type="hidden" name="district" value={search.district} />{/if}
					{#if search.parish}<input type="hidden" name="parish" value={search.parish} />{/if}
					{#if search.propertyType}<input type="hidden" name="propertyType" value={search.propertyType} />{/if}
					{#if search.status}<input type="hidden" name="status" value={search.status} />{/if}
					{#if search.orderBy !== DEFAULT_SORT}<input type="hidden" name="orderBy" value={search.orderBy} />{/if}

					<button
						type="submit"
						class="mt-3 w-full border border-primary-700 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-700 hover:text-light-50 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-600 dark:hover:text-light-50"
					>
						{$_('houses.facets.applyPrice')}
					</button>

					{#if rangeCaption}
						<p class="type-record mt-3 text-xs leading-relaxed text-dark-400 dark:text-light-600">{rangeCaption}</p>
					{/if}
				</div>
			</form>
		</section>
	</div>
{/snippet}

<div class="min-h-screen bg-light-200 dark:bg-dark-850">
	<!-- ── Masthead ──
	     No photograph behind the type: the same lime-washed ground the rest of the
	     site opens on, so arriving here reads as turning a page rather than
	     landing on a different site. -->
	<section class="mx-auto w-full max-w-[84rem] px-5 pt-10 pb-8 sm:px-8 sm:pt-12 lg:px-12">
		<p class="type-label text-primary-700 dark:text-primary-300">{$_('houses.hero.eyebrow')}</p>
		<h1 class="type-display mt-4 max-w-[20ch] text-[clamp(1.9rem,4vw,3rem)] text-dark-900 dark:text-light-50">
			{$_('houses.hero.title')}
		</h1>
		<p class="mt-4 max-w-[54ch] leading-relaxed text-dark-500 dark:text-light-500">
			{$_('houses.hero.subtitle')}
		</p>

		<!-- One field, and it reaches everything: the name of a building, a kind of
		     property, or the town it stands in. -->
		<form method="GET" action={base} data-sveltekit-keepfocus data-sveltekit-noscroll class="mt-7 max-w-[34rem]">
			<label for="property-search" class="sr-only">{$_('houses.search.label')}</label>
			<!-- The focus ring sits on the wrapper because the input's own outline is
			     suppressed to keep the field and its button reading as one object. -->
			<div
				class="azulejo-rule flex items-center border bg-light-50 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/25 dark:bg-dark-800 dark:focus-within:border-primary-400 dark:focus-within:ring-primary-400/25"
			>
				<!-- Set at the text's own size and on the same baseline, so the mark and
				     the words read as one line rather than as a badge beside a field. -->
				<FontAwesomeIcon
					icon={faMagnifyingGlass}
					class="ml-4 hidden shrink-0 text-base text-dark-400 sm:block dark:text-light-600"
				/>
				<!-- border-0 / ring-0: the forms plugin gives every input a border of its
				     own, in a grey darker than the grout — a second box drawn inside this
				     one. The field's edge is the wrapper's, and there is only ever one. -->
				<input
					id="property-search"
					type="search"
					name="q"
					value={search.q}
					oninput={onSearchInput}
					autocomplete="off"
					placeholder={$_('houses.search.placeholder')}
					class="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 text-dark-900 placeholder:text-dark-400 focus:border-0 focus:ring-0 focus:outline-none sm:pr-4 sm:pl-3 dark:text-light-50 dark:placeholder:text-light-600"
				/>
				{#if search.municipality}<input type="hidden" name="municipality" value={search.municipality} />{/if}
				{#if search.district}<input type="hidden" name="district" value={search.district} />{/if}
				{#if search.propertyType}<input type="hidden" name="propertyType" value={search.propertyType} />{/if}
				{#if search.status}<input type="hidden" name="status" value={search.status} />{/if}
				<!-- On a phone the field needs every pixel, so the button carries the
				     magnifier instead of its name and the decorative one steps aside. -->
				<button
					type="submit"
					class="type-label flex shrink-0 items-center self-stretch bg-primary-700 px-4 text-light-50 transition-colors hover:bg-primary-600 sm:px-5 dark:bg-primary-600 dark:hover:bg-primary-500"
				>
					<span class="hidden sm:inline">{$_('houses.search.submit')}</span>
					<span class="sm:hidden">
						<span class="sr-only">{$_('houses.search.submit')}</span>
						<FontAwesomeIcon icon={faMagnifyingGlass} class="text-sm" />
					</span>
				</button>
			</div>
		</form>
	</section>

	<!-- ── State bar ──
	     What is being shown, what is narrowing it, and in what order. Sticks under
	     the 65px navigation so the reader can undo a filter from anywhere down the
	     page without scrolling back up for it. -->
	<!-- 65px, not 64: the navigation is h-16 plus its own grout line, and sticking a
	     pixel short slides this bar's top edge underneath it. -->
	<div class="azulejo-rule sticky top-[65px] z-30 border-y bg-light-200/95 backdrop-blur-md dark:bg-dark-850/95">
		<div class="mx-auto w-full max-w-[84rem] px-5 sm:px-8 lg:px-12">
			<div class="flex items-center gap-3 py-3">
				<p class="type-record shrink-0 text-sm text-dark-600 tabular-nums dark:text-light-400" aria-live="polite">
					{data.total}
					<span class="text-dark-400 dark:text-light-600">
						{data.total === 1 ? $_('houses.property') : $_('houses.properties')}
					</span>
				</p>

				{#if active.length > 0}
					<!-- The filters as a row of released catches: each one names itself and
					     comes off where it sits. -->
					<ul
						class="flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-1.5 overflow-x-auto [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
					>
						{#each active as key (key)}
							<li class="shrink-0">
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a
									href="{base}{toPageQuery(without(search, key))}"
									data-sveltekit-noscroll
									class="azulejo-rule flex items-center gap-2 border bg-light-50 py-1 pr-2 pl-3 text-xs text-dark-600 transition-colors hover:border-primary-600 hover:text-primary-700 dark:bg-dark-800 dark:text-light-400 dark:hover:border-primary-400 dark:hover:text-primary-300"
								>
									<span class="max-w-[16ch] truncate">{filterLabel(key)}</span>
									<span class="sr-only">{$_('houses.applied.remove')}</span>
									<FontAwesomeIcon icon={faXmark} class="text-[0.6rem] opacity-70" />
								</a>
							</li>
						{/each}
						<li class="shrink-0">
							<a
								href={base}
								data-sveltekit-noscroll
								class="px-2 text-xs font-medium text-primary-700 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-600 dark:text-primary-300 dark:decoration-primary-700"
							>
								{$_('houses.clearFilters')}
							</a>
						</li>
					</ul>
				{:else}
					<div class="flex-1"></div>
				{/if}

				<button
					type="button"
					onclick={() => (filtersOpen = !filtersOpen)}
					aria-expanded={filtersOpen}
					aria-controls="filter-rail"
					class="azulejo-rule flex shrink-0 items-center gap-2 border bg-light-50 px-3 py-1.5 text-xs font-medium text-dark-600 transition-colors hover:border-primary-600 hover:text-primary-700 lg:hidden dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-400"
				>
					<FontAwesomeIcon icon={faSliders} class="text-[0.7rem]" />
					{$_('houses.filters')}
				</button>

				<label class="hidden shrink-0 items-center gap-2 lg:flex">
					<span class="type-label text-dark-400 dark:text-light-600">{$_('houses.sort.label')}</span>
					<select
						value={search.orderBy}
						onchange={onSortChange}
						class="azulejo-rule border bg-light-50 py-1.5 pr-7 pl-2.5 text-xs text-dark-700 transition-colors focus:border-primary-600 dark:bg-dark-800 dark:text-light-300"
					>
						{#each PROPERTY_SORTS as sort (sort)}
							<option value={sort}>{$_(`houses.sort.${sort}`)}</option>
						{/each}
					</select>
				</label>
			</div>
		</div>
	</div>

	<div class="mx-auto w-full max-w-[84rem] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
		<div class="lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-10 xl:gap-12">
			<aside id="filter-rail" class="{filtersOpen ? 'mb-8 block' : 'hidden'} lg:mb-0 lg:block">
				<!-- 121px: the navigation's 65 plus the state bar's 56, so the rail comes to
				     rest against the bar rather than a pixel beneath it. -->
				<div class="lg:sticky lg:top-[121px]">
					<div class="mb-4 flex items-center justify-between lg:hidden">
						<h2 class="type-label text-dark-500 dark:text-light-500">{$_('houses.filters')}</h2>
						<label class="flex items-center gap-2">
							<span class="type-label text-dark-400 dark:text-light-600">{$_('houses.sort.label')}</span>
							<select
								value={search.orderBy}
								onchange={onSortChange}
								class="azulejo-rule border bg-light-50 py-1.5 pr-7 pl-2.5 text-xs text-dark-700 dark:bg-dark-800 dark:text-light-300"
							>
								{#each PROPERTY_SORTS as sort (sort)}
									<option value={sort}>{$_(`houses.sort.${sort}`)}</option>
								{/each}
							</select>
						</label>
					</div>
					{@render filterRail()}
				</div>
			</aside>

			<!-- Dimmed rather than emptied while the next set is fetched: replacing the
			     grid with a spinner collapses the page and throws away the reader's
			     place for the sake of a few hundred milliseconds. -->
			<div
				class="min-w-0 transition-opacity duration-200 motion-reduce:transition-none {busy
					? 'pointer-events-none opacity-55'
					: ''}"
				aria-busy={busy}
			>
				<AppPropertyGrid
					{properties}
					propertyImageMap={data.propertyImageMap}
					total={data.total}
					limit={SEARCH_PAGE_SIZE}
					offset={search.offset}
					loading={false}
					pageHref={(offset) => `${base}${toPageQuery({ ...search, offset })}`}
				>
					{#snippet empty()}
						<!-- Reaching nothing is only possible by typing or by pricing, since
						     the rail withholds the choices that lead here. So the way out is
						     the filters themselves, listed and individually releasable. -->
						<div class="azulejo-panel grid-cols-1">
							<div class="azulejo-cell p-8 sm:p-12">
								<h2 class="type-display text-2xl text-dark-900 dark:text-light-50">{$_('houses.empty.title')}</h2>
								<p class="mt-3 max-w-[48ch] leading-relaxed text-dark-500 dark:text-light-500">
									{$_('houses.empty.body')}
								</p>
								{#if active.length > 0}
									<ul class="mt-6 flex flex-wrap gap-2">
										{#each active as key (key)}
											<li>
												<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
												<a
													href="{base}{toPageQuery(without(search, key))}"
													class="azulejo-rule flex items-center gap-2 border bg-light-100 px-3 py-2 text-sm text-dark-700 transition-colors hover:border-primary-600 hover:text-primary-700 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-400"
												>
													<FontAwesomeIcon icon={faXmark} class="text-[0.65rem] opacity-70" />
													{$_('houses.empty.drop', { values: { filter: filterLabel(key) } })}
												</a>
											</li>
										{/each}
									</ul>
									<a
										href={base}
										class="mt-6 inline-flex items-center gap-2 border border-primary-700 px-5 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-700 hover:text-light-50 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-600 dark:hover:text-light-50"
									>
										{$_('houses.empty.showAll')}
									</a>
								{/if}
							</div>
						</div>
					{/snippet}
				</AppPropertyGrid>
			</div>
		</div>
	</div>
</div>
