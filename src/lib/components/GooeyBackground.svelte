<script lang="ts">
	import { mouseCoords } from '$lib/stores';
	import { onMount } from 'svelte';

	let bubbleX = 0;
	let bubbleY = 0;
	let bubbleTargetX = 0;
	let bubbleTargetY = 0;
	let animationFrameId: number;

	function animateBubble() {
		const ease = 0.12;
		bubbleTargetX = window.innerWidth / 2 + $mouseCoords.x * window.innerWidth;
		bubbleTargetY = window.innerHeight / 2 + $mouseCoords.y * window.innerHeight;

		bubbleX += (bubbleTargetX - bubbleX) * ease;
		bubbleY += (bubbleTargetY - bubbleY) * ease;

		animationFrameId = requestAnimationFrame(animateBubble);
	}

	onMount(() => {
		animateBubble();
		return () => {
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
		};
	});
</script>

<div class="background-container">
	<div class="back-g"></div>

	<div class="gradient-bg">
		<svg style="position:fixed; width:0; height:0;">
			<filter id="goo">
				<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
				<feColorMatrix
					in="blur"
					mode="matrix"
					values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
				/>
			</filter>
		</svg>

		<div class="gradients-wrapper">
			<div class="g1"></div>
			<div class="g2"></div>
			<div class="g3"></div>
			<div class="g4"></div>
			<div class="g5"></div>
			<div
				class="interactive"
				style="transform: translate3d({bubbleX}px, {bubbleY}px, 0) translate(-50%, -50%);"
			></div>
		</div>
	</div>
</div>

<style>
	.background-container {
		position: fixed;
		inset: 0;
		z-index: 0;
		opacity: 0.3;
		pointer-events: none;
		background: var(--bg);
	}

	.back-g {
		position: absolute;
		inset: 0;
		z-index: 1;
		box-shadow: inset 0 0 200px 30px rgba(0, 0, 0, 0.75);
	}

	.gradient-bg {
		width: 100vw;
		height: 100vh;
		position: absolute;
		overflow: hidden;
		filter: url(#goo) blur(40px);
		opacity: 0.25;
		z-index: 2;
	}

	.gradients-wrapper {
		width: 100%;
		height: 100%;
	}

	.g1,
	.g2,
	.g3,
	.g4,
	.g5 {
		position: absolute;
		width: 80%;
		height: 80%;
		top: 10%;
		left: 10%;
		border-radius: 50%;
		mix-blend-mode: hard-light;
		will-change: transform;
	}

	.g1 {
		background: radial-gradient(circle at center, rgba(var(--blue-rgb), 0.8) 0, transparent 50%);
		animation: moveVertical 30s ease infinite;
	}
	.g2 {
		background: radial-gradient(circle at center, rgba(var(--pink-rgb), 0.8) 0, transparent 50%);
		transform-origin: calc(50% - 400px);
		animation: moveInCircle 20s reverse infinite;
	}
	.g3 {
		background: radial-gradient(circle at center, rgba(var(--green-rgb), 0.8) 0, transparent 50%);
		transform-origin: calc(50% + 400px);
		animation: moveInCircle 40s linear infinite;
	}
	.g4 {
		background: radial-gradient(circle at center, rgba(var(--blue-rgb), 0.8) 0, transparent 50%);
		animation: moveHorizontal 40s ease infinite;
		opacity: 0.7;
	}
	.g5 {
		background: radial-gradient(circle at center, rgba(var(--pink-rgb), 0.8) 0, transparent 50%);
		width: 100%;
		height: 100%;
		animation: moveInCircle 20s ease infinite;
	}

	.interactive {
		position: absolute;
		background: radial-gradient(circle at center, rgba(var(--green-rgb), 0.8) 0, transparent 50%);
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		opacity: 0.7;
		mix-blend-mode: hard-light;
		will-change: transform;
	}

	@keyframes moveInCircle {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	@keyframes moveVertical {
		0%,
		100% {
			transform: translateY(-50%);
		}
		50% {
			transform: translateY(50%);
		}
	}
	@keyframes moveHorizontal {
		0%,
		100% {
			transform: translateX(-50%) translateY(-10%);
		}
		50% {
			transform: translateX(50%) translateY(10%);
		}
	}
</style>
