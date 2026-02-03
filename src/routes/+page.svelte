<script lang="ts">
	import { onMount } from 'svelte';
	import { handleGlobalMouseMove, mouseCoords } from '$lib/stores';
	import { NARRATIVE_CONTENT, PERSONAS } from '$lib/constants';

	// Components
	import GooeyBackground from '$lib/components/GooeyBackground.svelte';
	import WordReveal from '$lib/components/WordReveal.svelte';
	import GridCell from '$lib/components/GridCell.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import AuroraProgress from '$lib/components/AuroraProgress.svelte';
	import RoleModal from '$lib/components/RoleModal.svelte';

	let y = 0;
	let innerHeight = 0;
	let scrollHeight = 0;

	const pools = {
		burden: [
			'Chronic metabolic dysfunction now precedes clinical diagnosis by up to a decade.',
			'Insulin resistance often begins in the liver years before blood glucose levels spike.',
			'Chronic disease accounts for 71% of all deaths globally.',
			'Metabolic health is the primary driver of all-cause mortality in the modern age.',
			'Liver fat accumulation is the hidden driver of early metabolic decay.',
			'Cellular damage compounds long before it reflects in standard blood panels.',
			'Precision nutrition is impossible without real-time glucose monitoring.',
			'The biological cost of stress is measurable at the chromosomal level.'
		],
		breakthroughs: [
			'Precision CRISPR-Cas9 editing offers a permanent resolution to genetic drivers.',
			'Digital twins allow us to simulate therapeutic outcomes with high-fidelity.',
			'Wearable bio-interfaces detect systemic shifts 48 hours before symptoms appear.',
			'Continuous biomarker streams are replacing static annual blood panels.',
			'AI Digital Twins can now predict disease onset with 94% accuracy.',
			'Targeted gene therapies are moving from rare diseases to chronic care.',
			'Biosensors now track inflammation cycles with millisecond precision.',
			'Decentralized trials accelerate drug discovery by up to 5 years.'
		],
		final: [
			'Your biological data is the most valuable currency in the fight for longevity.',
			'Collective data contribution is the fastest path to metabolic resilience.',
			'Decentralized research puts the power of discovery back in your hands.',
			'The future of medicine is proactive, personalized, and patient-driven.'
		]
	};

	let activeSlots: any[] = [];

	function shuffle<T>(array: T[]): T[] {
		return [...array].sort(() => Math.random() - 0.5);
	}

	onMount(() => {
		scrollHeight = document.documentElement.scrollHeight;
		window.addEventListener('mousemove', handleGlobalMouseMove);

		// 1. Randomize Content
		const burdenSelection = shuffle(pools.burden).slice(0, 2);
		const breakthroughSelection = shuffle(pools.breakthroughs).slice(0, 2);
		const finalSelection = shuffle(pools.final).slice(0, 1);

		// 2. Randomize Universal Locations
		const locationPool = shuffle([
			{ x: 5, y: 15 }, // Top Left
			{ x: 82, y: 18 }, // Top Right
			{ x: 8, y: 75 }, // Bottom Left
			{ x: 75, y: 80 }, // Bottom Right
			{ x: 45, y: 12 } // Top Center
		]);

		// 3. Randomize Parallax Intensity
		const depths = shuffle([0.7, 1.0, 1.2, 1.5, 1.8]);

		// 4. Map Narrative Timing to Random Locations
		activeSlots = [
			{ ...locationPool[0], text: burdenSelection[0], start: 0.1, end: 0.35, depth: depths[0] },
			{ ...locationPool[1], text: burdenSelection[1], start: 0.18, end: 0.4, depth: depths[1] },
			{
				...locationPool[2],
				text: breakthroughSelection[0],
				start: 0.5,
				end: 0.8,
				depth: depths[2]
			},
			{
				...locationPool[3],
				text: breakthroughSelection[1],
				start: 0.6,
				end: 0.8,
				depth: depths[3]
			},
			{ ...locationPool[4], text: finalSelection[0], start: 0.7, end: 1, depth: depths[4] }
		];
	});

	const getProgress = (scroll: number, start: number, end: number) => {
		return Math.min(Math.max((scroll - start) / (end - start), 0), 1);
	};

	function getClarity(progress: number, start: number, end: number) {
		const fade = 0.08;
		if (progress < start || progress > end) return 0;
		if (progress > start + fade && progress < end - fade) return 1;
		if (progress <= start + fade) return (progress - start) / fade;
		return (end - progress) / fade;
	}

	$: overallProgress = scrollHeight > 0 ? y / (scrollHeight - innerHeight) : 0;

	// Narrative Sections
	$: t1Progress = getProgress(y, 1500, 6000);
	$: t1TextReveal = getProgress(t1Progress, 0, 0.3);
	$: t1Exit = getProgress(t1Progress, 0.95, 1);

	$: t2Progress = getProgress(y, 6500, 10500);
	$: t2TextReveal = getProgress(t2Progress, 0, 0.4);
	$: t2Exit = getProgress(t2Progress, 0.95, 1);

	$: finalProgress = getProgress(y, 11000, 13500);
	$: buttonOpacity = getProgress(finalProgress, 0.7, 1);

	let isGeneralModalOpen = false;
