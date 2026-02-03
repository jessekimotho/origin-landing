<script lang="ts">
	import { mouseCoords } from '$lib/stores';
	import { onMount } from 'svelte';

	export let scrollProgress = 0;

	// Categorized Fact Pools
	const pool = {
		burden: [
			'Chronic metabolic dysfunction now precedes clinical diagnosis by up to a decade, hiding within standard blood panels while cellular damage compounds.',
			'Insulin resistance often begins in the liver and skeletal muscle years before blood glucose levels cross the threshold for diagnosis.',
			'Chronic disease accounts for 71% of all deaths globally, yet most systems remain optimized for reactive symptom management.',
			'The biological "weathering" of chronic stress accelerates telomere shortening, effectively aging the immune system prematurely.'
		],
		breakthroughs: [
			'The scalability of precision CRISPR-Cas9 editing offers a definitive pivot from symptom management to the permanent resolution of root-cause genetic drivers.',
			'By synthesizing continuous biomarker streams into digital twins, we can simulate therapeutic outcomes with high-fidelity before a dose is administered.',
			'Global healthcare systems are transitioning toward proactive sensing, where wearable bio-interfaces detect systemic shifts 48 hours before physiological symptoms emerge.',
			'Epigenetic aging clocks now allow us to measure the biological impact of lifestyle interventions with molecular precision.'
		],
		final: [
			'Individual participation in decentralized research networks is the primary catalyst for accelerating the "bench-to-bedside" timeline.',
			'The democratization of health data empowers communities to fund and fast-track the cures that traditional markets overlook.',
			'Your biological data is the most valuable contribution to the collective fight against metabolic decay.'
		]
	};

	// The 4 slots (Top 2 for Burden, Next 2 for Breakthroughs, Final for Action)
	let points = [
		{ x: 4, y: 12, start: 0.05, end: 0.3, depth: 1.2 },  // Slot 0: Burden
		{ x: 70, y: 18, start: 0.25, end: 0.55, depth: 0.8 }, // Slot 1: Burden
		{ x: 12, y: 80, start: 0.5, end: 0.8, depth: 1.5 },   // Slot 2: Breakthrough
		{ x: 70, y: 78, start: 0.75, end: 0.98, depth: 1.0 }  // Slot 3: Breakthrough / Final
	];

	let activeFacts: string[] = [];
	let w = 0;
	let h = 0;

	function shuffle(array: string[]) {
		return [...array].sort(() => Math.random() - 0.5);
	}

	function getTwinkle(scroll: number, start: number, end: number) {
		const fadeLength = 0.08;
		if (scroll < start || scroll > end) return 0;
		if (scroll > start + fadeLength && scroll < end - fadeLength) return 1;
		if (scroll <= start + fadeLength) return (scroll - start) / fadeLength;
		return (end - scroll) / fadeLength;
	}

	onMount(() => {
		w = window.innerWidth;
		h = window.innerHeight;

		// Select 2 from Burden, 1 from Breakthrough, 1 from Final
		const burdenSelection = shuffle(pool.burden).slice(0, 2);
		const breakthroughSelection = shuffle(pool.breakthroughs).slice(0, 1);
		const finalSelection = shuffle(pool.final).slice(0, 1);

		activeFacts = [...burdenSelection, ...breakthroughSelection, ...finalSelection];

		// Shuffle the coordinates of the first 2 slots so Burden appears in different corners
		const firstTwoPoints = shufflePoints(points.slice(0, 2));
		const lastTwoPoints = shufflePoints(points.slice(2, 4));
		points = [...firstTwoPoints, ...lastTwoPoints];
	});

	function shufflePoints(pts: any[]) {
		return pts.sort(() => Math.random() - 0.5);
	}
</script>

<div class="background-container" bind:clientWidth={w} bind:clientHeight={h}>
	<div class="star-field">
		{#each points as pt, i}
			{@const twinkle = getTwinkle(scrollProgress, pt.start, pt.end)}

			<div
				class="star-fact-container"
				style:left="{pt.x}%"
				style:top="{pt.y}%"
				style:opacity={Math.max(0.02, twinkle)}
				style:filter="blur({(1 - twinkle) * 20}px)"
				style:transform="
				translate( calc({$mouseCoords.x} * {pt.depth} * -80px), calc({$mouseCoords.y} * {pt.depth} * -40px)
				) translate(0, -50%) scale({0.95 + twinkle * 0.1})
				"
			>
				<div class="pulse-core" style:opacity={twinkle > 0.5 ? 1 : 0.4}></div>
				<p class="fact-text" class:in-focus={twinkle === 1}>
					{activeFacts[i] || ''}
				</p>
			</div>
		{/each}
	</div>
</div>

<style>
	.background-container {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
	}

	.star-field {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		opacity: 0.5;
	}

	.star-fact-container {
		position: absolute;
		width: 420px;
		display: flex;
		align-items: flex-start;
		gap: 24px;
		transition:
			opacity 0.8s ease,
			filter 0.4s cubic-bezier(0.23, 1, 0.32, 1);
		will-change: filter, transform, opacity;
	}

	.fact-text {
		font-family: 'Helvetica Neue', Helvetica, sans-serif;
		font-size: 0.95rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.7);
		text-align: left;
		font-weight: 300;
		letter-spacing: 0.01em;
		margin: 0;
		transition: color 0.4s ease;
	}

	.fact-text.in-focus {
		color: #ffffff;
		text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
	}

	.pulse-core {
		flex-shrink: 0;
		width: 5px;
		height: 5px;
		background: #fff;
		border-radius: 50%;
		margin-top: 8px;
		box-shadow: 0 0 15px #fff;
		animation: star-breath 4s infinite ease-in-out;
		transition: opacity 0.5s ease;
	}

	@keyframes star-breath {
		0%, 100% { transform: scale(1); opacity: 0.4; }
		50% { transform: scale(2.5); opacity: 1; }
	}
</style>