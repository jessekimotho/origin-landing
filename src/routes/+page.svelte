<script lang="ts">
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';

	// --- TYPE DEFINITIONS ---
	interface Pixel {
		x: number;
		y: number;
		color: string;
		size: number;
		minSize: number;
		maxSizeInteger: number;
		maxSize: number;
		sizeStep: number;
		shimmer: boolean;
		reverse: boolean;
		counter: number;
		counterStep: number;
		delay: number;
		idle: boolean;
		spd: number;
	}

	interface HoverOptions {
		gap?: number;
		speed?: number;
		colors?: string[];
		noFocus?: boolean;
	}

	interface TrackState {
		msgEl: HTMLElement | null;
		viewportEl: HTMLElement | null;
		dockEl: HTMLElement | null;
		sentinelEl: HTMLElement | null;
		revealP: number;
		visibleWordIndex: number;
		textScale: number;
	}

	interface GridState {
		dockEl: HTMLElement | null;
		sentinelEl: HTMLElement | null;
		fillerEl: HTMLElement | null;
		fillerP: number;
	}

	interface IntroState {
		trackEl: HTMLElement | null;
		dockEl: HTMLElement | null;
		progress: number;
	}

	interface FormState {
		dockEl: HTMLElement | null;
		sentinelEl: HTMLElement | null;
	}

	// ---------------------------------------------------------
	// PIXEL HOVER ACTION
	// ---------------------------------------------------------
	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

	function pixelHover(node: HTMLElement, opts: HoverOptions) {
		const {
			gap = 6,
			speed = 0.035,
			colors = ['#f8fafc', '#f1f5f9', '#cbd5e1'],
			noFocus = false
		} = opts || {};

		const canvas = node.querySelector('canvas');
		if (!canvas) return;

		const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
		if (!ctx) return;

		let pixels: Pixel[] = [];
		let raf = 0;
		let hovering = false;
		let width = 0;
		let height = 0;

		const rand = (min: number, max: number) => Math.random() * (max - min) + min;

		function resize() {
			const r = canvas.getBoundingClientRect();
			width = Math.max(1, Math.floor(r.width));
			height = Math.max(1, Math.floor(r.height));

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
			}

			pixels = [];
			for (let x = 0; x < width; x += gap) {
				for (let y = 0; y < height; y += gap) {
					const color = colors[(Math.random() * colors.length) | 0];
					const minSize = 0.5;
					const maxSizeInteger = 2;
					const maxSize = rand(minSize, maxSizeInteger);
					const dx = x - width / 2;
					const dy = y - height / 2;
					const delay = prefersReducedMotion ? 0 : Math.sqrt(dx * dx + dy * dy);

					pixels.push({
						x,
						y,
						color,
						size: 0,
						minSize,
						maxSizeInteger,
						maxSize,
						sizeStep: Math.random() * 0.4,
						shimmer: false,
						reverse: false,
						counter: 0,
						counterStep: Math.random() * 4 + (width + height) * 0.01,
						delay,
						idle: true,
						spd: rand(0.1, 0.9) * (prefersReducedMotion ? 0 : speed)
					});
				}
			}
		}

		function drawPixel(p: Pixel) {
			const centerOffset = p.maxSizeInteger * 0.5 - p.size * 0.5;
			ctx.fillStyle = p.color;
			ctx.fillRect(p.x + centerOffset, p.y + centerOffset, p.size, p.size);
		}

		function step() {
			ctx.clearRect(0, 0, width, height);
			let allIdle = true;

			for (let i = 0; i < pixels.length; i++) {
				const p = pixels[i];

				if (hovering) {
					p.idle = false;
					if (p.counter <= p.delay) {
						p.counter += p.counterStep;
						allIdle = false;
						continue;
					}
					if (p.size >= p.maxSize) p.shimmer = true;

					if (p.shimmer) {
						if (p.size >= p.maxSize) p.reverse = true;
						else if (p.size <= p.minSize) p.reverse = false;
						p.size += p.reverse ? -p.spd : p.spd;
					} else {
						p.size += p.sizeStep;
					}
					drawPixel(p);
					allIdle = false;
				} else {
					p.shimmer = false;
					p.counter = 0;
					if (p.size <= 0) {
						p.idle = true;
					} else {
						p.size -= 0.1;
						drawPixel(p);
						p.idle = false;
					}
					if (!p.idle) allIdle = false;
				}
			}

			if (!hovering && allIdle) {
				cancelAnimationFrame(raf);
				raf = 0;
				ctx.clearRect(0, 0, width, height);
			} else {
				raf = requestAnimationFrame(step);
			}
		}

		const ro = new ResizeObserver(() => {
			resize();
			if (hovering && !raf) step();
		});

		function onEnter() {
			if (noFocus) return;
			hovering = true;
			if (!raf) step();
		}

		function onLeave() {
			hovering = false;
			if (!raf) step();
		}

		resize();
		ro.observe(node);
		node.addEventListener('mouseenter', onEnter);
		node.addEventListener('mouseleave', onLeave);

		return {
			destroy() {
				ro.disconnect();
				node.removeEventListener('mouseenter', onEnter);
				node.removeEventListener('mouseleave', onLeave);
				cancelAnimationFrame(raf);
			}
		};
	}

	// ---------------------------------------------------------
	// CORE LOGIC (STICKY-ONLY DOCKING)
	// ---------------------------------------------------------
	let scrollParent: HTMLElement | null = null;

	let introState: IntroState = {
		trackEl: null,
		dockEl: null,
		progress: 0
	};

	let track1: TrackState = {
		msgEl: null,
		viewportEl: null,
		dockEl: null,
		sentinelEl: null,
		revealP: 0,
		visibleWordIndex: -1,
		textScale: 1
	};

	let track2: TrackState = {
		msgEl: null,
		viewportEl: null,
		dockEl: null,
		sentinelEl: null,
		revealP: 0,
		visibleWordIndex: -1,
		textScale: 1
	};

	let track3: TrackState = {
		msgEl: null,
		viewportEl: null,
		dockEl: null,
		sentinelEl: null,
		revealP: 0,
		visibleWordIndex: -1,
		textScale: 1
	};

	let grid1: GridState = {
		dockEl: null,
		sentinelEl: null,
		fillerEl: null,
		fillerP: 0
	};

	let grid2: GridState = {
		dockEl: null,
		sentinelEl: null,
		fillerEl: null,
		fillerP: 0
	};

	let formState: FormState = {
		dockEl: null,
		sentinelEl: null
	};

	let pageScrollTop = 0;

	let mouseCoords = spring({ x: 0, y: 0 }, { stiffness: 0.05, damping: 0.25 });

	// --- UTILS ---
	const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

	// --- GRAMMAR HELPER ---
	function getArticle(word: string) {
		return /^[aeiou]/i.test(word) ? 'an' : 'a';
	}

	// --- CONFIG ---
	const INTRO_DISTANCE_PX = 40;
	const REVEAL_LEADIN = 0.18;
	const BG_FADE_PX = 900;
	const ESTIMATED_WORDS = 20;

	const TEXT_FIX_TOP_PX = 240; // sticky top for text docks
	const SHRINK_RANGE_PX = 400;
	const TARGET_SCALE = 0.5;

	const GRID_FIX_TOP_PX = 340; // sticky top for grid docks
	const FORM_FIX_TOP_PX = 380; // sticky top for form

	const BASE_MEDIUM = 55;
	const BASE_LARGE = 80;
	let dynamicMedium = BASE_MEDIUM;
	let dynamicLarge = BASE_LARGE;

	const START_GAP = 64;
	const END_GAP = 36;
	const START_FONT = 26;
	const END_FONT = 20;
	const START_LETTER = 32;
	const END_LETTER = 8;

	function handleMouseMove(e: MouseEvent) {
		if (document.hidden) return;
		const x = e.clientX / window.innerWidth - 0.5;
		const y = e.clientY / window.innerHeight - 0.5;
		mouseCoords.set({ x, y });
	}

	// --- DATA ---
	interface LineData {
		size: string;
		text: string;
	}

	const topTextData: LineData[] = [
		{ size: 'medium', text: 'Chronic Disease' },
		{ size: 'medium', text: 'lies in wait for all of us' },
		{ size: 'larger', text: 'We all have the right to contribute' }
	];

	const bottomTextData: LineData[] = [
		{ size: 'medium', text: 'Breakthroughs are being made' },
		{ size: 'medium', text: 'against chronic disease' },
		{ size: 'larger', text: 'Together we can ensure they make it to patients' }
	];

	const finalTextData: LineData[] = [
		{ size: 'medium', text: 'The fight against Chronic Disease' },
		{ size: 'larger', text: 'starts with you' }
	];

	function prepareLines(dataLines: LineData[], offsetCount = 0) {
		let count = offsetCount;
		const lines = dataLines.map((line) => {
			const words = line.text
				.trim()
				.split(/\s+/)
				.map((w, i) => ({
					text: w,
					localIndex: i,
					globalIndex: count++
				}));
			return { ...line, words };
		});
		return { lines, totalWords: count - offsetCount };
	}

	const { lines: lines1 } = prepareLines(topTextData);
	const { lines: lines2 } = prepareLines(bottomTextData);
	const { lines: lines3 } = prepareLines(finalTextData);

	const gridCells = [
		{
			label: 'Public Figure',
			active: '#e3e3e3',
			gap: 6,
			speed: 0.035,
			colors: ['#f8fafc', '#f1f5f9', '#cbd5e1']
		},
		{
			label: 'Donor',
			active: '#e0f2fe',
			gap: 10,
			speed: 0.025,
			colors: ['#e0f2fe', '#7dd3fc', '#0ea5e9']
		},
		{
			label: 'Content Creator',
			active: '#fef08a',
			gap: 3,
			speed: 0.02,
			colors: ['#fef08a', '#fde047', '#eab308']
		},
		{
			label: 'Investor',
			active: '#fecdd3',
			gap: 6,
			speed: 0.08,
			colors: ['#fecdd3', '#fda4af', '#e11d48']
		},
		{
			label: 'Health Player',
			active: '#c7d2fe',
			gap: 6,
			speed: 0.03,
			colors: ['#c7d2fe', '#a5b4fc', '#6366f1']
		},
		{
			label: 'Policymaker',
			active: '#bbf7d0',
			gap: 8,
			speed: 0.03,
			colors: ['#bbf7d0', '#86efac', '#22c55e']
		},
		{
			label: 'Patient',
			active: '#fde68a',
			gap: 6,
			speed: 0.035,
			colors: ['#fde68a', '#fbbf24', '#d97706']
		},
		{
			label: 'Family Member',
			active: '#fbcfe8',
			gap: 7,
			speed: 0.03,
			colors: ['#fbcfe8', '#f9a8d4', '#db2777']
		},
		{
			label: 'Translational Scientist',
			active: '#cffafe',
			gap: 9,
			speed: 0.03,
			colors: ['#cffafe', '#67e8f9', '#06b6d4']
		},
		{
			label: 'Attorney',
			active: '#ddd6fe',
			gap: 6,
			speed: 0.03,
			colors: ['#ddd6fe', '#c4b5fd', '#7c3aed']
		},
		{
			label: 'Research Engineer',
			active: '#d1fae5',
			gap: 7,
			speed: 0.03,
			colors: ['#d1fae5', '#6ee7b7', '#10b981']
		}
	];

	const breakthroughCells = [
		{
			title: 'Precision Editing',
			desc: 'CRISPR 2.0 targeting root genetic causes.',
			colors: ['#a7f3d0', '#34d399', '#059669']
		},
		{
			title: 'Digital Twins',
			desc: 'AI models predicting patient outcomes.',
			colors: ['#bae6fd', '#38bdf8', '#0284c7']
		},
		{
			title: 'Continuous Sensing',
			desc: 'Wearables detecting biomarkers in real-time.',
			colors: ['#fde68a', '#fbbf24', '#d97706']
		},
		{
			title: 'mRNA Therapeutics',
			desc: 'Programmable medicine for immune response.',
			colors: ['#e9d5ff', '#c084fc', '#9333ea']
		},
		{
			title: 'Microbiome Mapping',
			desc: 'Gut flora analysis for metabolic health.',
			colors: ['#fbcfe8', '#f472b6', '#db2777']
		},
		{
			title: 'Neural Interfaces',
			desc: 'Brain-computer bridges for restoration.',
			colors: ['#fed7aa', '#fb923c', '#ea580c']
		}
	];

	let selectedCellIndex = -1;
	let isFading = false;

	function handleCellClick(index: number) {
		if (selectedCellIndex !== -1) return;
		isFading = true;
		setTimeout(() => {
			selectedCellIndex = index;
		}, 400);
	}

	const clinicalFacts = [
		'HbA1c > 6.5%',
		'Hypertension',
		'Dyslipidemia',
		'Insulin Resistance',
		'BMI > 30',
		'Chronic Inflammation',
		'Oxidative Stress',
		'Endothelial Dysfunction',
		'Atherosclerosis',
		'GFR < 60',
		'Neuropathy',
		'Retinopathy',
		'Metabolic Syndrome',
		'Cortisol Spikes',
		'Sleep Apnea',
		'Sedentary Behavior',
		'Glycemic Variability',
		'Beta-cell Failure',
		'Fatty Liver',
		'Autoimmunity',
		'Genetics',
		'Epigenetics',
		'ACE Inhibitors',
		'Statins',
		'Metformin',
		'Mitochondrial Dysfunction',
		'Cytokine Storm',
		'IL-6 Elevation',
		'TNF-alpha',
		'Systolic > 140',
		'Stroke Risk x2',
		'Myocardial Infarction',
		'PAD',
		'Gastroparesis',
		'Nephropathy',
		"Alzheimer's Link",
		'Cancer Correlation',
		'Immune Suppression',
		'Slow Healing',
		'Sarcopenia',
		'Osteoporosis',
		'Vitamin D Low',
		'Homocysteine',
		'Fibrinogen',
		'Uric Acid',
		'Triglycerides'
	];

	let cloudItems = new Array(60).fill(0).map((_, i) => ({
		id: i,
		text: clinicalFacts[i % clinicalFacts.length],
		x: Math.random() * 100,
		y: Math.random() * 100,
		depth: 0.2 + Math.random() * 0.8,
		opacity: 0.05 + Math.random() * 0.25,
		scale: 0.8 + Math.random() * 0.4
	}));

	// Progress based on scrollTop and offsetTop (fast & stable inside overflow container)
	function computeTrackProgress(trackEl: HTMLElement | null, viewportH: number) {
		if (!scrollParent || !trackEl) return 0;

		const top = trackEl.offsetTop;
		const end = top + (trackEl.offsetHeight - viewportH);
		const current = scrollParent.scrollTop;
		const denom = end - top;

		return clamp01(denom > 0 ? (current - top) / denom : 0);
	}

	// Sticky-only: compute scale as the viewport center approaches the sticky top line
	function computeStickyScale(viewportEl: HTMLElement | null) {
		if (!viewportEl) return 1;

		const viewportRect = viewportEl.getBoundingClientRect();

		// NOTE: because `main` scrolls, these rects are still viewport-based; that's fine for scale math.
		const naturalCenterY = viewportRect.top + window.innerHeight / 2;

		const distFromLock = naturalCenterY - TEXT_FIX_TOP_PX;

		if (distFromLock <= 0) return TARGET_SCALE;

		if (distFromLock < SHRINK_RANGE_PX) {
			const progress = 1 - distFromLock / SHRINK_RANGE_PX;
			return lerp(1, TARGET_SCALE, progress);
		}

		return 1;
	}

	let isTicking = false;

	function onScroll() {
		if (!isTicking) {
			requestAnimationFrame(() => {
				updateScroll();
				isTicking = false;
			});
			isTicking = true;
		}
	}

	function updateScroll() {
		if (!scrollParent) return;

		pageScrollTop = scrollParent.scrollTop;
		const vH = scrollParent.clientHeight;

		// 1. Logo (progress only; docking is pure sticky CSS)
		introState.progress = computeTrackProgress(introState.trackEl, vH);

		// 2. Track 1 (reveal + scale only)
		track1.revealP = computeTrackProgress(track1.msgEl, vH);
		const prog1 = clamp01((track1.revealP - REVEAL_LEADIN) / (1 - REVEAL_LEADIN));
		track1.visibleWordIndex = Math.floor(prog1 * (ESTIMATED_WORDS + 2)) - 1;
		track1.textScale = computeStickyScale(track1.viewportEl);

		// 3. Filler 1 (opacity fade)
		if (grid1.fillerEl) {
			const rect = grid1.fillerEl.getBoundingClientRect();
			grid1.fillerP = clamp01((window.innerHeight - rect.top) / window.innerHeight);
		}

		// 4. Track 2
		track2.revealP = computeTrackProgress(track2.msgEl, vH);
		const prog2 = clamp01((track2.revealP - REVEAL_LEADIN) / (1 - REVEAL_LEADIN));
		track2.visibleWordIndex = Math.floor(prog2 * (ESTIMATED_WORDS + 2)) - 1;
		track2.textScale = computeStickyScale(track2.viewportEl);

		// 5. Filler 2
		if (grid2.fillerEl) {
			const rect = grid2.fillerEl.getBoundingClientRect();
			grid2.fillerP = clamp01((window.innerHeight - rect.top) / window.innerHeight);
		}

		// 6. Track 3
		track3.revealP = computeTrackProgress(track3.msgEl, vH);
		const prog3 = clamp01((track3.revealP - REVEAL_LEADIN) / (1 - REVEAL_LEADIN));
		track3.visibleWordIndex = Math.floor(prog3 * (ESTIMATED_WORDS + 2)) - 1;
		track3.textScale = computeStickyScale(track3.viewportEl);
	}

	function handleResize() {
		updateScroll();
	}

	let bubbleEl: HTMLElement | null = null;
	let containerEl: HTMLElement | null = null;
	let targetX = 0,
		targetY = 0,
		currentX = 0,
		currentY = 0;

	onMount(() => {
		if (!containerEl || !bubbleEl) return;

		function onMouseMoveBubble(event: MouseEvent) {
			const bounds = containerEl!.getBoundingClientRect();
			targetX = event.clientX - bounds.left;
			targetY = event.clientY - bounds.top;
		}

		let bubbleRaf: number;
		function animateBubble() {
			const ease = 0.1;
			currentX += (targetX - currentX) * ease;
			currentY += (targetY - currentY) * ease;
			bubbleEl!.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
			bubbleRaf = requestAnimationFrame(animateBubble);
		}

		window.addEventListener('mousemove', onMouseMoveBubble);
		bubbleRaf = requestAnimationFrame(animateBubble);

		scrollParent?.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', handleResize);
		window.addEventListener('mousemove', handleMouseMove);

		updateScroll();

		return () => {
			window.removeEventListener('mousemove', onMouseMoveBubble);
			scrollParent?.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mousemove', handleMouseMove);
			cancelAnimationFrame(bubbleRaf);
		};
	});

	// --- Intro morph vars (same data, but sticky handles pinning) ---
	$: logoY = `${(1 - introState.progress) * 50}%`;
	$: logoTranslateY = `${(1 - introState.progress) * -50}%`;
	$: logoTopPx = `${introState.progress * INTRO_DISTANCE_PX}px`;
	$: promptOpacity = clamp01(1 - introState.progress * 1.2);

	$: morphT = clamp01(1 - promptOpacity);
	$: logoGapPx = `${lerp(START_GAP, END_GAP, morphT).toFixed(2)}px`;
	$: restFontPx = `${lerp(START_FONT, END_FONT, morphT).toFixed(2)}px`;
	$: restLetterPx = `${lerp(START_LETTER, END_LETTER, morphT).toFixed(2)}px`;

	// Background fade
	$: bgFxOpacity = 1 - clamp01(pageScrollTop / BG_FADE_PX);

	// Fade previous sections based on filler progress
	$: fadeOutOld1 = clamp01((grid1.fillerP - 0.4) * 2.5);
	$: previousContentOpacity1 = 1 - fadeOutOld1;

	$: fadeOutOld2 = clamp01((grid2.fillerP - 0.4) * 2.5);
	$: previousContentOpacity2 = 1 - fadeOutOld2;