</script>

<svelte:window bind:scrollY={y} bind:innerHeight bind:outerHeight={scrollHeight} />

<GooeyBackground />
<AuroraProgress progress={overallProgress} />

<div class="star-container pointer-events-none fixed inset-0 z-0" style="contain: strict;">
	{#each activeSlots as slot}
		{@const clarity = getClarity(overallProgress, slot.start, slot.end)}
		<div
			class="star-fact-container"
			style:left="{slot.x}%"
			style:top="{slot.y}%"
			style:opacity={Math.max(0.01, clarity)}
			style:filter="blur({(1 - clarity) * 10}px)"
			style:transform="translate3d(calc({$mouseCoords.x} * {slot.depth} * -40px), calc({$mouseCoords.y}
			* {slot.depth} * -20px), 0) translate(0, -50%) scale({0.92 + clarity * 0.08})"
		>
			<p class="fact-text" class:in-focus={clarity === 1}>{slot.text}</p>
		</div>
	{/each}
</div>

<main>
	<div class="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
		{#if y < 1400}
			<div style:opacity={1 - getProgress(y, 900, 1300)}>
				<Logo progress={getProgress(y, 0, 1300)} />
			</div>
		{/if}

		{#if t1Progress > 0 && t1Progress < 1}
			<section class="stage-container" style:opacity={1 - t1Exit}>
				<WordReveal lines={NARRATIVE_CONTENT.top} progress={t1TextReveal} />

				<div class="identity-grid-wrapper pointer-events-auto mt-8">
					<div class="identity-grid">
						{#each PERSONAS as p, i}
							<GridCell
								type="identity"
								label={p.label}
								revealProgress={getProgress(t1Progress, 0.15 + i * 0.03, 0.55 + i * 0.03)}
							/>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		{#if t2Progress > 0 && t2Progress < 1}
			<section class="stage-container" style:opacity={1 - t2Exit}>
				<WordReveal lines={NARRATIVE_CONTENT.bottom} progress={t2TextReveal} />
			</section>
		{/if}

		{#if finalProgress > 0}
			<section class="stage-container">
				<WordReveal lines={NARRATIVE_CONTENT.final} progress={finalProgress} />
				<div class="cta-wrapper pointer-events-auto mt-4" style:opacity={buttonOpacity}>
					<button class="get-started" on:click={() => (isGeneralModalOpen = true)}>
						Get Started
					</button>
				</div>
			</section>
		{/if}
	</div>

	<div class="relative" style="height: 14000px;"></div>
</main>

<RoleModal
	isOpen={isGeneralModalOpen}
	label="Interested"
	on:close={() => (isGeneralModalOpen = false)}
/>

<style>
	:global(body) {
		margin: 0;
		background: #09090b;
		color: #fff;
		font-family: 'Helvetica Neue', sans-serif;
		overflow-x: hidden;
		overscroll-behavior: none;
	}

	.star-fact-container {
		position: absolute;
		width: 320px;
		display: flex;
		align-items: flex-start;
		gap: 20px;
		will-change: transform, opacity;
		backface-visibility: hidden;
	}

	/* GPU-Friendly Border */
	.star-fact-container::before {
		content: '';
		flex-shrink: 0;
		width: 2px;
		height: 100%;
		min-height: 40px;
		background: rgba(255, 255, 255, 0.4);
	}

	.fact-text {
		font-size: 0.85rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 300;
		transition: color 0.4s linear;
		margin: 0;
	}

	.fact-text.in-focus {
		color: #fff;
		text-shadow: 0 2px 15px rgba(255, 255, 255, 0.2);
	}

	.stage-container {
		position: absolute;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		contain: content;
	}

	.identity-grid-wrapper {
		transform: translateZ(0); /* Force GPU */
		will-change: opacity;
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.identity-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
		max-width: 900px;
		contain: layout; /* Prevent global reflows */
	}

	.get-started {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #fff;
		padding: 14px 40px;
		border-radius: 100px;
		font-family: 'Exposure', serif;
		cursor: pointer;
		transition: 0.3s;
	}

	.get-started:hover {
		background: #fff;
		color: #000;
		transform: scale(1.05);
	}

	.star-container {
		opacity: 0.8;
	}
</style>
