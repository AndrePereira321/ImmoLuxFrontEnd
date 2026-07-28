<script lang="ts">
	/**
	 * A single hand-drawn azulejo.
	 *
	 * Every motif is constructed on the same 96-unit grid with the same stroke
	 * weights and only 45°/90° angles, which is what makes the four read as one
	 * set rather than as four icons.
	 *
	 * The corner arcs are full circles centred on the tile corners — the viewBox
	 * crops each to a quarter. When four tiles are laid up in a panel those
	 * quarters meet across the grout and close into whole rings, the way a real
	 * padrão tile continues into its neighbour.
	 */

	type Motif = 'sol' | 'mercado' | 'mesa' | 'abrigo';

	interface Props {
		motif: Motif;
		class?: string;
	}

	let { motif, class: className = '' }: Props = $props();

	const INK = 1.3; // the painted line
	const HAIR = 1; // corner arcs and construction lines

	const CORNERS: [number, number][] = [
		[0, 0],
		[96, 0],
		[0, 96],
		[96, 96]
	];
	const CORNER_DOTS: [number, number][] = [
		[16.3, 16.3],
		[79.7, 16.3],
		[16.3, 79.7],
		[79.7, 79.7]
	];
	const PETALS = [0, 45, 90, 135, 180, 225, 270, 315];
</script>

<svg
	viewBox="0 0 96 96"
	class={`h-full w-full ${className}`}
	fill="none"
	stroke="currentColor"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	focusable="false"
>
	<!-- Corner rings: cropped to quarters by the viewBox, completed by the neighbouring tile -->
	<g stroke-width={HAIR} opacity="0.6">
		{#each CORNERS as [cx, cy] (`${cx}-${cy}`)}
			<circle {cx} {cy} r="28" />
			<circle {cx} {cy} r="18" />
		{/each}
	</g>
	<g fill="currentColor" stroke="none" opacity="0.55">
		{#each CORNER_DOTS as [cx, cy] (`${cx}-${cy}`)}
			<circle {cx} {cy} r="2" />
		{/each}
	</g>

	<!-- The motif. Scaled from its own centre so hover never nudges the corner rings. -->
	<g class="azulejo-motif" style="transform-box: fill-box; transform-origin: center">
		{#if motif === 'sol'}
			<!-- Roseta: eight petals round a hub. The sun as a tile paints it. -->
			<g stroke-width={INK}>
				{#each PETALS as angle (angle)}
					<path transform="rotate({angle} 48 48)" d="M48 35 C43 30 43 21 48 16 C53 21 53 30 48 35 Z" />
				{/each}
				<circle cx="48" cy="48" r="11" />
			</g>
			<circle cx="48" cy="48" r="3.4" fill="currentColor" stroke="none" />
		{:else if motif === 'mercado'}
			<!-- Ponta de diamante: the faceted relief tile. Value, built up in layers. -->
			<g stroke-width={INK}>
				<path d="M48 17 L79 48 L48 79 L17 48 Z" />
				<path d="M48 28 L68 48 L48 68 L28 48 Z" />
			</g>
			<path d="M48 38 L58 48 L48 58 L38 48 Z" stroke-width={HAIR} />
			<g fill="currentColor" stroke="none">
				<circle cx="48" cy="48" r="2.6" />
				<circle cx="48" cy="22.5" r="1.7" />
				<circle cx="73.5" cy="48" r="1.7" />
				<circle cx="48" cy="73.5" r="1.7" />
				<circle cx="22.5" cy="48" r="1.7" />
			</g>
		{:else if motif === 'mesa'}
			<!-- Albarrada: the handled flower vase, the most painted subject in
			     Portuguese tile after the star -->
			<g stroke-width={INK}>
				<path d="M35 50 C30 60 31 71 40 75 L56 75 C65 71 66 60 61 50" />
				<path d="M27 50 L69 50" />
				<path d="M42 75 L54 75 L57 80 L39 80 Z" />
				<path d="M35 54 C27 56 27 65 34 67" />
				<path d="M61 54 C69 56 69 65 62 67" />
				<path d="M48 50 L48 29" />
				<path d="M46 50 C39 45 34 38 32 31" />
				<path d="M50 50 C57 45 62 38 64 31" />
				<circle cx="48" cy="24" r="5" />
				<circle cx="30" cy="27" r="3.4" />
				<circle cx="66" cy="27" r="3.4" />
			</g>
			<g stroke-width={HAIR}>
				<path d="M47 45 C41 45 37 42 36 38 C41 38 46 41 47 45 Z" />
				<path d="M49 45 C55 45 59 42 60 38 C55 38 50 41 49 45 Z" />
			</g>
			<g fill="currentColor" stroke="none">
				<circle cx="48" cy="24" r="2" />
				<circle cx="30" cy="27" r="1.4" />
				<circle cx="66" cy="27" r="1.4" />
			</g>
		{:else if motif === 'abrigo'}
			<!-- Shelter: a pediment over an arched doorway, the shape of every
			     house they put up -->
			<g stroke-width={INK}>
				<path d="M17 52 L48 25 L79 52" />
				<path d="M28 52 L48 34 L68 52" />
				<path d="M36 79 L36 67 A12 12 0 0 1 60 67 L60 79" />
				<path d="M26 79 L70 79" />
			</g>
			<circle cx="48" cy="45" r="2.6" fill="currentColor" stroke="none" />
		{/if}
	</g>
</svg>

<style>
	.azulejo-motif {
		transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	:global(.azulejo-cell:hover) .azulejo-motif {
		transform: scale(1.035);
	}

	@media (prefers-reduced-motion: reduce) {
		.azulejo-motif {
			transition: none;
		}

		:global(.azulejo-cell:hover) .azulejo-motif {
			transform: none;
		}
	}
</style>
