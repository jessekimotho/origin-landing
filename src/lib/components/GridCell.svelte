<script lang="ts">
	import { pixelHover } from '$lib/pixelHover';

	export let label: string = '';
	export let type: 'identity' | 'uniform' = 'identity';

	// OG Persona Palettes
	const palettes: Record<string, string[]> = {
		Donor: ['#bae6fd', '#38bdf8', '#0284c7'],
		Investor: ['#fbcfe8', '#f472b6', '#db2777'],
		Policymaker: ['#bbf7d0', '#4ade80', '#16a34a'],
		'Content Creator': ['#fef08a', '#facc15', '#ca8a04'],
		Attorney: ['#ddd6fe', '#a78bfa', '#7c3aed'],
		default: ['#e3e3e3', '#a1a1aa', '#52525b']
	};

	$: colors = palettes[label] || palettes.default;
	$: activeColor = colors[1];
	$: article = /^[aeiou]/i.test(label) ? 'an' : 'a';
</script>

<div
	class="cell {type}-cell"
	style="--active-color: {activeColor}"
	use:pixelHover={{ gap: 6, speed: 0.035, colors }}
>
	<canvas class="pixel-bg"></canvas>

	<div class="inner-shadow"></div>

	<div class="cell-content-wrapper">
		{#if type === 'identity'}
			<div class="identity-layout">
				<span class="prefix">I am {article}</span>
				<span class="cell-label">{label}</span>
			</div>
		{:else}
			<slot />
		{/if}
	</div>
</div>

<style>
	.cell {
		position: relative;
		overflow: hidden;
		isolation: isolate;
		background: rgba(9, 9, 11, 0.35);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #e3e3e3;
		transition: all 0.6s cubic-bezier(0.2, 0, 0.2, 1);
		cursor: pointer;
	}

	.cell:hover {
		border-color: var(--active-color);
		transform: translateY(-4px);
		box-shadow: 0 12px 40px -10px rgba(0, 0, 0, 0.6);
	}

	.pixel-bg {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		opacity: 0.8;
	}

	.inner-shadow {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		/* Bloom effect mask */
		background: radial-gradient(circle at center, transparent 10%, rgba(9, 9, 11, 1) 90%);
		opacity: 0;
		transition: opacity 0.8s ease;
	}

	.cell:hover .inner-shadow {
		opacity: 0.7;
	}

	.cell-content-wrapper {
		position: relative;
		z-index: 2;
		pointer-events: none;
	}

	.identity-layout {
		display: flex;
		align-items: center;
		white-space: nowrap;
	}

	.prefix {
		font-weight: 300;
		color: #71717a;
		font-size: 0.95rem;
		max-width: 0;
		opacity: 0;
		overflow: hidden;
		transition: all 0.5s cubic-bezier(0.2, 0, 0.2, 1);
	}

	.cell:hover .prefix {
		max-width: 80px;
		opacity: 1;
		margin-right: 8px;
	}

	.cell-label {
		font-weight: 700;
		letter-spacing: 0.05em;
		font-size: 1.1rem;
		color: #a1a1aa;
		transition: color 0.3s ease;
	}

	.cell:hover .cell-label {
		color: #ffffff;
	}

	.identity-cell {
		flex: 1 1 auto;
		min-width: 220px;
		min-height: 95px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 40px;
	}

	.uniform-cell {
		min-height: 160px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		padding: 32px;
	}
</style>
