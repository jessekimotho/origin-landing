<script lang="ts">
	import { mouseCoords } from '$lib/stores';

	export let slot: {
		x: number;
		y: number;
		text: string;
		start: number;
		end: number;
		depth: number;
	};
	export let overallProgress: number;
	export let innerWidth: number;
	export let innerHeight: number;

	function getClarity(progress: number, start: number, end: number) {
		const fade = 0.08;
		if (progress < start || progress > end) return 0;
		if (progress > start + fade && progress < end - fade) return 1;
		if (progress <= start + fade) return (progress - start) / fade;
		return (end - progress) / fade;
	}

	$: clarity = getClarity(overallProgress, slot.start, slot.end);

	// Proximity Logic
	$: mx = ($mouseCoords.x + 0.5) * innerWidth;
	$: my = ($mouseCoords.y + 0.5) * innerHeight;
	$: sx = (slot.x / 100) * innerWidth;
	$: sy = (slot.y / 100) * innerHeight;
	$: dx = mx - sx;
	$: dy = my - sy;

	// Use 350 as the proximity radius
	$: dist = Math.sqrt(dx * dx + dy * dy);
	$: prox = Math.max(0, 1 - dist / 350);

	// Only apply proximity if the item is within its active timeline
	$: activeProx = clarity > 0.01 ? prox : 0;
</script>

<div
	class="star-fact-container"
	style:left="{slot.x}%"
	style:top="{slot.y}%"
	style:opacity={clarity}
	style:transform="translate3d(calc({$mouseCoords.x} * {slot.depth} * -40px), calc({$mouseCoords.y} *
	{slot.depth} * -20px), 0) translate(0, -50%) scale({0.92 + activeProx * 0.35})"
>
	<p
		class="fact-text"
		class:in-focus={clarity === 1}
		style:color="rgba(255, 255, 255, {0.5 + activeProx * 0.5})"
		style:text-shadow="0 0 {activeProx * 15}px rgba(255, 255, 255, {activeProx * 0.6})"
	>
		{slot.text}
	</p>
</div>

<style>
	.star-fact-container {
		position: absolute;
		width: 320px;
		display: flex;
		align-items: flex-start;
		gap: 20px;
		will-change: transform, opacity;
		backface-visibility: hidden;
		pointer-events: none; /* Ensure it doesn't block mouse interactions */
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
		transition:
			color 0.2s ease,
			text-shadow 0.2s ease;
	}

	@media (max-width: 768px) {
		.star-fact-container {
			width: 200px;
			max-width: 40vw;
		}
		.fact-text {
			font-size: 0.75rem;
		}
	}
</style>
