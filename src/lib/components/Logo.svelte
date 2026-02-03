<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	export let progress: number = 0;

	// --- Visual State Variables ---
	let rotation = -45;
	let innerOffset = 32;
	let innerX = 0;
	let innerY = 0;

	let scaleAmount = 1;
	let outerSize = 80;
	let innerSize = 20;

	let outerBorder = 5;
	let innerBorder = 5;
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
	let currentIdleThreshold = 8000 + Math.random() * 4000;

	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
		currentIdleThreshold = 8000 + Math.random() * 4000;
		runTrick();
	}

	async function runTrick() {
		if (isDoingScience) return;
		if (trickDeck.length === 0) shuffleDeck();
		isDoingScience = true;
		const trickId = trickDeck.pop();
		transitionTime = 0.6;

		switch (trickId) {
			case 0:
				transitionTime = 0.8;
				outerSize = 20;
				innerSize = 80;
				innerOffset = 0;
				await wait(1500);
				break;
			case 1:
				transitionTime = 0.6;
				shapeMorph = 2;
				innerOffset = 0;
				await wait(1200);
				break;
			case 2:
				transitionTime = 0.8;
				shapeMorph = 2;
				rotation += 45;
				innerOffset = 0;
				await wait(1200);
				break;
			case 3:
				transitionTime = 1.0;
				shapeMorph = 1;
				await wait(1200);
				break;
			case 4:
				transitionTime = 1.5;
				innerOffset = 0;
				innerSize = 78;
				outerBorder = 1;
				await wait(1500);
				break;
			case 5:
				rotation = 0;
				innerOffset = 0;
				await wait(600);
				innerY = 50;
				await wait(600);
				transitionTime = 0.3;
				innerY = 20;
				await wait(300);
				innerY = 50;
				await wait(300);
				break;
			case 6:
				transitionTime = 1.0;
				rotation -= 45;
				innerOffset = 10;
				await wait(1000);
				transitionTime = 0.5;
				rotation += 405;
				innerOffset = 60;
				await wait(600);
				break;
			case 7:
				transitionTime = 0.8;
				scaleY = 0;
				await wait(800);
				scaleY = 1;
				await wait(600);
				break;
			case 8:
				transitionTime = 0.8;
				skewY = 15;
				innerY = -60;
				innerOffset = 0;
				await wait(100);
				innerY = 60;
				await wait(800);
				break;
			case 9:
				transitionTime = 0.5;
				innerOffset = 15;
				innerSize = 30;
				await wait(500);
				innerSize = 10;
				innerOffset = 50;
				await wait(800);
				break;
			case 10:
				transitionTime = 2.0;
				scaleAmount = 1.2;
				innerSize = 25;
				await wait(2000);
				break;
			case 11:
				transitionTime = 1.2;
				outerBorder = 1;
				scaleAmount = 1.3;
				opacityInner = 0;
				await wait(1200);
				break;
			case 12:
				transitionTime = 0.2;
				scaleY = 0.1;
				await wait(200);
				scaleY = 1;
				await wait(200);
				break;
			case 13:
				transitionTime = 0.4;
				rotation += 90;
				scaleAmount = 0.8;
				await wait(400);
				rotation -= 10;
				scaleAmount = 1;
				await wait(300);
				break;
			case 14:
				transitionTime = 0.2;
				for (let i = 0; i < 3; i++) {
					rotation += 30;
					await wait(250);
				}
				break;
			case 15:
				transitionTime = 3.0;
				innerOffset = 60;
				rotation += 360;
				await wait(3000);
				break;
			case 16:
				transitionTime = 0.5;
				rotation -= 45;
				await wait(500);
				rotation += 90;
				await wait(500);
				scaleAmount = 1.1;
				await wait(300);
				break;
			case 17:
				transitionTime = 1.0;
				scaleAmount = 1.5;
				innerSize = 40;
				outerSize = 100;
				await wait(1000);
				break;
			case 18:
				transitionTime = 0.4;
				rotation += 25;
				scaleAmount = 1.1;
				await wait(400);
				rotation -= 50;
				await wait(400);
				break;
			case 19:
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
		idleTimer = setInterval(() => {
			const now = Date.now();
			if (!isDoingScience && now - lastInteractionTime > currentIdleThreshold) {
				runTrick();
				lastInteractionTime = now;
				currentIdleThreshold = 8000 + Math.random() * 4000;
			}
		}, 1000);
	});

	onDestroy(() => {
		if (idleTimer) clearInterval(idleTimer);
	});

	// --- SCROLL MORPH LOGIC ---
	$: morphT = Math.min(progress / 0.6, 1);
	$: logoGap = 64 - morphT * 48;
	$: letterSpacing = 32 - Math.pow(morphT, 0.5) * 28;
	$: scrollScale = 1 - morphT * 0.45; // Shrinks mark to 55%
	$: scrollFontSize = 40 - morphT * 18; // Shrinks font to 22px
</script>

<div class="logo-group" on:click={handleInteraction}>
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
					scale({scrollScale * scaleAmount}, {scrollScale * scaleAmount * scaleY}) 
					skew({skewX}deg, {skewY}deg);
				transition-duration: {transitionTime}s;
			"
		>
			<div
				class="orbit-container"
				style="transform: rotate({rotation}deg); transition-duration: {transitionTime}s;"
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
		<div
			class="rest-of-word"
			style="letter-spacing: {letterSpacing}px; font-size: {scrollFontSize}px;"
		>
			ORIGIN
		</div>
	</div>
</div>

<style>
	.logo-group {
		display: flex;
		flex-direction: column;
		align-items: center;

		pointer-events: auto;
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
		cursor: pointer;
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
		font-family: 'BankGothic', sans-serif !important;
		color: #fff;
		font-weight: 300;
		pointer-events: none;
		user-select: none;
	}
</style>
