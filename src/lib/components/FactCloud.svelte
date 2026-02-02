<script lang="ts">
	import { mouseCoords } from '$lib/stores';

	export let facts: string[] = [];
	export let scrollProgress = 0;

	const cloudItems = facts.map((text, i) => ({
		id: i,
		text,
		x: Math.random() * 100,
		y: Math.random() * 100,
		depth: 0.2 + Math.random() * 0.8,
		opacity: 0.05 + Math.random() * 0.25,
		scale: 0.8 + Math.random() * 0.4
	}));
</script>

<div class="cloud-layer">
	{#each cloudItems as item (item.id)}
		<div
			class="fact"
			style="
            left: {item.x}%; 
            top: {item.y}%; 
            opacity: {item.opacity};
            transform: translate3d(
                calc({$mouseCoords.x} * {item.depth} * -100px), 
                calc(({$mouseCoords.y} * {item.depth} * -50px) + ({scrollProgress} * {item.depth} * -400px)), 
                0
            ) scale({item.scale});
        "
		>
			{item.text}
		</div>
	{/each}
</div>

<style>
	.cloud-layer {
		position: fixed;
		inset: 0;
		z-index: 3;
		pointer-events: none;
		overflow: hidden;
	}

	.fact {
		position: absolute;
		font-family: ui-monospace, monospace;
		font-size: 0.7rem;
		color: var(--muted);
		white-space: nowrap;
		will-change: transform;
	}
</style>
