<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEnvelope, faGlobe, faHandshake, faHouse, faMapMarkerAlt, faStar } from '@fortawesome/free-solid-svg-icons';
	import AppSection from '$lib/components/AppSection.svelte';
	import AppInfoCard from '$lib/components/AppInfoCard.svelte';
	import AppSectionDivider from '$lib/components/AppSectionDivider.svelte';
	import AppPublicPropertyCard from '$lib/components/AppPublicPropertyCard.svelte';
	import { apiClient } from '$lib/api/api-client';
	import type { PropertyDTO } from '$lib/types/property';

	interface PropertyListResponse {
		properties: PropertyDTO[];
		total: number;
	}

	interface PropertyImageMap {
		[propertyId: number]: number[];
	}

	let properties = $state<PropertyDTO[]>([]);
	let propertyImageMap = $state<PropertyImageMap>({});
	let loading = $state(true);
	let hasProperties = $state(false);

	const loadPropertyImages = async (propertyId: number) => {
		try {
			const response = await apiClient.get<{ images: { id: number; displayOrder: number }[] }>(
				`/properties/${propertyId}/images`
			);

			if (response.data.success && response.data.data) {
				const images = response.data.data.images;
				if (Array.isArray(images)) {
					const sortedImageIds = images
						.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
						.map((img) => img.id!);
					propertyImageMap[propertyId] = sortedImageIds;
				} else {
					propertyImageMap[propertyId] = [];
				}
			} else {
				propertyImageMap[propertyId] = [];
			}
		} catch (error) {
			console.error(`Failed to load images for property ${propertyId}:`, error);
			propertyImageMap[propertyId] = [];
		}
	};

	const loadRecentProperties = async () => {
		loading = true;
		try {
			const response = await apiClient.get<PropertyListResponse>('/properties', {
				params: {
					status: 'available',
					page: 1,
					limit: 3,
					orderBy: 'created_desc'
				}
			});

			if (response.data.success && response.data.data) {
				properties = response.data.data.properties;
				hasProperties = properties.length > 0;

				// Load images for each property
				for (const property of properties) {
					if (property.id) {
						await loadPropertyImages(property.id);
					}
				}
			}
		} catch (error) {
			console.error('Failed to load properties:', error);
			properties = [];
			hasProperties = false;
		} finally {
			loading = false;
		}
	};

	onMount(() => {
		loadRecentProperties();
	});
</script>

