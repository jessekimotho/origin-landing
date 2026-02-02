<script lang="ts">
	import { mouseCoords } from '$lib/stores';
	export let progress: number = 0;

	// Morph still overdrives to finish early (at 60% scroll)
	$: morphT = Math.min(progress / 0.6, 1);

	$: logoGap = 64 - morphT * 28;
	$: letterSpacing = 32 - morphT * 24;

	/** * VISIBILITY LOGIC:
	 * Starts at 1.0.
	 * Only starts fading out in the final 10% of the scroll section.
	 */
	$: opacity = progress > 0.9 ? (1 - progress) / 0.1 : 1;
</script>

<div class="logo-group" style="opacity: {opacity};">
	<div class="logo-mark" style="gap: {logoGap}px;">
		<div class="origin-logo">
			<div
				class="inner-circle"
				style="
                transform: translate(
                    calc(-50% + ({$mouseCoords.x} * 15px)), 
                    calc(-50% + ({$mouseCoords.y} * 15px))
                );
            "
			></div>
		</div>
		<div class="rest-of-word" style="letter-spacing: {letterSpacing}px;">ORIGIN</div>
	</div>
</div>

<style>
	.logo-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		will-change: opacity;
	}
	.logo-mark {
		display: flex;
		align-items: center;
		color: var(--text);
	}
	.origin-logo {
		width: 50px;
		height: 50px;
		border: 3px solid currentColor;
		border-radius: 50%;
		position: relative;
	}
	.inner-circle {
		position: absolute;
		width: 20px;
		height: 20px;
		border: 3px solid currentColor;
		border-radius: 50%;
		top: 50%;
		left: 50%;
		will-change: transform;
	}
	.rest-of-word {
		font-size: 20px;
		font-weight: 600;
		/* Ensure font color is sharp */
		color: var(--text);
	}
</style>
