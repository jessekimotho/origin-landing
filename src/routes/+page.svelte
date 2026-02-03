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
	import AuroraProgress from '$lib/components/AuroraProgress.svelte';
	import RoleModal from '$lib/components/RoleModal.svelte';

	// 1. GLOBAL SCROLL STATE
	let y = 0;
	let innerHeight = 0;
	let scrollHeight = 0;

	// Modal State for Final CTA
	let isGeneralModalOpen = false;
	const generalRoleStyle = { border: '#ffffff', bg: 'rgba(255,255,255,0.1)', text: '#ffffff' };

	// 2. TIMELINE UTILITIES
	const getProgress = (scroll: number, start: number, end: number) => {
		return Math.min(Math.max((scroll - start) / (end - start), 0), 1);
	};

	$: overallProgress = scrollHeight > 0 ? y / (scrollHeight - innerHeight) : 0;

	// --- MILESTONES ---
	$: introProgress = getProgress(y, 0, 800);
	$: introOpacity = 1 - getProgress(y, 600, 900);

	$: t1ScrollStart = 900;
	$: t1ScrollEnd = 3500;
	$: t1Progress = getProgress(y, t1ScrollStart, t1ScrollEnd);
	$: t1TextReveal = getProgress(t1Progress, 0, 0.6);
	$: t1GridEnter = getProgress(t1Progress, 0.5, 0.9);
	$: t1Exit = getProgress(t1Progress, 0.9, 1);

	$: t2ScrollStart = 3800;
	$: t2ScrollEnd = 6500;
	$: t2Progress = getProgress(y, t2ScrollStart, t2ScrollEnd);
	$: t2TextReveal = getProgress(t2Progress, 0, 0.5);
	$: t2GridEnter = getProgress(t2Progress, 0.4, 0.8);
	$: t2Exit = getProgress(t2Progress, 0.9, 1);

	$: finalStart = 6800;
	$: finalEnd = 8500;
	$: finalProgress = getProgress(y, finalStart, finalEnd);

	// 3. SEO JSON-LD
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Actualfood',
		url: 'https://actualfood.com',
		description:
			'Accelerating breakthroughs against chronic disease through technology and community.',
		knowsAbout: ['Health Innovation', 'Biotechnology', 'Chronic Disease Research']
	};
	const jsonLdString = `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`;

	onMount(() => {
		scrollHeight = document.documentElement.scrollHeight;
		window.addEventListener('mousemove', handleGlobalMouseMove);
		return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
	});
</script>

<svelte:window bind:scrollY={y} bind:innerHeight bind:outerHeight={scrollHeight} />
<svelte:head>
	<title>Actualfood | Breakthroughs Against Chronic Disease</title>
	<meta
		name="description"
		content="Actualfood is a mission-driven tech company focused on solving chronic disease."
	/>
	{@html jsonLdString}
</svelte:head>
<ThemeToggle />
<GooeyBackground />
<FactCloud facts={CLINICAL_FACTS} scrollProgress={t1Progress + t2Progress} />
<AuroraProgress progress={overallProgress} />

<main>
	<div class="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
		{#if y < 1000}
			<div style:opacity={introOpacity} style:transform="scale({1 + introProgress * 0.05})">
				<Logo progress={introProgress} />
			</div>
		{/if}

		{#if t1Progress > 0 && t1Progress < 1}
			<section class="stage-container" aria-label="Our Mission" style:opacity={1 - t1Exit}>
				<h1 class="sr-only">Actualfood is a movement against chronic disease.</h1>
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
			</section>
		{/if}

		{#if t2Progress > 0 && t2Progress < 1}
			<section
				class="stage-container"
				aria-label="Medical Breakthroughs"
				style:opacity={1 - t2Exit}
			>
				<h2 class="sr-only">Our breakthroughs in medical technology.</h2>
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
			</section>
		{/if}

		{#if finalProgress > 0}
			<section class="stage-container" aria-label="Final Call">
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

	<div class="relative" style="height: 9000px;"></div>
</main>

<RoleModal
	isOpen={isGeneralModalOpen}
	label="Interested"
	article=""
	style={generalRoleStyle}
	on:close={() => (isGeneralModalOpen = false)}
/>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: var(--bg);
		color: var(--text);
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		overflow-x: hidden;
	}
	:global(html) {
		--bg: #09090b;
		--text: #ffffff;
		--blue-rgb: 56, 189, 248;
		--pink-rgb: 232, 121, 249;
		--green-rgb: 34, 197, 94;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
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

	.cta-wrapper {
		margin-top: -20px;
	}

	.get-started {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: white;
		padding: 12px 36px;
		border-radius: 100px;
		font-family: 'Exposure', serif;
		font-size: 1.2rem;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.get-started:hover {
		background: white;
		color: black;
		transform: scale(1.05);
	}

	.identity-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		width: 100%;
		max-width: 900px;
		margin-top: -30px;
	}

	.grid-container {
		width: 100%;
		max-width: 800px;
		padding: 0 24px;
		margin: 0 auto;
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
