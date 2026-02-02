<script lang="ts">
	import { onMount } from 'svelte';
	import { handleGlobalMouseMove } from '$lib/stores';

	// Components
	import GooeyBackground from '$lib/components/GooeyBackground.svelte';
	import FactCloud from '$lib/components/FactCloud.svelte';
	import ScrollSection from '$lib/components/ScrollSection.svelte';
	import WordReveal from '$lib/components/WordReveal.svelte';
	import GridCell from '$lib/components/GridCell.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Logo from '$lib/components/Logo.svelte';

	// Data
	import { CLINICAL_FACTS, NARRATIVE_CONTENT, PERSONAS, BREAKTHROUGHS } from '$lib/constants';

	let activeProgress = 0;

	function handleMainNarrative(e: CustomEvent) {
		activeProgress = e.detail.progress;
	}

	onMount(() => {
		window.addEventListener('mousemove', handleGlobalMouseMove);
		return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
	});
</script>

<ThemeToggle />

<GooeyBackground />
<FactCloud facts={CLINICAL_FACTS} scrollProgress={activeProgress} />

<main>
	<ScrollSection id="intro" heightPx={1200} startVisible={true} endBuffer={0.1} let:progress>
		<Logo {progress} />
	</ScrollSection>

	<ScrollSection
		id="track1"
		heightPx={3200}
		endBuffer={0.4}
		on:progress={handleMainNarrative}
		let:progress
	>
		<WordReveal lines={NARRATIVE_CONTENT.top} {progress} />
	</ScrollSection>

	<ScrollSection id="grid1" heightPx={1800} endBuffer={0.1} let:progress>
		<div class="grid-container">
			<div class="identity-grid">
				{#each PERSONAS as p}
					<GridCell type="identity" label={p.label} />
				{/each}
			</div>
		</div>
	</ScrollSection>

	<ScrollSection
		id="track2"
		heightPx={3200}
		endBuffer={0.4}
		on:progress={handleMainNarrative}
		let:progress
	>
		<WordReveal lines={NARRATIVE_CONTENT.bottom} {progress} />
	</ScrollSection>

	<ScrollSection id="grid2" heightPx={2200} endBuffer={0.1} let:progress>
		<div class="grid-container">
			<div class="breakthrough-grid">
				{#each BREAKTHROUGHS as b}
					<GridCell type="uniform">
						<span class="breakthrough-title">{b.title}</span>
						<p class="breakthrough-desc">{b.desc}</p>
					</GridCell>
				{/each}
			</div>
		</div>
	</ScrollSection>

	<ScrollSection
		id="track3"
		heightPx={2800}
		endBuffer={0.4}
		endVisible={true}
		on:progress={handleMainNarrative}
		let:progress
	>
		<WordReveal lines={NARRATIVE_CONTENT.final} {progress} />
	</ScrollSection>
</main>

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
		--fs-large: clamp(1.8rem, 4.5vw, 3.4rem);
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
		max-width: 1100px;
		padding: 0 24px;
		margin: 0 auto;
		display: flex;
		justify-content: center;
	}

	.identity-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 16px;
		width: 100%;
	}

	.breakthrough-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		width: 100%;
	}

	@media (max-width: 768px) {
		.breakthrough-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
