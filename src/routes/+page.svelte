<script lang="ts">
	import { onMount } from 'svelte';
	import { handleGlobalMouseMove, mouseCoords } from '$lib/stores';
	import { NARRATIVE_CONTENT, PERSONAS, FACT_POOLS } from '$lib/constants';

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

	let activeSlots: any[] = [];

	function shuffle<T>(array: T[]): T[] {
		return [...array].sort(() => Math.random() - 0.5);
	}

	function updateHeight() {
		scrollHeight = document.documentElement.scrollHeight;
	}

	onMount(() => {
		updateHeight();
		window.addEventListener('mousemove', handleGlobalMouseMove);

		const burdenSelection = shuffle(FACT_POOLS.burden).slice(0, 2);
		const breakthroughSelection = shuffle(FACT_POOLS.breakthroughs).slice(0, 2);
		const finalSelection = shuffle(FACT_POOLS.final).slice(0, 1);

		const locationPool = shuffle([
			{ x: 5, y: 15 },
			{ x: 82, y: 18 },
			{ x: 8, y: 75 },
			{ x: 75, y: 80 },
			{ x: 45, y: 12 }
		]);

		const depths = shuffle([0.7, 1.0, 1.2, 1.5, 1.8]);

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

	// --- LOGO PERSISTENCE ---
	$: logoMorphProgress = getProgress(y, 0, 1200);
	$: logoTopPosition = 50 - 44 * logoMorphProgress;

	// --- PROMPT VANISH ---
	$: promptFade = getProgress(y, 0, 400);
	$: promptOpacity = 1 - promptFade;
	$: promptBlur = promptFade * 20;
	$: promptTranslate = promptFade * -20;

	// --- SECTION 1 (IDENTITY) ---
	// Total Range
	$: t1Progress = getProgress(y, 1000, 8000); // 7000px duration

	// 1. SETTLING ENGINE (The "Come Up" Effect)
	// From 0% to 35% of the section scroll, we reduce the offset from 25vh to 0vh
	$: t1SettleProgress = getProgress(t1Progress, 0, 0.35);
	$: t1YOffset = (1 - t1SettleProgress) * 25; // result is in 'vh'

	// 2. TEXT & GRID TIMING
	$: t1TextReveal = getProgress(t1Progress, 0, 0.3); // Reveal text while rising
	$: gridReveal = getProgress(t1Progress, 0.25, 0.6); // Grid starts fading in as we settle

	// 3. EXIT
	$: t1Exit = getProgress(t1Progress, 0.85, 1);

	// --- SECTION 2 (BREAKTHROUGHS) ---
	$: t2Progress = getProgress(y, 8500, 13000);
	$: t2TextReveal = getProgress(t2Progress, 0, 0.4);
	$: t2Exit = getProgress(t2Progress, 0.9, 1);

	// --- FINAL SECTION ---
	$: finalProgress = getProgress(y, 13500, 16000);
	$: buttonOpacity = getProgress(finalProgress, 0.7, 1);

	let isGeneralModalOpen = false;
</script>

<svelte:window bind:scrollY={y} bind:innerHeight on:resize={updateHeight} />

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
			style:transform="translate3d(calc({$mouseCoords.x} * {slot.depth} * -40px), calc({$mouseCoords.y}
			* {slot.depth} * -20px), 0) translate(0, -50%) scale({0.92 + clarity * 0.08})"
		>
			<p class="fact-text" class:in-focus={clarity === 1}>{slot.text}</p>
		</div>
	{/each}
</div>

<main>
	<div
		class="pointer-events-none fixed top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center"
	>
		<div class="logo-wrapper" style="top: {logoTopPosition}%;">
			<Logo progress={logoMorphProgress} />
		</div>
		<div
			class="prompt"
			style="opacity: {promptOpacity}; filter: blur({promptBlur}px); transform: translateY({promptTranslate}px);"
		>
			Scroll BELOW to access the site
		</div>
	</div>

	<div class="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
		{#if t1Progress > 0 && t1Progress < 1}
			<section
				class="stage-container"
				style="
                    opacity: {1 - t1Exit};
                    filter: blur({t1Exit * 20}px);
                    transform: translateY({t1YOffset}vh) scale({1 - t1Exit * 0.05}) translateZ(0);
                "
			>
				<WordReveal lines={NARRATIVE_CONTENT.top} progress={t1TextReveal} />

				<div
					class="identity-grid-wrapper pointer-events-auto"
					style="opacity: {gridReveal}; filter: blur({(1 - gridReveal) * 20}px);"
				>
					<div class="identity-grid">
						{#each PERSONAS as p}
							<GridCell type="identity" label={p.label} />
						{/each}
					</div>
				</div>
			</section>
		{/if}

		{#if t2Progress > 0 && t2Progress < 1}
			<section
				class="stage-container"
				style:opacity={1 - t2Exit}
				style:filter="blur({t2Exit * 20}px)"
			>
				<WordReveal lines={NARRATIVE_CONTENT.bottom} progress={t2TextReveal} />
			</section>
		{/if}

		{#if finalProgress > 0}
			<section class="stage-container">
				<WordReveal lines={NARRATIVE_CONTENT.final} progress={finalProgress} />
				<div class="cta-wrapper pointer-events-auto" style:opacity={buttonOpacity}>
					<button class="get-started" on:click={() => (isGeneralModalOpen = true)}>
						Get Started
					</button>
				</div>
			</section>
		{/if}
	</div>

	<div class="relative" style="height: 18000px;"></div>
</main>

<RoleModal
	isOpen={isGeneralModalOpen}
	label="curious about Origin?"
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
	.logo-wrapper {
		position: absolute;
		transform: translateY(-50%);
		z-index: 50;
	}
	.prompt {
		position: absolute;
		bottom: 50px;
		font-size: 0.75rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
		pointer-events: none;
		animation: promptPulse 2s ease-in-out infinite;
		will-change: transform, opacity, filter;
	}
	@keyframes promptPulse {
		0%,
		100% {
			color: rgba(255, 255, 255, 0.3);
		}
		50% {
			color: rgba(255, 255, 255, 0.7);
		}
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
		margin: 0;
	}
	.stage-container {
		position: absolute;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		contain: content;
		will-change: opacity, transform, filter;
	}
	.identity-grid-wrapper {
		width: 100%;
		display: flex;
		justify-content: center;
		will-change: filter, opacity;
		backface-visibility: hidden;
	}
	.identity-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
		max-width: 900px;
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
		transition:
			background 0.3s,
			transform 0.3s;
	}
	.get-started:hover {
		background: #fff;
		color: #000;
		transform: scale(1.05);
	}
	.star-container {
		opacity: 0.8;
	}

	@media (max-width: 768px) {
		.star-fact-container {
			width: 200px;
			max-width: 40vw;
		}
		.fact-text {
			font-size: 0.75rem;
		}
		.prompt {
			font-size: 0.65rem;
			width: 90%;
			text-align: center;
			white-space: normal;
			line-height: 1.4;
		}
		.logo-wrapper {
			transform: translateY(-50%) scale(0.75);
		}
		.identity-grid {
			padding: 0 24px;
			width: 100%;
			box-sizing: border-box;
		}
	}

	@media (max-width: 480px) {
		.logo-wrapper {
			transform: translateY(-50%) scale(0.55);
		}
	}
</style>
