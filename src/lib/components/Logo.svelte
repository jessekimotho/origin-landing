<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	export let progress: number = 0;

	// --- Visual State Variables ---
	// Default to -45deg so the dot sits at "North East" (Top Right)
	let rotation = -45;
	let innerOffset = 32;
	let innerX = 0;
	let innerY = 0;

	let scaleAmount = 1;
	let outerSize = 80;
	let innerSize = 20;

	let outerBorder = 4;
	let innerBorder = 4;
	let shapeMorph = 0; // 0=Circle, 1=Squircle, 2=Sharp Square
	let opacityInner = 1;

	let skewX = 0;
	let skewY = 0;
	let scaleY = 1;

	let transitionTime = 0.8;
	let isDoingScience = false;

	// --- Idle Engine ---
	let lastInteractionTime = Date.now();
	let idleTimer: any;
	// Randomize idle time between 8s and 12s so it feels organic, not robotic
	let currentIdleThreshold = 8000 + Math.random() * 4000;

	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

	// --- The Trick Deck ---
	let trickDeck: number[] = [];
	const totalTricks = 20;

	function shuffleDeck() {
		trickDeck = Array.from({ length: totalTricks }, (_, i) => i);
		for (let i = trickDeck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[trickDeck[i], trickDeck[j]] = [trickDeck[j], trickDeck[i]];
		}
	}

	function resetState() {
		transitionTime = 1.2;

		// SMART RESET: Find the nearest -45deg equivalent so we don't spin wildly
		// We want the result to be congruent to -45 modulo 360
		const current = rotation;
		const target = -45;
		// Math magic to find shortest rotation path to -45
		const diff = ((target - current + 180) % 360) - 180;
		const shortestPath = ((target - current + 180) % 360) - 180;

		// Actually, simpler logic for CSS transitions:
		// Just snap to the closest multiple of 360 minus 45
		const turns = Math.round((rotation - -45) / 360);
		rotation = turns * 360 - 45;

		innerOffset = 32;
		innerX = 0;
		innerY = 0;
		scaleAmount = 1;
		outerSize = 80;
		innerSize = 20;
		outerBorder = 4;
		innerBorder = 4;
		shapeMorph = 0;
		opacityInner = 1;
		skewX = 0;
		skewY = 0;
		scaleY = 1;
	}

	function handleInteraction() {
		lastInteractionTime = Date.now();
		// Reset the threshold for next time to keep it unpredictable
		currentIdleThreshold = 8000 + Math.random() * 4000;
		runTrick();
	}

	async function runTrick() {
		if (isDoingScience) return;
		if (trickDeck.length === 0) shuffleDeck();

		isDoingScience = true;
		const trickId = trickDeck.pop();

		// Prepare for action
		transitionTime = 0.6;

		switch (trickId) {
			// --- GEOMETRIC & STRUCTURAL ---
			case 0: // "The Swap"
				transitionTime = 0.8;
				outerSize = 20;
				innerSize = 80;
				innerOffset = 0;
				await wait(1500);
				break;
			case 1: // "The Square Peg"
				transitionTime = 0.6;
				shapeMorph = 2;
				innerOffset = 0;
				await wait(1200);
				break;
			case 2: // "The Diamond"
				transitionTime = 0.8;
				shapeMorph = 2;
				rotation += 45;
				innerOffset = 0;
				await wait(1200);
				break;
			case 3: // "Squircle Calibration"
				transitionTime = 1.0;
				shapeMorph = 1;
				await wait(1200);
				break;
			case 4: // "The Eclipse"
				transitionTime = 1.5;
				innerOffset = 0;
				innerSize = 78;
				outerBorder = 1;
				await wait(1500);
				break;

			// --- PHYSICS ---
			case 5: // "Gravity Drop"
				transitionTime = 0.6;
				// Rotate to 0 temporarily so Y-axis creates a vertical drop
				const oldRot = rotation;
				rotation = 0;
				innerOffset = 0; // Center it first
				await wait(600);
				innerY = 50; // Drop
				await wait(600);
				transitionTime = 0.3;
				innerY = 20; // Bounce
				await wait(300);
				innerY = 50; // Land
				await wait(300);
				// Restore rotation handled by resetState
				break;
			case 6: // "Orbit Slingshot"
				transitionTime = 1.0;
				rotation -= 45;
				innerOffset = 10;
				await wait(1000);
				transitionTime = 0.5;
				rotation += 405;
				innerOffset = 60;
				await wait(600);
				break;
			case 7: // "Coin Flip"
				transitionTime = 0.8;
				scaleY = 0;
				await wait(800);
				scaleY = 1;
				await wait(600);
				break;
			case 8: // "Nothing But Net"
				transitionTime = 0.8;
				skewY = 15;
				innerY = -60;
				innerOffset = 0;
				await wait(100);
				innerY = 60;
				await wait(800);
				break;

			// --- BIOLOGICAL ---
			case 9: // "Mitosis"
				transitionTime = 0.5;
				innerOffset = 15;
				innerSize = 30;
				await wait(500);
				innerSize = 10;
				innerOffset = 50;
				await wait(800);
				break;
			case 10: // "Deep Breath"
				transitionTime = 2.0;
				scaleAmount = 1.2;
				innerSize = 25;
				await wait(2000);
				break;
			case 11: // "The Pulse"
				transitionTime = 1.2;
				outerBorder = 1;
				scaleAmount = 1.3;
				opacityInner = 0;
				await wait(1200);
				break;
			case 12: // "The Blink"
				transitionTime = 0.2;
				scaleY = 0.1;
				await wait(200);
				scaleY = 1;
				await wait(200);
				break;

			// --- MECHANICAL ---
			case 13: // "Lens Focus"
				transitionTime = 0.4;
				rotation += 90;
				scaleAmount = 0.8;
				await wait(400);
				rotation -= 10;
				scaleAmount = 1;
				await wait(300);
				break;
			case 14: // "The Dial"
				transitionTime = 0.2;
				for (let i = 0; i < 3; i++) {
					rotation += 30;
					await wait(250);
				}
				break;
			case 15: // "Satellite Scan"
				transitionTime = 3.0;
				innerOffset = 60;
				rotation += 360;
				await wait(3000);
				break;
			case 16: // "The Locksmith"
				transitionTime = 0.5;
				rotation -= 45;
				await wait(500);
				rotation += 90;
				await wait(500);
				scaleAmount = 1.1;
				await wait(300);
				break;
			case 17: // "The Telescope"
				transitionTime = 1.0;
				scaleAmount = 1.5;
				innerSize = 40;
				outerSize = 100;
				await wait(1000);
				break;
			case 18: // "The Nudge"
				transitionTime = 0.4;
				rotation += 25;
				scaleAmount = 1.1;
				await wait(400);
				rotation -= 50;
				await wait(400);
				break;
			case 19: // "Phase Shift"
				transitionTime = 1.5;
				opacityInner = 0.2;
				innerOffset = 0;
				await wait(1500);
				break;
		}

		resetState();
		setTimeout(() => {
			isDoingScience = false;
		}, 1600);
	}

	onMount(() => {
		shuffleDeck();

		// Efficient Idle Loop
		idleTimer = setInterval(() => {
			const now = Date.now();
			// Check if we've exceeded the random threshold
			if (!isDoingScience && now - lastInteractionTime > currentIdleThreshold) {
				runTrick();
				lastInteractionTime = now;
				// New random threshold for next time
				currentIdleThreshold = 8000 + Math.random() * 4000;
			}
		}, 1000);
	});

	onDestroy(() => {
		if (idleTimer) clearInterval(idleTimer);
	});

	// Morph Logic for Page Scroll
	$: morphT = Math.min(progress / 0.6, 1);
	$: logoGap = 64 - morphT * 28;
	$: letterSpacing = 32 - Math.pow(morphT, 0.5) * 24;
	$: opacity = progress > 0.9 ? (1 - progress) / 0.1 : 1;