<div class="min-h-screen">
	<!-- Block 1: Hero Section - Available Houses -->
	<AppSection
		variant="primary"
		class="relative overflow-hidden bg-gradient-to-b from-light-50 to-light-100 dark:from-dark-900 dark:to-dark-850"
	>
		<!-- Decorative background -->
		<div class="absolute inset-0 -z-10 opacity-20 dark:opacity-10">
			<div class="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-primary-200 blur-3xl dark:bg-primary-950"></div>
			<div
				class="absolute right-1/4 bottom-20 h-96 w-96 rounded-full bg-secondary-200 blur-3xl dark:bg-secondary-950"
			></div>
		</div>

		<div class="mx-auto max-w-5xl text-center">
			<!-- Icon -->
			<div class="mb-8 inline-block">
				<div class="relative">
					<div
						class="absolute inset-0 animate-pulse rounded-full bg-primary-400 opacity-20 blur-2xl dark:bg-primary-600"
					></div>
					<div
						class="relative rounded-full bg-gradient-to-br from-primary-500 to-primary-700 p-10 shadow-2xl dark:from-primary-600 dark:to-primary-800"
					>
						<FontAwesomeIcon icon={faHouse} size="3x" class="text-light-50" />
					</div>
				</div>
			</div>

			<!-- Subtitle -->
			<p class="mb-3 text-sm font-medium tracking-widest text-primary-600 uppercase dark:text-primary-400">
				{$t('homepage.availableHouses.subtitle')}
			</p>

			<!-- Main Title -->
			<h1 class="mb-6 text-4xl font-normal tracking-tight text-dark-900 md:text-5xl lg:text-6xl dark:text-light-50">
				{$t('homepage.availableHouses.title')}
			</h1>

			<!-- Description -->
			<p class="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-dark-600 dark:text-light-400">
				{$t('homepage.availableHouses.description')}
			</p>

			<!-- Recent Properties -->
			{#if loading}
				<div class="flex justify-center py-16">
					<FontAwesomeIcon icon={faHouse} class="animate-spin text-6xl text-primary-600 dark:text-primary-400" />
				</div>
			{:else if hasProperties}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each properties as property (property.id)}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href="/houses/{property.id}" class="block transition-transform duration-200 hover:scale-[1.02]">
							<AppPublicPropertyCard {property} imageIds={propertyImageMap[property.id!] || []} compact={true} />
						</a>
					{/each}
				</div>

				<!-- View All Button -->
				<div class="mt-10 text-center">
					<a
						href="/houses"
						class="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 px-10 py-5 text-lg font-normal text-light-50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-primary-700 hover:to-primary-800 hover:shadow-2xl dark:from-primary-700 dark:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700"
					>
						<FontAwesomeIcon icon={faHouse} class="transition-transform duration-300 group-hover:rotate-12" />
						<span class="tracking-wide">{$t('houses.title')}</span>
					</a>
				</div>
			{:else}
				<!-- Coming Soon Placeholder -->
				<div
					class="group mx-auto max-w-4xl overflow-hidden rounded-3xl border-2 border-primary-200 bg-gradient-to-br from-light-50 to-light-100 p-12 shadow-xl transition-all duration-500 hover:border-primary-300 hover:shadow-2xl md:p-16 dark:border-primary-900 dark:from-dark-800 dark:to-dark-850 dark:hover:border-primary-800"
				>
					<div class="mb-4">
						<FontAwesomeIcon
							icon={faHouse}
							size="2x"
							class="text-primary-400 opacity-40 transition-all duration-500 group-hover:scale-110 group-hover:opacity-60 dark:text-primary-600"
						/>
					</div>
					<h3
						class="mb-3 text-xl font-normal tracking-wider text-primary-700 uppercase md:text-2xl dark:text-primary-400"
					>
						{$t('homepage.availableHouses.comingSoon')}
					</h3>
					<p class="text-base text-dark-600 dark:text-light-400">
						{$t('homepage.availableHouses.comingSoonDesc')}
					</p>
				</div>
			{/if}
		</div>
	</AppSection>

	<!-- Divider 1 -->
	<AppSectionDivider variant="decorative" />

	<!-- Block 2: About ImmoLux -->
	<AppSection variant="secondary" class="bg-light-100 dark:bg-dark-850">
		<div class="mx-auto max-w-6xl">
			<!-- Section Header -->
			<div class="mb-12 text-center">
				<p class="mb-3 text-sm font-medium tracking-widest text-primary-600 uppercase dark:text-primary-400">
					{$t('homepage.aboutUs.subtitle')}
				</p>
				<h2 class="mb-4 text-3xl font-normal tracking-tight text-dark-900 md:text-4xl lg:text-5xl dark:text-light-50">
					{$t('homepage.aboutUs.title')}
				</h2>
				<div
					class="mx-auto h-0.5 w-32 rounded-full bg-gradient-to-r from-transparent via-primary-500 to-transparent"
				></div>
			</div>

			<!-- Info Cards Grid -->
			<div class="grid gap-8 md:grid-cols-2 lg:gap-10">
				<!-- Location Card -->
				<AppInfoCard icon={faMapMarkerAlt} iconColor="primary">
					<h3 class="mb-3 text-xl font-medium text-dark-900 dark:text-light-50">
						{$t('homepage.aboutUs.location.title')}
					</h3>
					<p class="text-base">
						{$t('homepage.aboutUs.location.description')}
					</p>
				</AppInfoCard>

				<!-- Quality Card -->
				<AppInfoCard icon={faStar} iconColor="secondary">
					<h3 class="mb-3 text-xl font-medium text-dark-900 dark:text-light-50">
						{$t('homepage.aboutUs.dedication.title')}
					</h3>
					<p class="text-base">
						{$t('homepage.aboutUs.dedication.description')}
					</p>
				</AppInfoCard>

				<!-- Experience Card -->
				<AppInfoCard icon={faGlobe} iconColor="success">
					<h3 class="mb-3 text-xl font-medium text-dark-900 dark:text-light-50">
						{$t('homepage.aboutUs.experience.title')}
					</h3>
					<p class="text-base">
						{$t('homepage.aboutUs.experience.description')}
					</p>
				</AppInfoCard>

				<!-- Partner Card -->
				<AppInfoCard icon={faHandshake} iconColor="info">
					<h3 class="mb-3 text-xl font-medium text-dark-900 dark:text-light-50">
						{$t('homepage.aboutUs.partner.title')}
					</h3>
					<p class="mb-4 text-base">
						{$t('homepage.aboutUs.partner.description', {
							values: { partner: $t('homepage.aboutUs.partner.partnerName') }
						})}
					</p>
					<a
						href="http://www.pacaconstruct.be"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 font-medium text-primary-600 underline decoration-primary-300 underline-offset-4 transition-all hover:text-primary-700 hover:decoration-primary-500 dark:text-primary-400 dark:decoration-primary-700 dark:hover:text-primary-300"
					>
						www.pacaconstruct.be
						<span class="text-sm">→</span>
					</a>
				</AppInfoCard>
			</div>
		</div>
	</AppSection>

	<!-- Divider 2 -->
	<AppSectionDivider variant="decorative" />

	<!-- Block 3: Contact Information -->
	<AppSection
		variant="tertiary"
		class="bg-gradient-to-b from-light-200 to-light-100 dark:from-dark-800 dark:to-dark-850"
	>
		<div class="mx-auto max-w-4xl text-center">
			<!-- Icon -->
			<div class="mb-8 inline-block">
				<div class="relative">
					<div
						class="absolute inset-0 animate-pulse rounded-full bg-secondary-400 opacity-20 blur-2xl dark:bg-secondary-600"
					></div>
					<div
						class="relative rounded-full bg-gradient-to-br from-secondary-500 to-secondary-700 p-10 shadow-2xl dark:from-secondary-600 dark:to-secondary-800"
					>
						<FontAwesomeIcon icon={faEnvelope} size="3x" class="text-light-50" />
					</div>
				</div>
			</div>

			<!-- Subtitle -->
			<p class="mb-3 text-sm font-medium tracking-widest text-secondary-600 uppercase dark:text-secondary-400">
				{$t('homepage.contact.subtitle')}
			</p>

			<!-- Title -->
			<h2 class="mb-4 text-3xl font-normal tracking-tight text-dark-900 md:text-4xl lg:text-5xl dark:text-light-50">
				{$t('homepage.contact.title')}
			</h2>

			<div
				class="mx-auto mb-10 h-0.5 w-32 rounded-full bg-gradient-to-r from-transparent via-secondary-500 to-transparent"
			></div>

			<!-- Contact Cards -->
			<div class="space-y-6">
				<!-- Main Contact Card -->
				<div
					class="overflow-hidden rounded-3xl border-2 border-light-300 bg-gradient-to-br from-light-50 to-light-100 p-10 shadow-xl transition-all duration-500 hover:border-primary-300 hover:shadow-2xl md:p-12 dark:border-dark-700 dark:from-dark-800 dark:to-dark-900 dark:hover:border-primary-800"
				>
					<p class="mb-8 text-base leading-relaxed text-dark-700 dark:text-light-300">
						{$t('homepage.contact.interested')}
					</p>

					<a
						href="mailto:info@immolux.pt"
						class="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 px-10 py-5 text-lg font-normal text-light-50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-primary-700 hover:to-primary-800 hover:shadow-2xl md:px-12 md:py-6 md:text-xl dark:from-primary-700 dark:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700"
					>
						<FontAwesomeIcon icon={faEnvelope} class="transition-transform duration-300 group-hover:rotate-12" />
						<span class="tracking-wide">info@immolux.pt</span>
					</a>
				</div>

				<!-- Secondary Info Card -->
				<div
					class="rounded-3xl border-2 border-primary-200 bg-light-50 p-8 shadow-md md:p-10 dark:border-primary-800 dark:bg-dark-800"
				>
					<p class="text-base leading-relaxed text-dark-700 dark:text-light-300">
						{$t('homepage.contact.publishAnnouncement')}
					</p>
				</div>
			</div>
		</div>
	</AppSection>
</div>
