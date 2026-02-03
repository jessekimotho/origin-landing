<script lang="ts">
	import { onMount } from 'svelte';
	import { handleGlobalMouseMove } from '$lib/stores';

	// Data
	import { CLINICAL_FACTS, NARRATIVE_CONTENT, PERSONAS, BREAKTHROUGHS } from '$lib/constants';

	// Components
	import GooeyBackground from '$lib/components/GooeyBackground.svelte';
	import FactCloud from '$lib/components/FactCloud.svelte';
	import WordReveal from '$lib/components/WordReveal.svelte';
	import GridCell from '$lib/components/GridCell.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	// 1. GLOBAL SCROLL STATE
	let y = 0;
	let innerHeight = 0;

	// 2. TIMELINE UTILITIES
	// Maps a scroll range [start, end] to a [0, 1] progress value
	const getProgress = (scroll: number, start: number, end: number) => {
		return Math.min(Math.max((scroll - start) / (end - start), 0), 1);
	};

	// --- MILESTONES (Pixel values) ---

	// Section 0: Logo Intro
	$: introProgress = getProgress(y, 0, 800);
	$: introOpacity = 1 - getProgress(y, 600, 900);

	// Section 1: Narrative 1 + Identity Grid
	$: t1ScrollStart = 900;
	$: t1ScrollEnd = 3500;
	$: t1Progress = getProgress(y, t1ScrollStart, t1ScrollEnd);

	// Inside T1: Break down the "Reveal" vs "Grid Appearance"
	$: t1TextReveal = getProgress(t1Progress, 0, 0.6); // Finish words by 60% of section
	$: t1GridEnter = getProgress(t1Progress, 0.5, 0.9); // Start grid at 50%
	$: t1Exit = getProgress(t1Progress, 0.9, 1); // Fade out whole section at end

	// Section 2: Narrative 2 + Breakthroughs
	$: t2ScrollStart = 3800;
	$: t2ScrollEnd = 6500;
	$: t2Progress = getProgress(y, t2ScrollStart, t2ScrollEnd);

	$: t2TextReveal = getProgress(t2Progress, 0, 0.5);
	$: t2GridEnter = getProgress(t2Progress, 0.4, 0.8);
	$: t2Exit = getProgress(t2Progress, 0.9, 1);

	// Section 3: Final Call
	$: finalStart = 6800;
	$: finalEnd = 8000;
	$: finalProgress = getProgress(y, finalStart, finalEnd);

	onMount(() => {
		window.addEventListener('mousemove', handleGlobalMouseMove);
		return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
	});
</script>

<svelte:window bind:scrollY={y} bind:innerHeight />

<ThemeToggle />
<GooeyBackground />
<FactCloud facts={CLINICAL_FACTS} scrollProgress={t1Progress + t2Progress} />

<div class="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
	{#if y < 1000}
		<div style:opacity={introOpacity} style:transform="scale({1 + introProgress * 0.05})">
			<Logo progress={introProgress} />
		</div>
	{/if}

	{#if t1Progress > 0 && t1Progress < 1}
		<div class="stage-container" style:opacity={1 - t1Exit}>
			<div class="flex w-full flex-col items-center">
				<div
					style:transform="translateY({t1GridEnter * -40}px)"
					style:opacity={1 - t1GridEnter * 0.5}
				>
					<WordReveal lines={NARRATIVE_CONTENT.top} progress={t1TextReveal} />
				</div>

				<div
					class="identity-grid-wrapper pointer-events-auto"
					style:opacity={t1GridEnter}
					style:transform="translateY({(1 - t1GridEnter) * 60}px) scale({0.95 +
						t1GridEnter * 0.05})"
				>
					<div class="identity-grid">
						{#each PERSONAS as p}
							<GridCell type="identity" label={p.label} />
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if t2Progress > 0 && t2Progress < 1}
		<div class="stage-container" style:opacity={1 - t2Exit}>
			<div class="flex w-full flex-col items-center">
				<div style:transform="translateY({t2GridEnter * -30}px)">
					<WordReveal lines={NARRATIVE_CONTENT.bottom} progress={t2TextReveal} />
				</div>

				<div
					class="grid-container pointer-events-auto"
					style:opacity={t2GridEnter}
					style:transform="translateY({(1 - t2GridEnter) * 40}px)"
				>
					<div class="breakthrough-grid">
						{#each BREAKTHROUGHS as b}
							<GridCell type="uniform">
								<span class="breakthrough-title">{b.title}</span>
								<p class="breakthrough-desc">{b.desc}</p>
							</GridCell>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if finalProgress > 0}
		<div class="stage-container">
			<WordReveal lines={NARRATIVE_CONTENT.final} progress={finalProgress} />
		</div>
	{/if}
</div>

<div class="relative" style="height: 9000px;"></div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: var(--bg);
		color: var(--text);
		font-family: 'Inter', system-ui, sans-serif;
		overflow-x: hidden;
	}

	:global(html) {
		--bg: #09090b;
		--text: #ffffff;
		--muted: rgba(255, 255, 255, 0.4);
		--card: rgba(255, 255, 255, 0.04);
		--card-hover: rgba(255, 255, 255, 0.08);
		--border: rgba(255, 255, 255, 0.1);
		--border-strong: rgba(255, 255, 255, 0.25);

		/* Brand Colors for Blobs & Shimmer */
		--blue-rgb: 56, 189, 248;
		--pink-rgb: 232, 121, 249;
		--green-rgb: 34, 197, 94;

		--fs-medium: clamp(1.2rem, 2.5vw, 2.2rem);
		--fs-large: clamp(1.8rem, 4vw, 3.4rem);
		--text-shadow: 0 10px 26px rgba(0, 0, 0, 0.55);
	}

	:global(html[data-theme='light']) {
		--bg: #f6f7fb;
		--text: #0c0c14;
		--muted: rgba(0, 0, 0, 0.5);
		--card: rgba(0, 0, 0, 0.03);
		--border: rgba(0, 0, 0, 0.1);
		--border-strong: rgba(0, 0, 0, 0.18);
		--text-shadow: none;
	}

	main {
		position: relative;
		z-index: 10;
	}

	.grid-container {
		width: 100%;
		max-width: 600px;
		padding: 0 24px;
		margin: 0 auto;
		display: flex;
		justify-content: center;
	}

	.stage-container {
		position: absolute;
		width: 100%;
		max-width: 1200px;
		padding: 0 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		will-change: transform, opacity;
	}

	.identity-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		width: 100%;
		max-width: 900px;
		margin-top: -40px;
	}

	.breakthrough-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
		width: 100%;
	}

	@media (max-width: 768px) {
		.breakthrough-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
