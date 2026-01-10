<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faGlobe, faHouse, faMapLocationDot, faSearch } from '@fortawesome/free-solid-svg-icons';
	import { locale, locales } from 'svelte-i18n';
	import { Button, Card, Heading, Label, P, Select } from 'flowbite-svelte';
</script>

<div class="min-h-screen">
	<!-- Hero Section -->
	<section class="relative mb-12 rounded-3xl bg-primary-600 px-4 py-20 text-light-50 shadow-2xl dark:bg-primary-700">
		<div class="absolute inset-0 rounded-3xl bg-dark-950 opacity-10 dark:opacity-20"></div>
		<div class="relative z-10 mx-auto max-w-4xl text-center">
			<div class="mb-6">
				<FontAwesomeIcon icon={faHouse} size="4x" class="text-light-50 opacity-90" />
			</div>
			<Heading tag="h1" class="mb-6 text-light-50" customSize="text-5xl font-extrabold md:text-6xl lg:text-7xl">
				Welcome to ImmoLux
			</Heading>
			<P class="mb-8 text-xl font-light text-light-200 md:text-2xl">
				Discover your perfect home in the heart of Luxembourg
			</P>
			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<Button
					size="xl"
					color="light"
					class="border-0 bg-secondary-500 font-semibold text-light-50 shadow-lg transition-shadow hover:bg-secondary-600 hover:shadow-xl dark:bg-secondary-600 dark:hover:bg-secondary-700"
					href="/houses"
				>
					<FontAwesomeIcon icon={faSearch} class="mr-2" />
					Browse Properties
				</Button>
				<Button
					size="xl"
					class="border-0 bg-light-50 font-semibold text-primary-600 shadow-lg transition-shadow hover:bg-light-100 hover:shadow-xl dark:bg-light-100 dark:hover:bg-light-200"
				>
					<FontAwesomeIcon icon={faMapLocationDot} class="mr-2" />
					View Map
				</Button>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="mb-16">
		<Heading tag="h2" class="mb-12 text-center text-4xl font-bold text-dark-900 dark:text-light-50"
			>Why Choose ImmoLux?</Heading
		>
		<div class="grid gap-8 md:grid-cols-3">
			<Card
				class="border-t-4 border-primary-500 transition-shadow duration-300 hover:shadow-2xl dark:border-primary-400 dark:bg-dark-700"
			>
				<div class="mb-6 flex justify-center">
					<div class="rounded-full bg-primary-100 p-6 dark:bg-primary-900">
						<FontAwesomeIcon icon={faHouse} size="3x" class="text-primary-600 dark:text-primary-300" />
					</div>
				</div>
				<Heading tag="h3" class="mb-3 text-center text-2xl font-bold text-dark-900 dark:text-light-50"
					>Wide Selection</Heading
				>
				<P class="text-center text-lg leading-relaxed text-dark-300 dark:text-light-300">
					Browse through hundreds of premium properties across Luxembourg
				</P>
			</Card>

			<Card
				class="border-t-4 border-secondary-500 transition-shadow duration-300 hover:shadow-2xl dark:border-secondary-400 dark:bg-dark-700"
			>
				<div class="mb-6 flex justify-center">
					<div class="rounded-full bg-secondary-100 p-6 dark:bg-secondary-900">
						<FontAwesomeIcon icon={faSearch} size="3x" class="text-secondary-600 dark:text-secondary-300" />
					</div>
				</div>
				<Heading tag="h3" class="mb-3 text-center text-2xl font-bold text-dark-900 dark:text-light-50"
					>Smart Search</Heading
				>
				<P class="text-center text-lg leading-relaxed text-dark-300 dark:text-light-300">
					Find exactly what you're looking for with powerful advanced filters
				</P>
			</Card>

			<Card
				class="border-t-4 border-success-500 transition-shadow duration-300 hover:shadow-2xl dark:border-success-400 dark:bg-dark-700"
			>
				<div class="mb-6 flex justify-center">
					<div class="rounded-full bg-success-100 p-6 dark:bg-success-900">
						<FontAwesomeIcon icon={faMapLocationDot} size="3x" class="text-success-600 dark:text-success-300" />
					</div>
				</div>
				<Heading tag="h3" class="mb-3 text-center text-2xl font-bold text-dark-900 dark:text-light-50"
					>Location Based</Heading
				>
				<P class="text-center text-lg leading-relaxed text-dark-300 dark:text-light-300">
					Explore properties by location on an interactive map
				</P>
			</Card>
		</div>
	</section>

	<!-- Language Selector -->
	<section class="flex justify-center py-8">
		<Card class="w-full max-w-md shadow-lg dark:bg-dark-700">
			<div class="mb-4 flex items-center justify-center">
				<FontAwesomeIcon icon={faGlobe} size="2x" class="mr-3 text-primary-600 dark:text-primary-400" />
				<Heading tag="h3" class="text-2xl font-bold text-dark-900 dark:text-light-50">Language / Langue</Heading>
			</div>
			<Label for="locale-select" class="mb-2 font-medium text-dark-700 dark:text-light-200"
				>Choose your preferred language:</Label
			>
			<Select
				id="locale-select"
				bind:value={$locale}
				class="text-lg dark:border-dark-500 dark:bg-dark-600 dark:text-light-50"
			>
				{#each $locales as localeOption (localeOption)}
					<option value={localeOption}>{localeOption.toUpperCase()}</option>
				{/each}
			</Select>
		</Card>
	</section>
</div>
