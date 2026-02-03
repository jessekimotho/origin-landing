<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	export let heightPx = 2000;
	export let id = '';
	export let endBuffer = 0.2;
	export let startVisible = false;
	export let endVisible = false;

	const dispatch = createEventDispatcher();
	let container: HTMLElement;
	let rawScrollProgress = 0;

	$: animProgress = Math.min(rawScrollProgress / (1 - endBuffer), 1);

	$: opacity = (() => {
		if (animProgress > 0.92) return endVisible ? 1 : (1 - animProgress) / 0.08;
		if (animProgress < 0.1) return startVisible ? 1 : animProgress / 0.1;
		return 1;
	})();

	$: blurValue = (() => {
		if (animProgress > 0.92) return endVisible ? 0 : ((animProgress - 0.92) / 0.08) * 15;
		if (animProgress < 0.1) return startVisible ? 0 : (1 - animProgress / 0.1) * 15;
		return 0;
	})();

	$: scaleValue = 0.99 + opacity * 0.01;

	/**
	 * STACKING CONTEXT FIX:
	 * We only apply the filter and transform strings if they aren't at their default values.
	 * This restores the backdrop-filter functionality for children during the 'Hold' phase.
	 */
	$: filterStyle = blurValue > 0 ? `blur(${blurValue}px)` : 'none';
	$: transformStyle = scaleValue < 0.999 || scaleValue > 1.001 ? `scale(${scaleValue})` : 'none';

	function handleScroll() {
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const totalScrollable = heightPx - window.innerHeight;
		rawScrollProgress = Math.min(Math.max(-rect.top / totalScrollable, 0), 1);
		dispatch('progress', { id, progress: animProgress });
	}

	onMount(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<section bind:this={container} style="height: {heightPx}px;" class="scroll-track">
	<div
		class="sticky-viewport"
		style:opacity
		style:filter={filterStyle}
		style:transform={transformStyle}
	>
		<slot progress={animProgress} />
	</div>
</section>
