<script lang="ts">
	import { onMount } from 'svelte';
	import { handleGlobalMouseMove } from '$lib/stores';
	import { CLINICAL_FACTS, NARRATIVE_CONTENT, PERSONAS, BREAKTHROUGHS } from '$lib/constants';

	import GooeyBackground from '$lib/components/GooeyBackground.svelte';
	import FactCloud from '$lib/components/FactCloud.svelte';
	import WordReveal from '$lib/components/WordReveal.svelte';
	import GridCell from '$lib/components/GridCell.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import AuroraProgress from '$lib/components/AuroraProgress.svelte';
	import RoleModal from '$lib/components/RoleModal.svelte';

	let y = 0;
	let innerHeight = 0;
	let scrollHeight = 0;

	let isGeneralModalOpen = false;
	const generalRoleStyle = { border: '#ffffff', bg: 'rgba(255,255,255,0.1)', text: '#ffffff' };

	// Helper to keep math clean
	const getProgress = (scroll: number, start: number, end: number) => {
		return Math.min(Math.max((scroll - start) / (end - start), 0), 1);
	};

	$: overallProgress = scrollHeight > 0 ? y / (scrollHeight - innerHeight) : 0;

	// --- TIMELINE DEFINITION (12,000px Runway) ---

	// 1. Intro Logo
	$: introProgress = getProgress(y, 0, 1200);
	$: introOpacity = 1 - getProgress(y, 800, 1200);

	// 2. Section 1 (Narrative + Personas)
	// We give this 4000px of "travel" time
	$: t1Progress = getProgress(y, 1500, 5500);
	$: t1TextReveal = getProgress(t1Progress, 0, 0.4);
	$: t1Exit = getProgress(t1Progress, 0.9, 1);

	// 3. Section 2 (Breakthroughs)
	// Starts after T1 is fully gone
	$: t2Progress = getProgress(y, 6000, 9500);
	$: t2TextReveal = getProgress(t2Progress, 0, 0.5);
	$: t2Exit = getProgress(t2Progress, 0.9, 1);

	// 4. Final CTA
	$: finalProgress = getProgress(y, 10000, 11500);

	onMount(() => {
		scrollHeight = document.documentElement.scrollHeight;
		window.addEventListener('mousemove', handleGlobalMouseMove);
	});
</script>

<svelte:window bind:scrollY={y} bind:innerHeight bind:outerHeight={scrollHeight} />

<GooeyBackground />
<FactCloud scrollProgress={overallProgress} />
<AuroraProgress progress={overallProgress} />

<main>
	<div class="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
		{#if y < 1300}
			<div style:opacity={introOpacity} style:transform="scale({1 + introProgress * 0.05})">
				<Logo progress={introProgress} />
			</div>
		{/if}

		{#if t1Progress > 0 && t1Progress < 1}
			<section class="stage-container" style:opacity={1 - t1Exit}>
				<div class="flex w-full flex-col items-center">
					<WordReveal lines={NARRATIVE_CONTENT.top} progress={t1TextReveal} />

					<div class="identity-grid pointer-events-auto">
						{#each PERSONAS as p, i}
							<GridCell
								type="identity"
								label={p.label}
								revealProgress={getProgress(t1Progress, 0.3 + i * 0.05, 0.7 + i * 0.05)}
							/>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		{#if t2Progress > 0 && t2Progress < 1}
			<section class="stage-container" style:opacity={1 - t2Exit}>
				<div class="flex w-full flex-col items-center">
					<WordReveal lines={NARRATIVE_CONTENT.bottom} progress={t2TextReveal} />
				</div>
			</section>
		{/if}

		{#if finalProgress > 0}
			<section class="stage-container">
				<WordReveal lines={NARRATIVE_CONTENT.final} progress={finalProgress} />
				<div
					class="cta-wrapper pointer-events-auto"
					style:opacity={finalProgress}
					style:transform="translateY({(1 - finalProgress) * 20}px)"
				>
					<button class="get-started" on:click={() => (isGeneralModalOpen = true)}>
						Get Started
					</button>
				</div>
			</section>
		{/if}
	</div>

	<div class="relative" style="height: 12000px;"></div>
</main>

<RoleModal
	isOpen={isGeneralModalOpen}
	label="Interested"
	article=""
	style={generalRoleStyle}
	on:close={() => (isGeneralModalOpen = false)}
/>

<style>
	:root {
		--bg: #09090b;
		--text: #ffffff;
		--blue-rgb: 56, 189, 248;
		--pink-rgb: 232, 121, 249;
		--green-rgb: 34, 197, 94;
	}
	:global(body) {
		margin: 0;
		background: #09090b;
		color: #fff;
		font-family: 'Helvetica Neue', sans-serif;
		overflow-x: hidden;
	}

	.stage-container {
		position: absolute;
		width: 100%;
		max-width: 1200px;
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
		gap: 12px;
		width: 100%;
		max-width: 900px;
		margin-top: 20px;
	}

	.get-started {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: white;
		padding: 14px 40px;
		margin-top: -20px;
		border-radius: 100px;
		font-family: 'Exposure', serif;
		font-size: 1.2rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.get-started:hover {
		background: white;
		color: black;
		transform: scale(1.05);
	}

	@media (max-width: 768px) {
		.breakthrough-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
