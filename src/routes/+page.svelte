<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEnvelope, faGlobe, faHandshake, faHouse, faMapMarkerAlt, faStar } from '@fortawesome/free-solid-svg-icons';
	import AppSection from '$lib/components/AppSection.svelte';
	import AppInfoCard from '$lib/components/AppInfoCard.svelte';
	import AppSectionDivider from '$lib/components/AppSectionDivider.svelte';
	import AppPublicPropertyCard from '$lib/components/AppPublicPropertyCard.svelte';
	import type { PropertyDTO } from '$lib/types/property';
	import immoLuxLogo from '$lib/assets/images/logo_transparent_white.png';
	import immoLuxLogoDark from '$lib/assets/images/logo_transparent_dark.png';

	interface PropertyImageMap {
		[propertyId: number]: number[];
	}

	let properties = $state<PropertyDTO[]>([]);
	let propertyImageMap = $state<PropertyImageMap>({});
	let hasProperties = $state(false);
	let loading = $state(true);

	onMount(async () => {
		try {
			const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
			const response = await fetch(
				`${serverUrl}/v1/api/properties?status=available&page=1&limit=3&orderBy=created_desc`
			);

			if (response.ok) {
				const data = await response.json();
				if (data.success && data.data) {
					properties = data.data.properties;
					hasProperties = properties.length > 0;

					// Load images for each property
					for (const property of properties) {
						if (property.id) {
							try {
								const imgResponse = await fetch(`${serverUrl}/v1/api/properties/${property.id}/images`);
								if (imgResponse.ok) {
									const imgData = await imgResponse.json();
									if (imgData.success && imgData.data && imgData.data.images) {
										const images = imgData.data.images;
										const sortedImageIds = images
											.sort(
												(a: { displayOrder?: number }, b: { displayOrder?: number }) =>
													(a.displayOrder ?? 0) - (b.displayOrder ?? 0)
											)
											.map((img: { id: number }) => img.id);
										propertyImageMap[property.id] = sortedImageIds;
									}
								}
							} catch (err) {
								console.error(`Failed to load images for property ${property.id}:`, err);
							}
						}
					}
				}
			}
		} catch (error) {
			console.error('Failed to load properties:', error);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>ImmoLux - {$t('homepage.meta.title')}</title>
	<meta name="description" content={$t('homepage.meta.description')} />
	<meta property="og:title" content="ImmoLux - {$t('homepage.meta.title')}" />
	<meta property="og:description" content={$t('homepage.meta.description')} />
	<meta property="og:type" content="website" />
	<link rel="canonical" href="https://immolux.pt/" />
	<style>
		@keyframes fadeInUp {
			from {
				opacity: 0;
				transform: translateY(30px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	</style>
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-br from-light-50 via-light-100 to-light-200 dark:from-dark-950 dark:via-dark-900 dark:to-dark-850"
>
	<!-- Block 1: Hero Section - Available Houses -->
	<AppSection variant="primary" class="relative overflow-hidden">
		<!-- Decorative background patterns -->
		<div class="absolute inset-0 -z-10">
			<!-- Gradient orbs -->
			<div
				class="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary-200/40 to-transparent blur-3xl dark:from-primary-900/40"
			></div>
			<div
				class="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-secondary-200/40 to-transparent blur-3xl dark:from-secondary-900/40"
			></div>
			<div
				class="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary-100/30 to-secondary-100/30 blur-2xl dark:from-primary-950/30 dark:to-secondary-950/30"
			></div>

			<!-- Subtle grid pattern -->
			<div
				class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30 dark:opacity-10"
			></div>
		</div>

		<div class="mx-auto max-w-5xl text-center">
			<!-- Logo -->
			<div class="mb-8 inline-block">
				<div class="relative">
					<div class="absolute inset-0 animate-pulse"></div>
					<div class="relative">
						<img src={immoLuxLogo} alt="ImmoLux" class="h-32 w-auto drop-shadow-2xl md:h-40 dark:hidden" />
						<img src={immoLuxLogoDark} alt="ImmoLux" class="hidden h-32 w-auto drop-shadow-2xl md:h-40 dark:block" />
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
					<div class="relative">
						<div class="absolute inset-0 animate-ping rounded-full bg-primary-400/50 dark:bg-primary-600/50"></div>
						<FontAwesomeIcon
							icon={faHouse}
							class="relative animate-spin text-6xl text-primary-600 dark:text-primary-400"
						/>
					</div>
				</div>
			{:else if hasProperties}
				<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					{#each properties as property, i (property.id)}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href="/houses/{property.id}"
							class="group block transform transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]"
							style="animation: fadeInUp 0.6s ease-out {i * 0.1}s both"
						>
							<div
								class="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-light-300/50 transition-all duration-300 group-hover:shadow-2xl group-hover:ring-primary-300 dark:bg-dark-800 dark:ring-dark-700/50 dark:group-hover:ring-primary-700"
							>
								<AppPublicPropertyCard {property} imageIds={propertyImageMap[property.id!] || []} compact={true} />
							</div>
						</a>
					{/each}
				</div>

				<!-- View All Button -->
				<div class="mt-10 text-center">
					<a
						href={resolve('/houses')}
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
	<AppSection
		variant="secondary"
		class="relative overflow-hidden bg-gradient-to-br from-light-100/80 via-white/50 to-light-100/80 dark:from-dark-850/80 dark:via-dark-800/50 dark:to-dark-850/80"
	>
		<!-- Decorative elements -->
		<div class="absolute inset-0 -z-10">
			<div
				class="absolute top-10 right-10 h-64 w-64 rounded-full bg-primary-100/20 blur-3xl dark:bg-primary-900/20"
			></div>
			<div
				class="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-secondary-100/20 blur-3xl dark:bg-secondary-900/20"
			></div>
		</div>
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
		class="relative overflow-hidden bg-gradient-to-br from-light-200/90 via-secondary-50/20 to-light-100/90 dark:from-dark-800/90 dark:via-secondary-950/20 dark:to-dark-850/90"
	>
		<!-- Decorative elements -->
		<div class="absolute inset-0 -z-10">
			<div
				class="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-secondary-200/30 blur-3xl dark:bg-secondary-900/30"
			></div>
			<div
				class="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-primary-200/30 blur-3xl dark:bg-primary-900/30"
			></div>
		</div>
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