</script>

<div class="logo-group" style="opacity: {opacity};" on:click={handleInteraction}>
	<div class="logo-mark" style="gap: {logoGap}px;">
		<div
			class="origin-logo"
			class:is-squircle={shapeMorph === 1}
			class:is-square={shapeMorph === 2}
			style="
				width: {outerSize}px; 
				height: {outerSize}px;
				border-width: {outerBorder}px;
				transform: 
					scale({(0.95 + morphT * 0.05) * scaleAmount}, {(0.95 + morphT * 0.05) * scaleAmount * scaleY}) 
					skew({skewX}deg, {skewY}deg);
				transition-duration: {transitionTime}s;
			"
		>
			<div
				class="orbit-container"
				style="
					transform: rotate({rotation}deg); 
					transition-duration: {transitionTime}s;
				"
			>
				<div
					class="inner-circle"
					class:is-squircle={shapeMorph === 1}
					class:is-square={shapeMorph === 2}
					style="
						width: {innerSize}px;
						height: {innerSize}px;
						border-width: {innerBorder}px;
						margin-left: {innerOffset}px; 
						opacity: {opacityInner};
						transform: translate({innerX}px, {innerY}px);
						transition-duration: {transitionTime}s;
					"
				></div>
			</div>
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
		cursor: crosshair;
	}

	.logo-mark {
		display: flex;
		align-items: center;
		color: #fff;
	}

	.origin-logo {
		border: solid currentColor;
		border-radius: 50%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		transition-property: all;
		transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.is-squircle {
		border-radius: 20% !important;
	}
	.is-square {
		border-radius: 0% !important;
	}

	.orbit-container {
		position: absolute;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		/* North-East Bias: We rely on rotation=-45deg now, so no top/left tweak needed */
		transition-property: transform;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	}

	.inner-circle {
		position: absolute;
		border: solid currentColor;
		border-radius: 50%;
		transition-property: all;
		transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.rest-of-word {
		font-size: 40px;
		font-family: 'BankGothic', sans-serif !important;
		color: #fff;
		font-weight: 300;
		pointer-events: none;
		user-select: none;
	}

	@media (max-width: 600px) {
		.origin-logo {
			width: 60px !important;
			height: 60px !important;
		}
		.rest-of-word {
			font-size: 30px;
		}
	}
</style>
