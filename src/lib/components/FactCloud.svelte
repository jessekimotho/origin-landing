<script lang="ts">
	import { mouseCoords } from '$lib/stores';
	import { onMount } from 'svelte';

	export let scrollProgress = 0;

	const facts = [
		'Chronic metabolic dysfunction now precedes clinical diagnosis by up to a decade, hiding within standard blood panels while cellular damage compounds.',
		'The scalability of precision CRISPR-Cas9 editing offers a definitive pivot from symptom management to the permanent resolution of root-cause genetic drivers.',
		'By synthesizing continuous biomarker streams into digital twins, we can simulate therapeutic outcomes with high-fidelity before a single dose is administered.',
		'Global healthcare systems are transitioning toward proactive sensing, where wearable bio-interfaces detect systemic shifts 48 hours before physiological symptoms emerge.'
	];

	// Wider ranges to ensure facts are "locked in" focus for longer
	const points = [
		{ x: 15, y: 22, start: 0.05, end: 0.3, depth: 1.2 },
		{ x: 75, y: 30, start: 0.25, end: 0.55, depth: 0.8 },
		{ x: 12, y: 68, start: 0.5, end: 0.8, depth: 1.5 },
		{ x: 70, y: 78, start: 0.75, end: 0.98, depth: 1.0 }
	];

	let w = 0;
	let h = 0;

	// PLATEAU LOGIC: Creates a window of 100% clarity
	function getTwinkle(scroll: number, start: number, end: number) {
		const fadeLength = 0.08; // Duration of the blur/unblur transition

		if (scroll < start || scroll > end) return 0;

		// If we are in the "middle" of the range, return 1 (Perfect Focus)
		if (scroll > start + fadeLength && scroll < end - fadeLength) return 1;

		// Handle the lead-in fade
		if (scroll <= start + fadeLength) {
			return (scroll - start) / fadeLength;
		}

		// Handle the lead-out fade
		return (end - scroll) / fadeLength;
	}

	onMount(() => {
		w = window.innerWidth;
		h = window.innerHeight;
	});
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
				<p class="fact-text" class:in-focus={twinkle === 1}>{facts[i]}</p>
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
	}

	.star-fact-container {
		position: absolute;
		width: 420px; /* Wider to prevent awkward wrapping */
		display: flex;
		align-items: flex-start;
		gap: 24px;
		/* Transition timing is key: snappy unblur, slow fade */
		transition:
			opacity 0.8s ease,
			filter 0.4s cubic-bezier(0.23, 1, 0.32, 1);
		will-change: filter, transform, opacity;
	}

	.fact-text {
		font-family: 'Helvetica Neue', Helvetica, sans-serif;
		font-size: 0.95rem; /* Larger font for readability */
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
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(2.5);
		}
	}
</style>
