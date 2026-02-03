<script lang="ts">
	export let progress = 0; // 0 to 1 for the width
</script>

<div class="aurora-track">
	<div class="aurora-fill" style:transform="scaleX({progress})">
		<div class="aurora-glow"></div>
	</div>
</div>

<style>
	.aurora-track {
		position: fixed;
		bottom: -2px;
		left: 0px;
		width: 100%;
		opacity: 0.5;
		height: 3px; /* Slightly thicker for better blur impact */
		background: rgba(255, 255, 255, 0.05);
		z-index: 100;
		overflow: visible;
		backdrop-filter: blur(4px);
	}

	.aurora-fill {
		height: 100%;
		width: 100%;
		transform-origin: left;
		position: relative;
		transition: transform 0.1s ease-out;
		border-radius: 10px;
		filter: blur(5px);
		opacity: 0.3; /* Increased slightly to balance the blur */

		/* The Automatic Color Rotation */
		animation: auroraColorCycle 20s infinite linear;
	}

	.aurora-glow {
		position: absolute;
		top: 50%;
		right: 0;
		transform: translateY(-50%);
		width: 80px;
		height: 24px;
		filter: blur(10px);
		opacity: 0.2;

		/* Syncs with parent fill color */
		background: radial-gradient(circle, currentColor 0%, transparent 70%);
		animation:
			pulse 3s infinite ease-in-out,
			auroraColorCycle 20s infinite linear;
	}

	/* Standardizes the color cycle across the element */
	@keyframes auroraColorCycle {
		0%,
		100% {
			background-color: rgb(var(--blue-rgb));
			color: rgba(var(--blue-rgb), 0.8);
		}
		33% {
			background-color: rgb(var(--pink-rgb));
			color: rgba(var(--pink-rgb), 0.8);
		}
		66% {
			background-color: rgb(var(--green-rgb));
			color: rgba(var(--green-rgb), 0.8);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: translateY(-50%) scale(1);
			opacity: 0.2;
		}
		50% {
			transform: translateY(-50%) scale(1.3, 2);
			opacity: 0.5;
		}
	}
</style>
