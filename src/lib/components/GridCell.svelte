<script lang="ts">
	import { onMount, tick } from 'svelte';
	import RoleModal from './RoleModal.svelte';

	export let label: string = '';
	export let type: 'identity' | 'uniform' = 'identity';
	export let revealProgress: number = 1; // Default to visible if not passed

	const roleStyles: Record<string, { border: string; bg: string; text: string }> = {
		Donor: { border: '#38bdf8', bg: '#14445aa3', text: '#b7e9ff' },
		Investor: { border: '#4ade80', bg: '#163a24a3', text: '#c2ffd9' },
		Policymaker: { border: '#60a5fa', bg: '#1e3a8aa3', text: '#bfdbfe' },
		'Public Figure': { border: '#ffffff', bg: '#3f3f46a3', text: '#fafafa' },
		'Content Creator': { border: '#facc15', bg: '#3e3612a3', text: '#fff1b7' },
		'Health Player': { border: '#a78bfa', bg: '#2e1f4aa3', text: '#e9dfff' },
		Patient: { border: '#22d3ee', bg: '#103e46a3', text: '#b7f4ff' },
		'Family Member': { border: '#f472b6', bg: '#4a1a35a3', text: '#ffdbed' },
		'Research Engineer': { border: '#fb923c', bg: '#442614a3', text: '#ffe4d1' },
		default: { border: '#64748b', bg: '#0f172aa3', text: '#f1f5f9' }
	};

	$: style = roleStyles[label] || roleStyles.default;
	$: article = /^[aeiou]/i.test(label) ? 'an' : 'a';

	let prefixEl: HTMLSpanElement;
	let shiftAmount = 0;
	let isModalOpen = false;

	async function calculateShift() {
		await tick();
		if (prefixEl) {
			shiftAmount = (prefixEl.offsetWidth + 8) / 2;
		}
	}

	onMount(calculateShift);
	$: (label, calculateShift());
</script>

<div
	class="cell {type}-cell"
	on:click={() => type === 'identity' && (isModalOpen = true)}
	style="
        --active-border: {style.border}; 
        --active-bg: {style.bg}; 
        --active-text: {style.text};
        --shift: {shiftAmount}px;

        /* GAUSSIAN BLUR FADE ENGINE */
        opacity: {revealProgress};
        filter: blur({(1 - revealProgress) * 20}px);
        transform: translateY({(1 - revealProgress) * 30}px);
    "
>
	<div class="hover-glow"></div>
	<div class="cell-content-wrapper">
		{#if type === 'identity'}
			<div class="identity-layout">
				<div class="sizer" aria-hidden="true">I am {article} {label}</div>
				<div class="animator">
					<span class="prefix" bind:this={prefixEl}>I am {article}</span>
					<span class="cell-label">{label}</span>
				</div>
			</div>
		{:else}
			<slot />
		{/if}
	</div>
</div>

<RoleModal isOpen={isModalOpen} {label} {style} {article} on:close={() => (isModalOpen = false)} />

<style>
	.cell {
		position: relative;
		overflow: hidden;
		isolation: isolate;
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(40px);
		-webkit-backdrop-filter: blur(40px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		transition:
			background 0.4s ease,
			border-color 0.4s ease;
		cursor: pointer;
		display: inline-flex;
		will-change: transform, opacity, filter;
	}

	.cell:hover {
		background: var(--active-bg);
		border-color: var(--active-border);
	}

	.hover-glow {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background: radial-gradient(circle at center, var(--active-border), transparent 85%);
		opacity: 0;
		transition: opacity 0.5s ease;
	}

	.cell:hover .hover-glow {
		opacity: 0.15;
	}

	.identity-layout {
		display: grid;
		grid-template-areas: 'content';
		place-items: center;
		padding: 0 1.25rem;
		height: 48px;
	}

	.sizer {
		grid-area: content;
		white-space: nowrap;
		visibility: hidden;
		pointer-events: none;
		font-weight: 500;
		padding-right: 0.5rem;
	}

	.animator {
		grid-area: content;
		display: flex;
		align-items: center;
		white-space: nowrap;
		transform: translateX(calc(var(--shift) * -1));
		transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.cell:hover .animator {
		transform: translateX(0);
	}

	.prefix {
		font-weight: 300;
		color: #ffffff;
		opacity: 0;
		margin-right: 0.4rem;
		transform: translateX(-10px);
		transition:
			opacity 0.3s ease,
			transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.cell:hover .prefix {
		opacity: 1;
		transform: translateX(0);
	}

	.cell-label {
		letter-spacing: 0.04em;
		color: #ffffffb5;
		transition: color 0.3s ease;
		font-weight: 500;
	}

	.cell:hover .cell-label {
		color: var(--active-text);
	}
	.identity-cell {
		flex: 0 0 auto;
	}
	.uniform-cell {
		min-height: 120px;
		padding: 24px;
		text-align: center;
		width: 100%;
	}
</style>
