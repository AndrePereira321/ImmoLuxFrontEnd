<script lang="ts">
	import { t } from 'svelte-i18n';
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faEnvelope,
		faGlobe,
		faHandshake,
		faHouse,
		faMapMarkerAlt,
		faStar,
		faSun,
		faChartLine,
		faWineGlass,
		faShieldHalved
	} from '@fortawesome/free-solid-svg-icons';
	import AppSection from '$lib/components/AppSection.svelte';
	import AppInfoCard from '$lib/components/AppInfoCard.svelte';
	import AppSectionDivider from '$lib/components/AppSectionDivider.svelte';
	import AppPublicPropertyCard from '$lib/components/AppPublicPropertyCard.svelte';
	import type { PropertyDTO } from '$lib/types/property';
	import { inview } from '$lib/actions/inview';
	import immoLuxLogo from '$lib/assets/images/logo_transparent_white.png';
	import immoLuxLogoDark from '$lib/assets/images/logo_transparent_dark.png';
	import homeImage from '$lib/assets/images/home_image.jpeg';

	interface PropertyImageMap {
		[propertyId: number]: number[];
	}

	let { data } = $props();

	let properties = $derived<PropertyDTO[]>(data.featuredProperties);
	let propertyImageMap = $derived<PropertyImageMap>(data.propertyImageMap);
	let hasProperties = $derived(properties.length > 0);

	// ── Animated counters ──
	let statsTriggered = $state(false);
	let counterYears = $state(0);
	let counterProperties = $state(0);
	let counterMarkets = $state(0);
	let counterSatisfaction = $state(0);

	function animateValue(end: number, duration: number, onUpdate: (v: number) => void) {
		const start = performance.now();
		function tick(now: number) {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			// easeOutCubic
			const eased = 1 - Math.pow(1 - progress, 3);
			onUpdate(Math.round(end * eased));
			if (progress < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	}

	function startCounters() {
		if (statsTriggered) return;
		statsTriggered = true;
		animateValue(15, 1800, (v) => (counterYears = v));
		animateValue(50, 2000, (v) => (counterProperties = v));
		animateValue(3, 1200, (v) => (counterMarkets = v));
		animateValue(100, 2400, (v) => (counterSatisfaction = v));
	}
</script>

<svelte:head>
	<title>ImmoLux - {$t('homepage.meta.title')}</title>
	<meta name="description" content={$t('homepage.meta.description')} />
	<meta property="og:title" content="ImmoLux - {$t('homepage.meta.title')}" />
	<meta property="og:description" content={$t('homepage.meta.description')} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://immolux.pt/" />
	<meta property="og:image" content="https://immolux.pt{homeImage}" />
	<meta property="og:image:alt" content="ImmoLux - {$t('homepage.meta.title')}" />
	<meta name="twitter:title" content="ImmoLux - {$t('homepage.meta.title')}" />
	<meta name="twitter:description" content={$t('homepage.meta.description')} />
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

<div class="bg-light-50 dark:bg-dark-900">
	<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	     HERO SECTION
	     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
	<section class="grain relative overflow-hidden">
		<!-- Atmospheric background -->
		<div class="absolute inset-0 -z-10">
			<div
				class="absolute inset-0 bg-gradient-to-b from-light-50 via-light-100/80 to-light-200/60 dark:from-dark-900 dark:via-dark-850/80 dark:to-dark-800/60"
			></div>
			<!-- Primary glow -->
			<div
				class="absolute top-0 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gradient-to-b from-primary-100/30 to-transparent blur-3xl dark:from-primary-950/20"
			></div>
			<!-- Secondary glow -->
			<div
				class="absolute right-0 bottom-0 h-[500px] w-[500px] translate-x-1/4 rounded-full bg-gradient-to-tl from-secondary-100/25 to-transparent blur-3xl dark:from-secondary-950/15"
			></div>
			<!-- Subtle left accent -->
			<div
				class="absolute top-1/3 left-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-gradient-to-r from-secondary-200/15 to-transparent blur-3xl dark:from-secondary-950/10"
			></div>
		</div>

		<div class="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8 lg:pt-20 lg:pb-24">
			<div class="text-center">
				<!-- Logo -->
				<div class="mb-10 inline-block" style="animation: fadeIn 0.6s ease-out">
					<img src={immoLuxLogoDark} alt="ImmoLux" class="h-28 w-auto md:h-36 dark:hidden" />
					<img src={immoLuxLogo} alt="ImmoLux" class="hidden h-28 w-auto md:h-36 dark:block" />
				</div>

				<!-- Subtitle -->
				<p
					class="mb-4 text-xs font-semibold tracking-[0.2em] text-primary-600 uppercase sm:text-sm dark:text-primary-400"
					style="animation: fadeInUp 0.6s ease-out 0.1s both; font-family: 'Plus Jakarta Sans', sans-serif"
				>
					{$t('homepage.availableHouses.subtitle')}
				</p>

				<!-- Main Title -->
				<h1
					class="mb-6 text-4xl font-normal tracking-tight text-dark-900 sm:text-5xl lg:text-6xl dark:text-light-50"
					style="animation: fadeInUp 0.6s ease-out 0.2s both"
				>
					{$t('homepage.availableHouses.title')}
				</h1>

				<!-- Decorative line -->
				<div
					class="mx-auto mb-8 h-px w-20 bg-gradient-to-r from-transparent via-secondary-400 to-transparent dark:via-secondary-600"
					style="animation: fadeIn 0.8s ease-out 0.3s both"
				></div>

				<!-- Description -->
				<p
					class="mx-auto mb-14 max-w-2xl text-base leading-relaxed text-dark-400 sm:text-lg dark:text-light-600"
					style="animation: fadeInUp 0.6s ease-out 0.35s both"
				>
					{$t('homepage.availableHouses.description')}
				</p>

				<!-- Properties Grid -->
				{#if hasProperties}
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
						{#each properties as property, i (property.id)}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href="/houses/{property.id}"
								class="group block transition-all duration-300 hover:-translate-y-1"
								style="animation: fadeInUp 0.5s ease-out {0.4 + i * 0.08}s both"
							>
								<AppPublicPropertyCard {property} imageIds={propertyImageMap[property.id!] || []} compact={true} />
							</a>
						{/each}
					</div>

					<!-- View All Button -->
					<div class="mt-12 text-center" style="animation: fadeInUp 0.5s ease-out 0.7s both">
						<a
							href={resolve('/houses')}
							class="group inline-flex items-center gap-3 rounded-xl bg-primary-600 px-8 py-4 text-sm font-semibold text-light-50 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg dark:bg-primary-700 dark:hover:bg-primary-600"
							style="font-family: 'Plus Jakarta Sans', sans-serif"
						>
							<FontAwesomeIcon icon={faHouse} class="text-xs transition-transform duration-300 group-hover:scale-110" />
							<span class="tracking-wide">{$t('houses.title')}</span>
						</a>
					</div>
				{:else}
					<!-- Coming Soon -->
					<div
						class="mx-auto max-w-3xl rounded-2xl border border-light-300/80 bg-white p-12 shadow-sm transition-all duration-300 hover:shadow-md md:p-16 dark:border-dark-700/60 dark:bg-dark-800"
						style="animation: fadeInUp 0.6s ease-out 0.4s both"
					>
						<div class="mb-5">
							<FontAwesomeIcon
								icon={faHouse}
								size="2x"
								class="text-primary-300 transition-transform duration-500 group-hover:scale-110 dark:text-primary-700"
							/>
						</div>
						<h3
							class="mb-3 text-lg font-normal tracking-wider text-primary-700 uppercase md:text-xl dark:text-primary-400"
							style="font-family: 'Plus Jakarta Sans', sans-serif"
						>
							{$t('homepage.availableHouses.comingSoon')}
						</h3>
						<p class="text-sm text-dark-400 dark:text-light-600">
							{$t('homepage.availableHouses.comingSoonDesc')}
						</p>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	     STATS COUNTER BAR
	     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
	<section
		class="relative overflow-hidden bg-primary-900 dark:bg-dark-950"
		use:inview={{ threshold: 0.3, onEnter: startCounters }}
	>
		<!-- Top gold accent line -->
		<div
			class="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-secondary-400/60 to-transparent"
		></div>
		<!-- Subtle cross texture -->
		<div
			class="absolute inset-0 opacity-[0.03]"
			style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;)"
		></div>
		<div class="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
			<div class="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
				<!-- Years -->
				<div class="reveal reveal-up text-center">
					<span
						class="block text-3xl font-normal tracking-tight text-secondary-400 sm:text-4xl lg:text-5xl"
						style="font-family: 'Playfair Display', Georgia, serif"
					>
						{counterYears}<span class="text-secondary-500/70">+</span>
					</span>
					<span
						class="mt-2 block text-xs font-medium tracking-[0.15em] text-primary-200/80 uppercase sm:text-sm"
						style="font-family: 'Plus Jakarta Sans', sans-serif"
					>
						{$t('homepage.stats.experienceLabel')}
					</span>
				</div>

				<!-- Properties -->
				<div class="reveal reveal-up reveal-d1 text-center">
					<span
						class="block text-3xl font-normal tracking-tight text-secondary-400 sm:text-4xl lg:text-5xl"
						style="font-family: 'Playfair Display', Georgia, serif"
					>
						{counterProperties}<span class="text-secondary-500/70">+</span>
					</span>
					<span
						class="mt-2 block text-xs font-medium tracking-[0.15em] text-primary-200/80 uppercase sm:text-sm"
						style="font-family: 'Plus Jakarta Sans', sans-serif"
					>
						{$t('homepage.stats.propertiesLabel')}
					</span>
				</div>

				<!-- Markets -->
				<div class="reveal reveal-up reveal-d2 text-center">
					<span
						class="block text-3xl font-normal tracking-tight text-secondary-400 sm:text-4xl lg:text-5xl"
						style="font-family: 'Playfair Display', Georgia, serif"
					>
						{counterMarkets}
					</span>
					<span
						class="mt-2 block text-xs font-medium tracking-[0.15em] text-primary-200/80 uppercase sm:text-sm"
						style="font-family: 'Plus Jakarta Sans', sans-serif"
					>
						{$t('homepage.stats.marketsLabel')}
					</span>
				</div>

				<!-- Satisfaction -->
				<div class="reveal reveal-up reveal-d3 text-center">
					<span
						class="block text-3xl font-normal tracking-tight text-secondary-400 sm:text-4xl lg:text-5xl"
						style="font-family: 'Playfair Display', Georgia, serif"
					>
						{counterSatisfaction}<span class="text-secondary-500/70">%</span>
					</span>
					<span
						class="mt-2 block text-xs font-medium tracking-[0.15em] text-primary-200/80 uppercase sm:text-sm"
						style="font-family: 'Plus Jakarta Sans', sans-serif"
					>
						{$t('homepage.stats.satisfactionLabel')}
					</span>
				</div>
			</div>
		</div>

		<!-- Bottom gold accent line -->
		<div
			class="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-secondary-400/60 to-transparent"
		></div>
	</section>

	<!-- Divider -->
	<AppSectionDivider variant="decorative" />

	<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	     ABOUT IMMOLUX
	     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
	<AppSection variant="primary">
		<div class="mx-auto max-w-6xl">
			<!-- Section Header -->
			<div class="mb-14 text-center" use:inview>
				<p
					class="reveal reveal-up mb-4 text-xs font-semibold tracking-[0.2em] text-primary-600 uppercase sm:text-sm dark:text-primary-400"
					style="font-family: 'Plus Jakarta Sans', sans-serif"
				>
					{$t('homepage.aboutUs.subtitle')}
				</p>
				<h2
					class="reveal reveal-up reveal-d1 mb-5 text-3xl font-normal tracking-tight text-dark-900 sm:text-4xl lg:text-5xl dark:text-light-50"
				>
					{$t('homepage.aboutUs.title')}
				</h2>
				<div
					class="reveal reveal-scale reveal-d2 mx-auto h-px w-16 bg-gradient-to-r from-transparent via-primary-400 to-transparent dark:via-primary-600"
				></div>
			</div>

			<!-- Info Cards Grid -->
			<div class="grid gap-6 md:grid-cols-2 lg:gap-8" use:inview>
				<!-- Location Card -->
				<div class="reveal reveal-up">
					<AppInfoCard icon={faMapMarkerAlt} iconColor="primary">
						<h3
							class="mb-2 text-lg font-medium text-dark-900 dark:text-light-50"
							style="font-family: 'Playfair Display', Georgia, serif"
						>
							{$t('homepage.aboutUs.location.title')}
						</h3>
						<p class="text-sm">
							{$t('homepage.aboutUs.location.description')}
						</p>
					</AppInfoCard>
				</div>

				<!-- Quality Card -->
				<div class="reveal reveal-up reveal-d1">
					<AppInfoCard icon={faStar} iconColor="secondary">
						<h3
							class="mb-2 text-lg font-medium text-dark-900 dark:text-light-50"
							style="font-family: 'Playfair Display', Georgia, serif"
						>
							{$t('homepage.aboutUs.dedication.title')}
						</h3>
						<p class="text-sm">
							{$t('homepage.aboutUs.dedication.description')}
						</p>
					</AppInfoCard>
				</div>

				<!-- Experience Card -->
				<div class="reveal reveal-up reveal-d2">
					<AppInfoCard icon={faGlobe} iconColor="success">
						<h3
							class="mb-2 text-lg font-medium text-dark-900 dark:text-light-50"
							style="font-family: 'Playfair Display', Georgia, serif"
						>
							{$t('homepage.aboutUs.experience.title')}
						</h3>
						<p class="text-sm">
							{$t('homepage.aboutUs.experience.description')}
						</p>
					</AppInfoCard>
				</div>

				<!-- Partner Card -->
				<div class="reveal reveal-up reveal-d3">
					<AppInfoCard icon={faHandshake} iconColor="info">
						<h3
							class="mb-2 text-lg font-medium text-dark-900 dark:text-light-50"
							style="font-family: 'Playfair Display', Georgia, serif"
						>
							{$t('homepage.aboutUs.partner.title')}
						</h3>
						<p class="mb-3 text-sm">
							{$t('homepage.aboutUs.partner.description', {
								values: { partner: $t('homepage.aboutUs.partner.partnerName') }
							})}
						</p>
						<a
							href="http://www.pacaconstruct.be"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 underline decoration-primary-200 underline-offset-4 transition-all hover:text-primary-700 hover:decoration-primary-400 dark:text-primary-400 dark:decoration-primary-800 dark:hover:text-primary-300"
						>
							www.pacaconstruct.be
							<span class="text-xs">&#8594;</span>
						</a>
					</AppInfoCard>
				</div>
			</div>
		</div>
	</AppSection>

	<!-- Divider -->
	<AppSectionDivider variant="decorative" />

	<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	     WHY PORTUGAL
	     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
	<AppSection variant="secondary">
		<div class="mx-auto max-w-6xl">
			<!-- Section Header -->
			<div class="mb-16 text-center" use:inview>
				<p
					class="reveal reveal-up mb-4 text-xs font-semibold tracking-[0.2em] text-primary-600 uppercase sm:text-sm dark:text-primary-400"
					style="font-family: 'Plus Jakarta Sans', sans-serif"
				>
					{$t('homepage.whyPortugal.subtitle')}
				</p>
				<h2
					class="reveal reveal-up reveal-d1 mb-5 text-3xl font-normal tracking-tight text-dark-900 sm:text-4xl lg:text-5xl dark:text-light-50"
				>
					{$t('homepage.whyPortugal.title')}
				</h2>
				<div
					class="reveal reveal-scale reveal-d2 mx-auto mb-8 h-px w-16 bg-gradient-to-r from-transparent via-secondary-400 to-transparent dark:via-secondary-600"
				></div>
				<p
					class="reveal reveal-up reveal-d3 mx-auto max-w-2xl text-base leading-relaxed text-dark-400 sm:text-lg dark:text-light-600"
				>
					{$t('homepage.whyPortugal.description')}
				</p>
			</div>

			<!-- Reasons Grid — 2x2 with staggered reveal -->
			<div class="grid gap-6 md:grid-cols-2 lg:gap-8" use:inview>
				<!-- Climate -->
				<div
					class="reveal reveal-left group relative overflow-hidden rounded-2xl border border-light-300/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-10 dark:border-dark-700/60 dark:bg-dark-800"
				>
					<!-- Decorative left bar -->
					<div
						class="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-secondary-300 via-secondary-400 to-secondary-300 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-secondary-600 dark:via-secondary-500 dark:to-secondary-600"
					></div>
					<div class="relative">
						<div class="mb-5 flex items-center gap-4">
							<div
								class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-50 transition-transform duration-300 group-hover:scale-110 dark:bg-secondary-950/40"
							>
								<FontAwesomeIcon icon={faSun} size="lg" class="text-secondary-600 dark:text-secondary-400" />
							</div>
							<h3
								class="text-lg font-normal text-dark-900 dark:text-light-50"
								style="font-family: 'Playfair Display', Georgia, serif"
							>
								{$t('homepage.whyPortugal.climate.title')}
							</h3>
						</div>
						<p class="text-[0.938rem] leading-relaxed text-dark-500 dark:text-light-500">
							{$t('homepage.whyPortugal.climate.description')}
						</p>
					</div>
				</div>

				<!-- Investment -->
				<div
					class="reveal reveal-right reveal-d1 group relative overflow-hidden rounded-2xl border border-light-300/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-10 dark:border-dark-700/60 dark:bg-dark-800"
				>
					<div
						class="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-primary-300 via-primary-400 to-primary-300 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-primary-600 dark:via-primary-500 dark:to-primary-600"
					></div>
					<div class="relative">
						<div class="mb-5 flex items-center gap-4">
							<div
								class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-950/40"
							>
								<FontAwesomeIcon icon={faChartLine} size="lg" class="text-primary-600 dark:text-primary-400" />
							</div>
							<h3
								class="text-lg font-normal text-dark-900 dark:text-light-50"
								style="font-family: 'Playfair Display', Georgia, serif"
							>
								{$t('homepage.whyPortugal.investment.title')}
							</h3>
						</div>
						<p class="text-[0.938rem] leading-relaxed text-dark-500 dark:text-light-500">
							{$t('homepage.whyPortugal.investment.description')}
						</p>
					</div>
				</div>

				<!-- Lifestyle -->
				<div
					class="reveal reveal-left reveal-d2 group relative overflow-hidden rounded-2xl border border-light-300/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-10 dark:border-dark-700/60 dark:bg-dark-800"
				>
					<div
						class="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-success-300 via-success-400 to-success-300 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-success-600 dark:via-success-500 dark:to-success-600"
					></div>
					<div class="relative">
						<div class="mb-5 flex items-center gap-4">
							<div
								class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-50 transition-transform duration-300 group-hover:scale-110 dark:bg-success-950/40"
							>
								<FontAwesomeIcon icon={faWineGlass} size="lg" class="text-success-600 dark:text-success-400" />
							</div>
							<h3
								class="text-lg font-normal text-dark-900 dark:text-light-50"
								style="font-family: 'Playfair Display', Georgia, serif"
							>
								{$t('homepage.whyPortugal.lifestyle.title')}
							</h3>
						</div>
						<p class="text-[0.938rem] leading-relaxed text-dark-500 dark:text-light-500">
							{$t('homepage.whyPortugal.lifestyle.description')}
						</p>
					</div>
				</div>

				<!-- Safety -->
				<div
					class="reveal reveal-right reveal-d3 group relative overflow-hidden rounded-2xl border border-light-300/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-10 dark:border-dark-700/60 dark:bg-dark-800"
				>
					<div
						class="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-info-300 via-info-400 to-info-300 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-info-600 dark:via-info-500 dark:to-info-600"
					></div>
					<div class="relative">
						<div class="mb-5 flex items-center gap-4">
							<div
								class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info-50 transition-transform duration-300 group-hover:scale-110 dark:bg-info-950/40"
							>
								<FontAwesomeIcon icon={faShieldHalved} size="lg" class="text-info-600 dark:text-info-400" />
							</div>
							<h3
								class="text-lg font-normal text-dark-900 dark:text-light-50"
								style="font-family: 'Playfair Display', Georgia, serif"
							>
								{$t('homepage.whyPortugal.safety.title')}
							</h3>
						</div>
						<p class="text-[0.938rem] leading-relaxed text-dark-500 dark:text-light-500">
							{$t('homepage.whyPortugal.safety.description')}
						</p>
					</div>
				</div>
			</div>
		</div>
	</AppSection>

	<!-- Divider -->
	<AppSectionDivider variant="decorative" />

	<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	     CONTACT
	     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
	<AppSection variant="primary">
		<div class="mx-auto max-w-3xl text-center" use:inview>
			<!-- Icon -->
			<div class="reveal reveal-scale mb-8 inline-block">
				<div
					class="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-700 shadow-lg dark:from-secondary-600 dark:to-secondary-800"
				>
					<FontAwesomeIcon icon={faEnvelope} size="2x" class="text-light-50" />
				</div>
			</div>

			<!-- Subtitle -->
			<p
				class="reveal reveal-up reveal-d1 mb-4 text-xs font-semibold tracking-[0.2em] text-secondary-700 uppercase sm:text-sm dark:text-secondary-400"
				style="font-family: 'Plus Jakarta Sans', sans-serif"
			>
				{$t('homepage.contact.subtitle')}
			</p>

			<!-- Title -->
			<h2
				class="reveal reveal-up reveal-d2 mb-5 text-3xl font-normal tracking-tight text-dark-900 sm:text-4xl lg:text-5xl dark:text-light-50"
			>
				{$t('homepage.contact.title')}
			</h2>

			<div
				class="reveal reveal-scale reveal-d3 mx-auto mb-10 h-px w-16 bg-gradient-to-r from-transparent via-secondary-400 to-transparent dark:via-secondary-600"
			></div>

			<!-- Contact Card -->
			<div class="reveal reveal-up reveal-d4 space-y-5">
				<div
					class="rounded-2xl border border-light-300/80 bg-white p-10 shadow-sm transition-all duration-300 hover:shadow-md md:p-12 dark:border-dark-700/60 dark:bg-dark-800"
				>
					<p class="mb-8 text-sm leading-relaxed text-dark-500 dark:text-light-500">
						{$t('homepage.contact.interested')}
					</p>

					<a
						href="mailto:info@immolux.pt"
						class="group inline-flex items-center gap-3 rounded-xl bg-primary-600 px-8 py-4 text-sm font-semibold text-light-50 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg md:px-10 md:py-4.5 dark:bg-primary-700 dark:hover:bg-primary-600"
						style="font-family: 'Plus Jakarta Sans', sans-serif"
					>
						<FontAwesomeIcon
							icon={faEnvelope}
							class="text-xs transition-transform duration-300 group-hover:scale-110"
						/>
						<span class="tracking-wide">info@immolux.pt</span>
					</a>
				</div>

				<!-- Secondary Info -->
				<div
					class="rounded-2xl border border-primary-200/60 bg-primary-50/50 p-7 dark:border-primary-900/40 dark:bg-primary-950/20"
				>
					<p class="text-sm leading-relaxed text-dark-500 dark:text-light-500">
						{$t('homepage.contact.publishAnnouncement')}
					</p>
				</div>
			</div>
		</div>
	</AppSection>
</div>
