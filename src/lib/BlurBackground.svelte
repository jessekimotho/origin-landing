<script>
	import { onMount } from 'svelte';

	let bubbleEl;
	let containerEl;

	let targetX = 0;
	let targetY = 0;
	let currentX = 0;
	let currentY = 0;

	onMount(() => {
		if (!containerEl || !bubbleEl) return;

		// We still calculate bounds to offset the mouse position correctly
		const bounds = containerEl.getBoundingClientRect();

		function onMouseMove(event) {
			targetX = event.clientX - bounds.left;
			targetY = event.clientY - bounds.top;
		}

		function animate() {
			const ease = 0.1; // Adjust this to change smoothness
			currentX += (targetX - currentX) * ease;
			currentY += (targetY - currentY) * ease;

			// translate3d is more performant than translate
			bubbleEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

			requestAnimationFrame(animate);
		}

		// FIX 1: Listen on 'window' so other elements don't block the movement
		window.addEventListener('mousemove', onMouseMove);
		requestAnimationFrame(animate);

		return () => {
			window.removeEventListener('mousemove', onMouseMove);
		};
	});
</script>

<div class="gradient-bg" bind:this={containerEl}>
	<svg>
		<filter id="goo">
			<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
			<feColorMatrix
				in="blur"
				mode="matrix"
				values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
				result="goo"
			/>
			<feComposite in="SourceGraphic" in2="goo" operator="atop" />
		</filter>
	</svg>

	<div class="gradients-container">
		<div class="g1"></div>
		<div class="g2"></div>
		<div class="g3"></div>
		<div class="g4"></div>
		<div class="g5"></div>
		<div class="interactive" bind:this={bubbleEl}>
			<div class="core"></div>
		</div>
	</div>
</div>

<style>
	:root {
		--color-blue-rgb: 96, 165, 250;
		--color-pink-rgb: 232, 121, 249;
		--color-green-rgb: 94, 234, 212;
	}

	.gradient-bg {
		width: 100%;
		height: 100%;
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
	}

	svg {
		width: 0;
		height: 0;
	}

	.gradients-container {
		filter: url(#goo) blur(30px);
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		opacity: 0.3;
	}

	.g1,
	.g2,
	.g3,
	.g4,
	.g5 {
		width: 60%;
		height: 60%;
		opacity: 0.7;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		position: absolute;
		mix-blend-mode: hard-light;
		border-radius: 50%;
		animation-timing-function: ease-in-out;
	}

	.g1 {
		background: radial-gradient(
			circle,
			rgba(var(--color-blue-rgb), 0.8) 0%,
			rgba(var(--color-blue-rgb), 0) 50%
		);
		animation: moveVertical 20s infinite;
		transform-origin: center;
	}

	.g2 {
		background: radial-gradient(
			circle,
			rgba(var(--color-pink-rgb), 0.8) 0%,
			rgba(var(--color-pink-rgb), 0) 50%
		);
		animation: moveInCircle 18s reverse infinite;
		transform-origin: 25% 50%;
	}

	.g3 {
		background: radial-gradient(
			circle,
			rgba(var(--color-green-rgb), 0.8) 0%,
			rgba(var(--color-green-rgb), 0) 50%
		);
		animation: moveInCircle 30s infinite;
		transform-origin: 75% 50%;
	}

	.g4 {
		background: radial-gradient(
			circle,
			rgba(var(--color-green-rgb), 0.8) 0%,
			rgba(var(--color-green-rgb), 0) 50%
		);
		animation: moveHorizontal 25s infinite;
		transform-origin: 35% 50%;
	}

	.g5 {
		background: radial-gradient(
			circle,
			rgba(var(--color-pink-rgb), 0.8) 0%,
			rgba(var(--color-pink-rgb), 0) 50%
		);
		width: 120%;
		height: 120%;
		animation: moveInCircle 22s infinite;
		transform-origin: 20% 75%;
	}

	.interactive {
		width: 250px;
		height: 250px;
		position: absolute;
		/* FIX 2: Explicitly set top/left to 0 so the transform math is consistent */
		top: 0;
		left: 0;
		/* We keep the initial transform, though JS will overwrite it immediately */
		transform: translate3d(-50%, -50%, 0);
		background: radial-gradient(
			circle,
			rgba(var(--color-green-rgb), 1) 0%,
			rgba(var(--color-green-rgb), 0.3) 60%
		);
		opacity: 0.8;
		will-change: transform;
		pointer-events: none;
		filter: blur(12px);
		border: 1px solid rgba(var(--color-blue-rgb), 0.4);
		box-shadow: 0 0 40px rgba(var(--color-blue-rgb), 0.3);
	}

	.interactive .core {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background-color: rgba(var(--color-green-rgb), 0.9);
		box-shadow: 0 0 10px rgba(var(--color-green-rgb), 0.5);
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	@keyframes moveInCircle {
		0% {
			transform: translate(-50%, -50%) rotate(0deg);
		}
		50% {
			transform: translate(-50%, -50%) rotate(180deg);
		}
		100% {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}

	@keyframes moveVertical {
		0% {
			transform: translate(-50%, -40%);
		}
		50% {
			transform: translate(-50%, 60%);
		}
		100% {
			transform: translate(-50%, -40%);
		}
	}

	@keyframes moveHorizontal {
		0% {
			transform: translate(-40%, -50%);
		}
		50% {
			transform: translate(60%, -50%);
		}
		100% {
			transform: translate(-40%, -50%);
		}
	}
</style>