</script>

<div class="back-g"></div>

<main bind:this={scrollParent}>
	<div class="bg-fx" style="opacity: {bgFxOpacity}">
		<div class="gradient-bg" bind:this={containerEl}>
			<svg style="position: absolute; width:0; height:0;">
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
	</div>

	<section class="intro-track" bind:this={introState.trackEl}>
		<div class="intro-sticky">
			<div
				bind:this={introState.dockEl}
				class="logo-dock"
				style="
          --logo-y: {logoY};
          --logo-ty: {logoTranslateY};
          --logo-top: {logoTopPx};
          --gap: {logoGapPx};
          --rest-font: {restFontPx};
          --rest-letter: {restLetterPx};
        "
			>
				<div class="logo-mark">
					<div
						class="origin-logo"
						style="
              --mx: {$mouseCoords.x};
              --my: {$mouseCoords.y};
            "
					>
						<div class="inner-circle"></div>
					</div>

					<div class="rest-of-word">ORIGIN</div>
				</div>
			</div>

			<div class="prompt" style="opacity: {promptOpacity}">Scroll BELOW to access the site</div>
		</div>
	</section>

	<div style="opacity: {previousContentOpacity1}; transition: opacity 0.1s linear;">
		<div class="message-track" bind:this={track1.msgEl}>
			<div class="sticky-viewport" bind:this={track1.viewportEl}>
				<div
					class="cloud-container"
					style="--mouse-x: {$mouseCoords.x}; --mouse-y: {$mouseCoords.y}; --scroll-p: {track1.revealP};"
				>
					{#each cloudItems as item (item.id)}
						<div
							class="cloud-item"
							style="transform: translate3d({item.x * 0.01 * 100}vw, {item.y * 0.01 * 100}vh, 0)
                translate3d(calc(var(--mouse-x) * {item.depth} * -100px),
                            calc((var(--mouse-y) * {item.depth} * -50px) + (var(--scroll-p) * {item.depth} * -400px)),
                            0);
                opacity: {item.opacity};
                font-size: calc(1rem * {item.scale});"
						>
							{item.text}
						</div>
					{/each}
				</div>

				<div bind:this={track1.sentinelEl} class="text-sentinel"></div>

				<div
					bind:this={track1.dockEl}
					class="text-dock"
					style="
            --text-fix-top: {TEXT_FIX_TOP_PX}px;
            --fs-medium: {dynamicMedium}px;
            --fs-large: {dynamicLarge}px;
            --text-scale: {track1.textScale};
          "
				>
					<div class="text-inner">
						<div class="revision-container" class:fading={isFading}>
							{#each lines1 as line (line.text)}
								<div class="line {line.size}">
									{#each line.words as word (word.globalIndex)}
										<span class="word" class:active={word.globalIndex <= track1.visibleWordIndex}>
											{word.text}&nbsp;
										</span>
									{/each}
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<section class="content">
			<div bind:this={grid1.sentinelEl} class="grid-sentinel"></div>

			<div bind:this={grid1.dockEl} class="grid-dock" style="--grid-fix-top: {GRID_FIX_TOP_PX}px;">
				<div class="grid-wrapper">
					<div class="grid-cloud" role="button" tabindex="0">
						{#each gridCells as c, i (c.label)}
							<div
								role="button"
								tabindex="0"
								class="cell cloud-cell"
								class:selected-mode={selectedCellIndex !== -1}
								class:is-chosen={selectedCellIndex === i}
								class:fading={selectedCellIndex !== -1 && selectedCellIndex !== i}
								style="--active-color: {c.active}"
								use:pixelHover={{
									gap: c.gap,
									speed: c.speed,
									colors: c.colors,
									noFocus: selectedCellIndex !== -1
								}}
								on:click={() => handleCellClick(i)}
								on:keydown={() => handleCellClick(i)}
							>
								<canvas class="pixel-bg"></canvas>

								<div class="cell-content-wrapper">
									<span class="prefix">I am {getArticle(c.label)}</span>
									<span class="cell-label">{c.label}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="filler" bind:this={grid1.fillerEl}></div>
		</section>
	</div>

	<div style="opacity: {previousContentOpacity2}; transition: opacity 0.1s linear;">
		<div class="message-track" bind:this={track2.msgEl}>
			<div class="sticky-viewport" bind:this={track2.viewportEl}>
				<div
					class="cloud-container"
					style="--mouse-x: {$mouseCoords.x}; --mouse-y: {$mouseCoords.y}; --scroll-p: {track2.revealP};"
				>
					{#each cloudItems as item (item.id)}
						<div
							class="cloud-item"
							style="transform: translate3d({item.x * 0.01 * 100}vw, {item.y * 0.01 * 100}vh, 0)
                translate3d(calc(var(--mouse-x) * {item.depth} * -100px),
                            calc((var(--mouse-y) * {item.depth} * -50px) + (var(--scroll-p) * {item.depth} * -400px)),
                            0);
                opacity: {item.opacity};
                font-size: calc(1rem * {item.scale});"
						>
							{item.text}
						</div>
					{/each}
				</div>

				<div bind:this={track2.sentinelEl} class="text-sentinel"></div>

				<div
					bind:this={track2.dockEl}
					class="text-dock"
					style="
            --text-fix-top: {TEXT_FIX_TOP_PX}px;
            --fs-medium: {dynamicMedium}px;
            --fs-large: {dynamicLarge}px;
            --text-scale: {track2.textScale};
          "
				>
					<div class="text-inner">
						<div class="revision-container">
							{#each lines2 as line (line.text)}
								<div class="line {line.size}">
									{#each line.words as word (word.globalIndex)}
										<span class="word" class:active={word.globalIndex <= track2.visibleWordIndex}>
											{word.text}&nbsp;
										</span>
									{/each}
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<section class="content">
			<div bind:this={grid2.sentinelEl} class="grid-sentinel"></div>

			<div bind:this={grid2.dockEl} class="grid-dock" style="--grid-fix-top: {GRID_FIX_TOP_PX}px;">
				<div class="grid-wrapper">
					<div class="grid-uniform">
						{#each breakthroughCells as item (item.title)}
							<div
								class="cell uniform-cell"
								style="--active-color: {item.colors[0]}"
								use:pixelHover={{ gap: 6, speed: 0.035, colors: item.colors }}
							>
								<canvas class="pixel-bg"></canvas>

								<div class="cell-content">
									<div class="cell-title">{item.title}</div>
									<div class="cell-desc">{item.desc}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="filler" bind:this={grid2.fillerEl}></div>
		</section>
	</div>

	<div class="message-track" bind:this={track3.msgEl}>
		<div class="sticky-viewport" bind:this={track3.viewportEl}>
			<div
				class="cloud-container"
				style="--mouse-x: {$mouseCoords.x}; --mouse-y: {$mouseCoords.y}; --scroll-p: {track3.revealP};"
			>
				{#each cloudItems as item (item.id)}
					<div
						class="cloud-item"
						style="transform: translate3d({item.x * 0.01 * 100}vw, {item.y * 0.01 * 100}vh, 0)
              translate3d(calc(var(--mouse-x) * {item.depth} * -100px),
                          calc((var(--mouse-y) * {item.depth} * -50px) + (var(--scroll-p) * {item.depth} * -400px)),
                          0);
              opacity: {item.opacity};
              font-size: calc(1rem * {item.scale});"
					>
						{item.text}
					</div>
				{/each}
			</div>

			<div bind:this={track3.sentinelEl} class="text-sentinel"></div>

			<div
				bind:this={track3.dockEl}
				class="text-dock"
				style="
          --text-fix-top: {TEXT_FIX_TOP_PX}px;
          --fs-medium: {dynamicMedium}px;
          --fs-large: {dynamicLarge}px;
          --text-scale: {track3.textScale};
        "
			>
				<div class="text-inner">
					<div class="revision-container">
						{#each lines3 as line (line.text)}
							<div class="line {line.size}">
								{#each line.words as word (word.globalIndex)}
									<span class="word" class:active={word.globalIndex <= track3.visibleWordIndex}>
										{word.text}&nbsp;
									</span>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<section class="content footer-content">
		<div bind:this={formState.sentinelEl} class="form-sentinel"></div>

		<div
			bind:this={formState.dockEl}
			class="form-dock"
			style="--form-fix-top: {FORM_FIX_TOP_PX}px;"
		>
			<div class="form-container">
				<div class="contact-form">
					<input type="text" placeholder="Name" />
					<textarea placeholder="Message" rows="4"></textarea>
					<button>SEND</button>
				</div>
			</div>
		</div>

		<div class="filler" style="height: 50vh;"></div>
	</section>
</main>

<style>
	.cloud-item {
		will-change: transform, opacity;
	}

	.logo-dock,
	.text-dock,
	.grid-dock,
	.form-dock {
		will-change: transform, top;
	}

	main {
		height: 100vh;
		width: 100vw;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		background: #09090b;
	}

	/* Background layer is still fixed (not part of docking logic) */
	.bg-fx {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	.intro-track {
		position: relative;
		height: 180vh;
		z-index: 2;
	}

	.intro-sticky {
		position: sticky;
		top: 0;
		height: 100vh;
		width: 100%;
		overflow: hidden;
		display: grid;
		place-items: center;
	}

	/* STICKY-ONLY LOGO DOCK (no fixed) */
	.logo-dock {
		position: sticky;
		top: 40px;
		z-index: 999;
		pointer-events: none;
		display: flex;
		justify-content: center;

		/* Keep your original morph motion via CSS vars */
		transform: translateY(calc(var(--logo-top)));
	}

	.prompt {
		position: absolute;
		left: 50%;
		bottom: 50px;
		transform: translateX(-50%);
		z-index: 4;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		font-size: 12px;
		pointer-events: none;
		text-align: center;
		padding: 0 24px;
		color: rgba(255, 255, 255, 0.8);
		animation: promptFade 1.6s ease-in-out infinite;
	}

	@keyframes promptFade {
		0%,
		100% {
			color: rgba(255, 255, 255, 0.8);
		}
		50% {
			color: rgba(255, 255, 255, 0.3);
		}
	}

	.message-track {
		position: relative;
		height: 350vh;
		width: 100%;
		z-index: 1;
	}

	.sticky-viewport {
		position: sticky;
		top: 0;
		height: 100vh;
		width: 100%;
		overflow: hidden;
	}

	.cloud-container {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 1;
		pointer-events: none;
		overflow: hidden;
		perspective: 1000px;
	}

	.cloud-item {
		position: absolute;
		color: #a3a3a3;
		font-family: 'Courier New', Courier, monospace;
		left: 0;
		top: 0;
		white-space: nowrap;
		transition: opacity 0.5s ease;
	}

	.text-sentinel {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}

	/* STICKY-ONLY TEXT DOCK (no fixed) */
	.text-dock {
		position: sticky;
		top: var(--text-fix-top);
		z-index: 10;
		width: 100%;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}

	.text-inner {
		width: 100%;
		display: flex;
		justify-content: center;
		transform: scale(var(--text-scale, 1));
		transform-origin: top center;
	}

	.revision-container {
		padding: 64px 24px;
		color: white;
		text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
		opacity: 1;
		filter: blur(0px);
		transform: scale(1);
		transition:
			opacity 0.8s ease,
			filter 0.8s ease,
			transform 0.8s ease;
	}

	.revision-container.fading {
		opacity: 0;
		filter: blur(12px);
		transform: scale(0.95);
	}

	.line {
		display: block;
		text-align: center;
		line-height: 1.2;
		font-weight: 600;
	}

	.line.medium .word {
		font-size: var(--fs-medium);
		font-weight: 300;
		transition: opacity 0.2s;
	}

	.line.larger .word {
		font-size: var(--fs-large);
		font-weight: 400;
		transition: opacity 0.2s;
	}

	.word {
		opacity: 0;
		display: inline-block;
	}

	.word.active {
		opacity: 1;
	}

	.grid-sentinel {
		width: 100%;
		height: 1px;
	}

	/* STICKY-ONLY GRID DOCK (no fixed) */
	.grid-dock {
		position: sticky;
		top: var(--grid-fix-top);
		z-index: 9999;
		width: 100%;
		pointer-events: none;
		display: flex;
		justify-content: center;
	}

	.grid-wrapper {
		display: flex;
		justify-content: center;
		width: 100%;
		max-width: 1000px;
		padding: 0 24px;
		box-sizing: border-box;
		pointer-events: auto;
	}

	/* --- CLOUD GRID STYLES (UPDATED) --- */
	.grid-cloud {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 16px;
		width: 100%;
		max-width: 1100px;
		margin: 0 auto;
		pointer-events: auto;
	}

	.cell.cloud-cell {
		flex: 1 1 auto;
		width: auto;
		min-width: 220px;
		max-width: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80px;
		padding: 0 32px;
	}

	.cell-content-wrapper {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		pointer-events: none;
	}

	.prefix {
		display: inline-block;
		font-weight: 300;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.95rem;
		max-width: 0;
		opacity: 0;
		transform: translateX(10px);
		overflow: hidden;
		transition:
			max-width 0.5s cubic-bezier(0.2, 0, 0.2, 1),
			opacity 0.4s ease,
			transform 0.4s ease;
		margin-right: 0;
	}

	.cell:hover .prefix {
		max-width: 80px;
		opacity: 1;
		transform: translateX(0);
		margin-right: 6px;
	}

	.cell:hover .cell-label {
		transform: translateX(0);
		color: white;
	}

	.cell-label {
		font-weight: 600;
		font-size: 1.1rem;
		transition: transform 0.4s cubic-bezier(0.2, 0, 0.2, 1);
		text-transform: capitalize;
	}

	/* --- GRID 2 (UNIFORM) --- */
	.grid-uniform {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		width: 100%;
		pointer-events: auto;
	}

	/* CELL STYLING */
	.cell {
		position: relative;
		overflow: hidden;
		isolation: isolate;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		font-family: inherit;
		color: rgba(255, 255, 255, 0.9);
		transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
		user-select: none;
		line-height: 1.3;
	}

	.uniform-cell {
		min-height: 140px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 24px;
		text-align: center;
	}

	.cell-content {
		position: relative;
		z-index: 2;
	}

	.cell-title {
		font-weight: 600;
		font-size: 1.1rem;
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.cell-desc {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		line-height: 1.4;
	}

	.cell.fading {
		opacity: 0;
		transform: scale(0.9);
		pointer-events: none;
		filter: blur(8px);
	}

	/* Was fixed; now sticky-only "spotlight" (no fixed) */
	.cell.is-chosen {
		position: sticky;
		top: 200px;
		left: 50%;
		transform: translateX(-50%) scale(1.2);
		z-index: 10000;
		margin: 0;
		width: 300px;
		height: 180px;
		border-color: var(--active-color);
		background: rgba(0, 0, 0, 0.8);
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
	}

	.cell:not(.selected-mode):hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: var(--active-color, rgba(255, 255, 255, 0.9));
		transform: translateY(-2px) scale(1.01);
		box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
		z-index: 10;
	}

	.pixel-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
		display: block;
	}

	:root {
		--logo-color: white;
		--logo-size: 50px;
		--border-thickness: calc(var(--logo-size) / 10);
	}

	.logo-mark {
		display: flex;
		gap: var(--gap);
		justify-content: center;
		align-items: center;
		padding: 32px;
	}

	.rest-of-word {
		font-size: var(--rest-font);
		letter-spacing: var(--rest-letter);
		color: white;
	}

	.origin-logo {
		width: var(--logo-size);
		height: var(--logo-size);
		border: 3px solid var(--logo-color);
		border-radius: 50%;
		box-sizing: border-box;
		position: relative;
	}

	.origin-logo .inner-circle {
		width: 40%;
		height: 40%;
		border: 3px solid var(--logo-color);
		border-radius: 50%;
		box-sizing: border-box;
		position: absolute;
		left: 50%;
		top: 50%;
		--orbit: calc((var(--logo-size) * 0.5) - (var(--logo-size) * 0.2) - var(--border-thickness));
		--clampx: clamp(-0.5, var(--mx), 0.5);
		--clampy: clamp(-0.5, var(--my), 0.5);
		transform: translate(
			calc(-50% + (var(--clampx) * var(--orbit) * 2)),
			calc(-50% + (var(--clampy) * var(--orbit) * 2))
		);
		transition: transform 0.05s linear;
		will-change: transform;
	}

	.content {
		position: relative;
		z-index: 2;
		color: white;
		padding: 80px 24px 160px;
		max-width: 1000px;
		margin: 0 auto;
		min-height: 200vh;
	}

	.filler {
		height: 100vh;
	}

	.back-g {
		width: 100vw;
		height: 100vh;
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		background: #101010;
		box-shadow: inset 0 0 200px 30px black;
	}

	@media (max-width: 768px) {
		.cell.cloud-cell {
			min-width: 100%;
		}
		.grid-uniform {
			grid-template-columns: 1fr;
		}
	}

	.form-sentinel {
		width: 100%;
		height: 1px;
	}

	/* STICKY-ONLY FORM DOCK (no fixed) */
	.form-dock {
		position: sticky;
		top: var(--form-fix-top);
		z-index: 9999;
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.form-container {
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
		padding: 0 24px;
		box-sizing: border-box;
	}

	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.contact-form input,
	.contact-form textarea {
		width: 100%;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		padding: 16px;
		font-size: 1rem;
		color: white;
		font-family: inherit;
		backdrop-filter: blur(10px);
		transition: all 0.3s ease;
	}

	.contact-form input:focus,
	.contact-form textarea:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.6);
	}

	.contact-form button {
		margin-top: 16px;
		background: white;
		color: black;
		border: none;
		border-radius: 8px;
		padding: 16px;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		transition: all 0.2s ease;
	}

	.contact-form button:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(255, 255, 255, 0.2);
	}

	.contact-form button:active {
		transform: scale(0.98);
	}

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
		will-change: transform;
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
		top: 0;
		left: 0;
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
