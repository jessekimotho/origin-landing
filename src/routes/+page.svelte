<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { spring } from 'svelte/motion';

	// ---------------------------------------------------------
	// PREFERS REDUCED MOTION
	// ---------------------------------------------------------
	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

	// ---------------------------------------------------------
	// THEME (Light/Dark) — persistent + system fallback
	// ---------------------------------------------------------
	type Theme = 'dark' | 'light';
	let theme: Theme = 'dark';

	function getSystemTheme(): Theme {
		if (typeof window === 'undefined') return 'dark';
		return window.matchMedia?.('(prefers-color-scheme: light)')?.matches ? 'light' : 'dark';
	}

	function loadTheme(): Theme {
		if (typeof window === 'undefined') return 'dark';
		const saved = window.localStorage.getItem('origin-theme') as Theme | null;
		return saved === 'light' || saved === 'dark' ? saved : getSystemTheme();
	}

	function applyTheme(t: Theme) {
		theme = t;
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.theme = t;
			document.documentElement.style.colorScheme = t;
		}
		if (typeof window !== 'undefined') window.localStorage.setItem('origin-theme', t);
	}

	function toggleTheme() {
		applyTheme(theme === 'dark' ? 'light' : 'dark');
	}

	// ---------------------------------------------------------
	// TIMELINE CONFIG (semantic + human readable)
	// - durationPx controls "how long it stays on"
	// - phases control in/hold/out windows inside that duration
	// ---------------------------------------------------------
	type Phase = { at: number; dur: number }; // normalized 0..1
	type Phases = { in?: Phase; hold?: Phase; out?: Phase };

	type TrackId = 'intro' | 'track1' | 'grid1' | 'track2' | 'grid2' | 'track3' | 'form';

	type TrackSpec = {
		id: TrackId;
		label?: string;
		durationPx: number;
		phases: Phases;
		centerOffsetPx?: number;
	};

	const TIMELINE: TrackSpec[] = [
		{
			id: 'intro',
			label: 'Intro Logo',
			durationPx: 1200,
			phases: {
				in: { at: 0.0, dur: 0.25 },
				hold: { at: 0.25, dur: 0.55 },
				out: { at: 0.8, dur: 0.2 }
			},
			centerOffsetPx: 0
		},
		{
			id: 'track1',
			label: 'Message 1',
			durationPx: 2600,
			phases: {
				in: { at: 0.0, dur: 0.18 },
				hold: { at: 0.18, dur: 0.64 },
				out: { at: 0.82, dur: 0.18 }
			},
			centerOffsetPx: -40
		},
		{
			id: 'grid1',
			label: 'Identity Grid',
			durationPx: 2600,
			phases: {
				in: { at: 0.0, dur: 0.12 },
				hold: { at: 0.12, dur: 0.76 },
				out: { at: 0.88, dur: 0.12 }
			},
			centerOffsetPx: 0
		},
		{
			id: 'track2',
			label: 'Message 2',
			durationPx: 2600,
			phases: {
				in: { at: 0.0, dur: 0.18 },
				hold: { at: 0.18, dur: 0.64 },
				out: { at: 0.82, dur: 0.18 }
			},
			centerOffsetPx: -40
		},
		{
			id: 'grid2',
			label: 'Breakthrough Grid',
			durationPx: 2600,
			phases: {
				in: { at: 0.0, dur: 0.12 },
				hold: { at: 0.12, dur: 0.76 },
				out: { at: 0.88, dur: 0.12 }
			},
			centerOffsetPx: 0
		},
		{
			id: 'track3',
			label: 'Message 3',
			durationPx: 2000,
			phases: {
				in: { at: 0.0, dur: 0.2 },
				hold: { at: 0.2, dur: 0.6 },
				out: { at: 0.8, dur: 0.2 }
			},
			centerOffsetPx: -40
		},
		{
			id: 'form',
			label: 'Contact Form',
			durationPx: 1600,
			phases: {
				in: { at: 0.0, dur: 0.18 },
				hold: { at: 0.18, dur: 0.64 },
				out: { at: 0.82, dur: 0.18 }
			},
			centerOffsetPx: 0
		}
	];

	const specById = new Map<TrackId, TrackSpec>(TIMELINE.map((t) => [t.id, t]));

	// ---------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------
	const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

	function phaseValue(p: number, ph?: Phase) {
		if (!ph) return 0;
		return clamp01((p - ph.at) / ph.dur);
	}

	function inHoldOut(p: number, phases: Phases) {
		const pin = phaseValue(p, phases.in);
		const pout = phaseValue(p, phases.out);
		const envelope = clamp01(pin * (1 - pout));

		const opacity = envelope;
		const blur = lerp(14, 0, pin) + lerp(0, 14, pout);
		const scale = lerp(0.985, 1.0, pin) * lerp(1.0, 0.985, pout);

		const hold = phases.hold ? phaseValue(p, phases.hold) : 0;
		return { pin, pout, hold, envelope, opacity, blur, scale };
	}

	function getArticle(word: string) {
		return /^[aeiou]/i.test(word) ? 'an' : 'a';
	}

	// ---------------------------------------------------------
	// PIXEL HOVER ACTION (scroll-safe + optimized)
	// ---------------------------------------------------------
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

	function pixelHover(node: HTMLElement, opts: HoverOptions) {
		const {
			gap = 6,
			speed = 0.035,
			colors = ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.35)'],
			noFocus = false
		} = opts || {};

		const canvas = node.querySelector('canvas');
		if (!canvas) return;

		const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
		if (!ctx) return;

		let pixels: Pixel[] = [];
		let raf = 0;
		let hovering = false;
		let isVisible = true;

		let cssW = 0;
		let cssH = 0;
		let dpr = 1;

		const rand = (min: number, max: number) => Math.random() * (max - min) + min;

		function resize() {
			const r = canvas.getBoundingClientRect();
			cssW = Math.max(1, Math.floor(r.width));
			cssH = Math.max(1, Math.floor(r.height));

			dpr = Math.min(2, window.devicePixelRatio || 1);
			const w = Math.floor(cssW * dpr);
			const h = Math.floor(cssH * dpr);

			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
				canvas.style.width = `${cssW}px`;
				canvas.style.height = `${cssH}px`;
			}

			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			pixels = [];
			const centerX = cssW / 2;
			const centerY = cssH / 2;

			for (let x = 0; x < cssW; x += gap) {
				for (let y = 0; y < cssH; y += gap) {
					const color = colors[(Math.random() * colors.length) | 0];
					const minSize = 0.5;
					const maxSizeInteger = 2;
					const maxSize = rand(minSize, maxSizeInteger);
					const dx = x - centerX;
					const dy = y - centerY;
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
						counterStep: Math.random() * 4 + (cssW + cssH) * 0.01,
						delay,
						idle: true,
						spd: rand(0.1, 0.9) * (prefersReducedMotion ? 0 : speed)
					});
				}
			}
		}

		function drawFrame() {
			ctx.clearRect(0, 0, cssW, cssH);
			let allIdle = true;

			const buckets = new Map<string, Pixel[]>();

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

					allIdle = false;
				} else {
					p.shimmer = false;
					p.counter = 0;

					if (p.size <= 0) {
						p.size = 0;
						p.idle = true;
					} else {
						p.size -= 0.1;
						p.idle = false;
						allIdle = false;
					}
				}

				if (p.size > 0) {
					const arr = buckets.get(p.color);
					if (arr) arr.push(p);
					else buckets.set(p.color, [p]);
				}
			}

			for (const [color, arr] of buckets) {
				ctx.fillStyle = color;
				for (let i = 0; i < arr.length; i++) {
					const p = arr[i];
					const centerOffset = p.maxSizeInteger * 0.5 - p.size * 0.5;
					ctx.fillRect(p.x + centerOffset, p.y + centerOffset, p.size, p.size);
				}
			}

			if (!isVisible || (!hovering && allIdle)) {
				raf = 0;
				if (!hovering) ctx.clearRect(0, 0, cssW, cssH);
				return;
			}

			raf = requestAnimationFrame(drawFrame);
		}

		const ro = new ResizeObserver(() => {
			resize();
			if (isVisible && hovering && !raf) raf = requestAnimationFrame(drawFrame);
		});

		const io = new IntersectionObserver(
			([entry]) => {
				isVisible = entry.isIntersecting;
				if (!isVisible) {
					cancelAnimationFrame(raf);
					raf = 0;
					return;
				}
				if (hovering && !raf) raf = requestAnimationFrame(drawFrame);
			},
			{ root: null, threshold: 0.01 }
		);

		function onEnter() {
			if (noFocus) return;
			hovering = true;
			if (isVisible && !raf) raf = requestAnimationFrame(drawFrame);
		}
		function onLeave() {
			hovering = false;
			if (isVisible && !raf) raf = requestAnimationFrame(drawFrame);
		}

		resize();
		ro.observe(node);
		io.observe(node);
		node.addEventListener('mouseenter', onEnter);
		node.addEventListener('mouseleave', onLeave);

		return {
			destroy() {
				ro.disconnect();
				io.disconnect();
				node.removeEventListener('mouseenter', onEnter);
				node.removeEventListener('mouseleave', onLeave);
				cancelAnimationFrame(raf);
			}
		};
	}

	// ---------------------------------------------------------
	// DATA
	// ---------------------------------------------------------
	interface LineData {
		size: 'medium' | 'larger';
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
	const linesByTrack = [lines1, lines2, lines3];

	// text reveal estimation (or compute from lines if you want)
	const ESTIMATED_WORDS = 22;

	// base grid models (we'll theme palettes below)
	const gridCellsBase = [
		{ label: 'Public Figure', active: '#e3e3e3', gap: 6, speed: 0.035 },
		{ label: 'Donor', active: '#e0f2fe', gap: 10, speed: 0.025 },
		{ label: 'Content Creator', active: '#fef08a', gap: 3, speed: 0.02 },
		{ label: 'Investor', active: '#fecdd3', gap: 6, speed: 0.08 },
		{ label: 'Health Player', active: '#c7d2fe', gap: 6, speed: 0.03 },
		{ label: 'Policymaker', active: '#bbf7d0', gap: 8, speed: 0.03 },
		{ label: 'Patient', active: '#fde68a', gap: 6, speed: 0.035 },
		{ label: 'Family Member', active: '#fbcfe8', gap: 7, speed: 0.03 },
		{ label: 'Translational Scientist', active: '#cffafe', gap: 9, speed: 0.03 },
		{ label: 'Attorney', active: '#ddd6fe', gap: 6, speed: 0.03 },
		{ label: 'Research Engineer', active: '#d1fae5', gap: 7, speed: 0.03 }
	];

	const breakthroughCellsBase = [
		{ title: 'Precision Editing', desc: 'CRISPR 2.0 targeting root genetic causes.' },
		{ title: 'Digital Twins', desc: 'AI models predicting patient outcomes.' },
		{ title: 'Continuous Sensing', desc: 'Wearables detecting biomarkers in real-time.' },
		{ title: 'mRNA Therapeutics', desc: 'Programmable medicine for immune response.' },
		{ title: 'Microbiome Mapping', desc: 'Gut flora analysis for metabolic health.' },
		{ title: 'Neural Interfaces', desc: 'Brain-computer bridges for restoration.' }
	];

	// THEME-AWARE pixel palettes (deep audit fix)
	// - Dark: brighter pixels
	// - Light: darker pixels
	$: isLight = theme === 'light';

	$: pixelPaletteNeutral = isLight
		? ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0.16)']
		: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.38)', 'rgba(255,255,255,0.25)'];

	$: pixelPaletteBlue = isLight
		? ['rgba(2,132,199,0.10)', 'rgba(2,132,199,0.16)', 'rgba(2,132,199,0.22)']
		: ['rgba(186,230,253,0.75)', 'rgba(56,189,248,0.55)', 'rgba(2,132,199,0.35)'];

	$: pixelPaletteYellow = isLight
		? ['rgba(161,98,7,0.10)', 'rgba(161,98,7,0.16)', 'rgba(161,98,7,0.22)']
		: ['rgba(254,240,138,0.75)', 'rgba(253,224,71,0.55)', 'rgba(234,179,8,0.35)'];

	$: pixelPalettePink = isLight
		? ['rgba(190,24,93,0.10)', 'rgba(190,24,93,0.16)', 'rgba(190,24,93,0.22)']
		: ['rgba(251,207,232,0.75)', 'rgba(244,114,182,0.55)', 'rgba(219,39,119,0.35)'];

	$: pixelPaletteGreen = isLight
		? ['rgba(21,128,61,0.10)', 'rgba(21,128,61,0.16)', 'rgba(21,128,61,0.22)']
		: ['rgba(187,247,208,0.75)', 'rgba(134,239,172,0.55)', 'rgba(34,197,94,0.35)'];

	$: pixelPaletteViolet = isLight
		? ['rgba(91,33,182,0.10)', 'rgba(91,33,182,0.16)', 'rgba(91,33,182,0.22)']
		: ['rgba(221,214,254,0.75)', 'rgba(196,181,253,0.55)', 'rgba(124,58,237,0.35)'];

	// map palettes to the identity grid (keeps your labels, but makes hover match theme)
	$: gridCells = gridCellsBase.map((c) => {
		let colors = pixelPaletteNeutral;

		if (c.label === 'Donor') colors = pixelPaletteBlue;
		if (c.label === 'Content Creator') colors = pixelPaletteYellow;
		if (c.label === 'Investor') colors = pixelPalettePink;
		if (c.label === 'Policymaker') colors = pixelPaletteGreen;
		if (c.label === 'Attorney') colors = pixelPaletteViolet;

		return { ...c, colors };
	});

	// breakthough grid palettes (theme-aware but varied)
	$: breakthroughCells = breakthroughCellsBase.map((b, idx) => {
		const palettes = [
			pixelPaletteGreen,
			pixelPaletteBlue,
			pixelPaletteYellow,
			pixelPaletteViolet,
			pixelPalettePink,
			pixelPaletteNeutral
		];
		return { ...b, colors: palettes[idx % palettes.length] };
	});

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
		'Statins',
		'Metformin',
		'IL-6 Elevation',
		'TNF-alpha',
		'Stroke Risk x2',
		'Myocardial Infarction',
		'Nephropathy',
		'Cancer Correlation'
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

	// ---------------------------------------------------------
	// STATE: scroll ranges (px-based timeline)
	// ---------------------------------------------------------
	let scrollParent: HTMLElement | null = null;
	const trackEls: Partial<Record<TrackId, HTMLElement>> = {};
	const ranges = new Map<TrackId, { start: number; len: number }>();

	let scrollTop = 0;

	// progress per section (0..1)
	let pIntro = 0;
	let pTrack1 = 0;
	let pGrid1 = 0;
	let pTrack2 = 0;
	let pGrid2 = 0;
	let pTrack3 = 0;
	let pForm = 0;

	// word reveal indices
	let visibleWord1 = -1;
	let visibleWord2 = -1;
	let visibleWord3 = -1;

	// grid selection
	let selectedCellIndex = -1;
	let isFading = false;

	function handleCellClick(index: number) {
		if (selectedCellIndex !== -1) return;
		isFading = true;
		setTimeout(() => {
			selectedCellIndex = index;
		}, 400);
	}

	// ---------------------------------------------------------
	// Mouse (parallax + gradient interactive blob)
	// Boss request: ORIGIN inner circle must START at NE, then track mouse
	// -> initialize mouseCoords to NE (x=+0.5, y=-0.5)
	// ---------------------------------------------------------
	let mouseCoords = spring({ x: 0.5, y: -0.5 }, { stiffness: 0.05, damping: 0.25 });
	let mouseRaf = 0;
	let lastMouse: MouseEvent | null = null;

	// ---------------------------------------------------------
	// Theme toggle hover physics
	// ---------------------------------------------------------
	let themeToggleEl: HTMLElement | null = null;
	let toggleCenter = { x: 0, y: 0 };
	let toggleSpring = spring({ scale: 0.63, opacity: 0.5 }, { stiffness: 0.1, damping: 0.25 });

	function updateToggleCenter() {
		if (themeToggleEl) {
			const r = themeToggleEl.getBoundingClientRect();
			toggleCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
		}
	}

	// Gradient blob tracking (restored)
	let bubbleEl: HTMLElement | null = null;
	let gradientContainerEl: HTMLElement | null = null;

	let bubbleTargetX = 0,
		bubbleTargetY = 0,
		bubbleX = 0,
		bubbleY = 0;

	let bubbleRaf = 0;
	let gradientVisible = true;

	function updateBubbleTargetFromMouse(e: MouseEvent) {
		if (!gradientContainerEl) return;
		const rect = gradientContainerEl.getBoundingClientRect();
		bubbleTargetX = e.clientX - rect.left;
		bubbleTargetY = e.clientY - rect.top;
	}

	function animateBubble() {
		if (!bubbleEl || prefersReducedMotion || document.hidden || !gradientVisible) {
			bubbleRaf = 0;
			return;
		}
		const ease = 0.12;
		bubbleX += (bubbleTargetX - bubbleX) * ease;
		bubbleY += (bubbleTargetY - bubbleY) * ease;
		bubbleEl.style.transform = `translate3d(${bubbleX}px, ${bubbleY}px, 0) translate(-50%, -50%)`;
		bubbleRaf = requestAnimationFrame(animateBubble);
	}

	function ensureBubbleRunning() {
		if (bubbleRaf || prefersReducedMotion || !gradientVisible || document.hidden) return;
		bubbleRaf = requestAnimationFrame(animateBubble);
	}

	function stopBubble() {
		cancelAnimationFrame(bubbleRaf);
		bubbleRaf = 0;
	}

	function handleMouseMove(e: MouseEvent) {
		if (document.hidden || prefersReducedMotion) return;

		lastMouse = e;
		if (mouseRaf) return;

		mouseRaf = requestAnimationFrame(() => {
			mouseRaf = 0;
			if (!lastMouse) return;

			// normalized -0.5..+0.5
			const x = lastMouse.clientX / window.innerWidth - 0.5;
			const y = lastMouse.clientY / window.innerHeight - 0.5;
			mouseCoords.set({ x, y });

			// update interactive blob target
			updateBubbleTargetFromMouse(lastMouse);

			// update theme toggle physics
			if (themeToggleEl) {
				const dx = lastMouse.clientX - toggleCenter.x;
				const dy = lastMouse.clientY - toggleCenter.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const maxDist = 300; // range of effect in px
				const prox = Math.max(0, 1 - dist / maxDist);
				// optional ease
				const t = prox;

				// scale: 0.63 -> 1.05
				const targetScale = 0.63 + (1.05 - 0.63) * t;
				// opacity: 0.5 -> 1.0
				const targetOpacity = 0.5 + (1 - 0.5) * t;

				toggleSpring.set({ scale: targetScale, opacity: targetOpacity });
			}

			ensureBubbleRunning();
		});
	}

	// ---------------------------------------------------------
	// Progress from ranges
	// ---------------------------------------------------------
	function rebuildRanges() {
		if (!scrollParent) return;

		(Object.keys(trackEls) as TrackId[]).forEach((id) => {
			const el = trackEls[id];
			const spec = specById.get(id);
			if (!el || !spec) return;

			ranges.set(id, { start: el.offsetTop, len: spec.durationPx });
		});
	}

	function progressFor(id: TrackId) {
		const r = ranges.get(id);
		if (!r || !scrollParent) return 0;
		const y = scrollParent.scrollTop;
		return clamp01((y - r.start) / r.len);
	}

	// ---------------------------------------------------------
	// Derived animation values
	// ---------------------------------------------------------
	$: introFx = inHoldOut(pIntro, specById.get('intro')!.phases);
	$: t1Fx = inHoldOut(pTrack1, specById.get('track1')!.phases);
	$: g1Fx = inHoldOut(pGrid1, specById.get('grid1')!.phases);
	$: t2Fx = inHoldOut(pTrack2, specById.get('track2')!.phases);
	$: g2Fx = inHoldOut(pGrid2, specById.get('grid2')!.phases);
	$: t3Fx = inHoldOut(pTrack3, specById.get('track3')!.phases);
	$: formFx = inHoldOut(pForm, specById.get('form')!.phases);

	// Intro logo morph
	const START_GAP = 64;
	const END_GAP = 36;
	const START_FONT = 26;
	const END_FONT = 20;
	const START_LETTER = 32;
	const END_LETTER = 8;

	$: morphT = clamp01(introFx.hold);
	$: logoGapPx = `${lerp(START_GAP, END_GAP, morphT).toFixed(2)}px`;
	$: restFontPx = `${lerp(START_FONT, END_FONT, morphT).toFixed(2)}px`;
	$: restLetterPx = `${lerp(START_LETTER, END_LETTER, morphT).toFixed(2)}px`;

	// Background fade
	const BG_FADE_PX = 900;
	$: bgFxOpacity = 1 - clamp01(scrollTop / BG_FADE_PX);

	// Typography (you can make this responsive if needed)
	const BASE_MEDIUM = 55;
	const BASE_LARGE = 80;
	let dynamicMedium = BASE_MEDIUM;
	let dynamicLarge = BASE_LARGE;

	const centerOffset = (id: TrackId) => `${specById.get(id)?.centerOffsetPx ?? 0}px`;

	// ---------------------------------------------------------
	// Scroll loop (single RAF)
	// ---------------------------------------------------------
	let ticking = false;
	function onScroll() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			update();
			ticking = false;
		});
	}

	function update() {
		if (!scrollParent) return;
		scrollTop = scrollParent.scrollTop;

		pIntro = progressFor('intro');
		pTrack1 = progressFor('track1');
		pGrid1 = progressFor('grid1');
		pTrack2 = progressFor('track2');
		pGrid2 = progressFor('grid2');
		pTrack3 = progressFor('track3');
		pForm = progressFor('form');

		// reveal driven by HOLD window (semantic)
		visibleWord1 = Math.floor(t1Fx.hold * (ESTIMATED_WORDS + 2)) - 1;
		visibleWord2 = Math.floor(t2Fx.hold * (ESTIMATED_WORDS + 2)) - 1;
		visibleWord3 = Math.floor(t3Fx.hold * (ESTIMATED_WORDS + 2)) - 1;
	}

	function handleResize() {
		dynamicMedium = BASE_MEDIUM;
		dynamicLarge = BASE_LARGE;

		rebuildRanges();
		update();
		updateToggleCenter();

		// keep bubble centered after resize
		if (gradientContainerEl) {
			const r = gradientContainerEl.getBoundingClientRect();
			bubbleTargetX = r.width * 0.5;
			bubbleTargetY = r.height * 0.5;
			bubbleX = bubbleTargetX;
			bubbleY = bubbleTargetY;
			if (bubbleEl)
				bubbleEl.style.transform = `translate3d(${bubbleX}px, ${bubbleY}px, 0) translate(-50%, -50%)`;
		}
	}

	// spacer style
	function trackStyle(id: TrackId) {
		return `--track-len:${specById.get(id)!.durationPx}px; --center-offset:${centerOffset(id)};`;
	}

	function onCellKeydown(e: KeyboardEvent, i: number) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleCellClick(i);
		}
	}

	// ---------------------------------------------------------
	// Mount / destroy
	// ---------------------------------------------------------
	let cleanup: (() => void)[] = [];

	onMount(() => {
		applyTheme(loadTheme());

		const mq = window.matchMedia?.('(prefers-color-scheme: light)');
		const onSystem = () => {
			const saved = window.localStorage.getItem('origin-theme');
			if (saved !== 'light' && saved !== 'dark') applyTheme(getSystemTheme());
		};
		mq?.addEventListener?.('change', onSystem);

		scrollParent?.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', handleResize);
		window.addEventListener('mousemove', handleMouseMove);

		// gradient visibility gating (deep audit: avoid RAF when offscreen)
		let io: IntersectionObserver | null = null;
		if (gradientContainerEl) {
			io = new IntersectionObserver(
				([entry]) => {
					gradientVisible = entry.isIntersecting;
					if (gradientVisible) ensureBubbleRunning();
					else stopBubble();
				},
				{ root: null, threshold: 0.01 }
			);
			io.observe(gradientContainerEl);

			// initial bubble position = center
			const r = gradientContainerEl.getBoundingClientRect();
			bubbleTargetX = r.width * 0.5;
			bubbleTargetY = r.height * 0.5;
			bubbleX = bubbleTargetX;
			bubbleY = bubbleTargetY;
			if (bubbleEl)
				bubbleEl.style.transform = `translate3d(${bubbleX}px, ${bubbleY}px, 0) translate(-50%, -50%)`;
		}

		const onVis = () => {
			if (document.hidden) stopBubble();
			else ensureBubbleRunning();
		};
		document.addEventListener('visibilitychange', onVis);

		requestAnimationFrame(() => {
			rebuildRanges();
			update();
			updateToggleCenter();
		});

		cleanup.push(() => {
			mq?.removeEventListener?.('change', onSystem);
			scrollParent?.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('visibilitychange', onVis);
			io?.disconnect();
			stopBubble();
		});
	});

	onDestroy(() => {
		cleanup.forEach((fn) => fn());
		cleanup = [];
	});
</script>

<!-- Fixed Theme Toggle -->
<button
	class="theme-toggle"
	type="button"
	bind:this={themeToggleEl}
	style="transform: scale({$toggleSpring.scale}); opacity: {$toggleSpring.opacity}; color: {theme ===
	'light'
		? '#000000'
		: 'rgba(255,255,255,0.9)'}; transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;"
	aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
	on:click={toggleTheme}
>
	{#if theme === 'dark'}
		<!-- Moon (Current State) -->
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M21 13.2A7.5 7.5 0 0 1 10.8 3a9 9 0 1 0 10.2 10.2Z"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{:else}
		<!-- Sun (Current State) -->
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-16V1m0 22v-1m11-10h-1M2 12H1m19.78 7.78-.7-.7M4.92 4.92l-.7-.7m16.26 0-.7.7M4.92 19.08l-.7.7"
				fill="none"
				stroke="black"
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
	{/if}
</button>

<div class="back-g"></div>

<main bind:this={scrollParent}>
	<div class="bg-fx" style="opacity:{bgFxOpacity}">
		<div class="gradient-bg" bind:this={gradientContainerEl}>
			<!-- Goo filter -->
			<svg style="position:absolute; width:0; height:0;">
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

				<!-- Interactive blob that tracks mouse (restored) -->
				<div class="interactive" bind:this={bubbleEl}>
					<div class="core"></div>
				</div>
			</div>
		</div>
	</div>

	<!-- INTRO -->
	<section class="scroll-track intro-track" bind:this={trackEls.intro} style={trackStyle('intro')}>
		<div class="sticky-viewport">
			<div
				class="logo-dock"
				style="
          --gap:{logoGapPx};
          --rest-font:{restFontPx};
          --rest-letter:{restLetterPx};
          --intro-opacity:{introFx.opacity};
          --intro-blur:{introFx.blur}px;
          --intro-scale:{introFx.scale};
          --mx: {$mouseCoords.x};
          --my: {$mouseCoords.y};
        "
			>
				<div class="logo-mark">
					<div class="origin-logo">
						<div class="inner-circle"></div>
					</div>
					<div class="rest-of-word">ORIGIN</div>
				</div>
			</div>

			<div class="prompt" style="opacity:{introFx.opacity}">Scroll BELOW to access the site</div>
		</div>
		<div class="spacer"></div>
	</section>

	<!-- TRACK 1 -->
	<section class="scroll-track" bind:this={trackEls.track1} style={trackStyle('track1')}>
		<div class="sticky-viewport">
			<div
				class="cloud-container"
				style="--mx: {$mouseCoords.x}; --my: {$mouseCoords.y}; --sp:{pTrack1};"
			>
				{#each cloudItems as item (item.id)}
					<div
						class="cloud-item"
						style="--x:{item.x}; --y:{item.y}; --d:{item.depth}; --op:{item.opacity}; --sc:{item.scale};"
					>
						{item.text}
					</div>
				{/each}
			</div>

			<div
				class="text-dock"
				style="
          --center-offset:{centerOffset('track1')};
          --dock-opacity:{t1Fx.opacity};
          --dock-blur:{t1Fx.blur}px;
          --dock-scale:{t1Fx.scale};
          --fs-medium:{dynamicMedium}px;
          --fs-large:{dynamicLarge}px;
        "
			>
				<div class="text-inner">
					<div class="revision-container" class:fading={isFading}>
						{#each linesByTrack[0] as line (line.text)}
							<div class="line {line.size}">
								{#each line.words as word (word.globalIndex)}
									<span class="word" class:active={word.globalIndex <= visibleWord1}>
										{word.text}&nbsp;
									</span>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
		<div class="spacer"></div>
	</section>

	<!-- GRID 1 -->
	<section class="scroll-track" bind:this={trackEls.grid1} style={trackStyle('grid1')}>
		<div class="sticky-viewport">
			<div
				class="grid-dock"
				style="
          --dock-opacity:{g1Fx.opacity};
          --dock-blur:{g1Fx.blur}px;
          --dock-scale:{g1Fx.scale};
          --center-offset:{centerOffset('grid1')};
        "
			>
				<div class="grid-wrapper">
					<div class="grid-cloud">
						{#each gridCells as c, i (c.label)}
							<div
								role="button"
								tabindex="0"
								class="cell cloud-cell"
								class:selected-mode={selectedCellIndex !== -1}
								class:is-chosen={selectedCellIndex === i}
								class:fading={selectedCellIndex !== -1 && selectedCellIndex !== i}
								style="--active-color:{c.active}"
								use:pixelHover={{
									gap: c.gap,
									speed: c.speed,
									colors: c.colors,
									noFocus: selectedCellIndex !== -1
								}}
								on:click={() => handleCellClick(i)}
								on:keydown={(e) => onCellKeydown(e, i)}
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
		</div>
		<div class="spacer"></div>
	</section>

	<!-- TRACK 2 -->
	<section class="scroll-track" bind:this={trackEls.track2} style={trackStyle('track2')}>
		<div class="sticky-viewport">
			<div
				class="cloud-container"
				style="--mx: {$mouseCoords.x}; --my: {$mouseCoords.y}; --sp:{pTrack2};"
			>
				{#each cloudItems as item (item.id)}
					<div
						class="cloud-item"
						style="--x:{item.x}; --y:{item.y}; --d:{item.depth}; --op:{item.opacity}; --sc:{item.scale};"
					>
						{item.text}
					</div>
				{/each}
			</div>

			<div
				class="text-dock"
				style="
          --center-offset:{centerOffset('track2')};
          --dock-opacity:{t2Fx.opacity};
          --dock-blur:{t2Fx.blur}px;
          --dock-scale:{t2Fx.scale};
          --fs-medium:{dynamicMedium}px;
          --fs-large:{dynamicLarge}px;
        "
			>
				<div class="text-inner">
					<div class="revision-container">
						{#each linesByTrack[1] as line (line.text)}
							<div class="line {line.size}">
								{#each line.words as word (word.globalIndex)}
									<span class="word" class:active={word.globalIndex <= visibleWord2}>
										{word.text}&nbsp;
									</span>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
		<div class="spacer"></div>
	</section>

	<!-- GRID 2 -->
	<section class="scroll-track" bind:this={trackEls.grid2} style={trackStyle('grid2')}>
		<div class="sticky-viewport">
			<div
				class="grid-dock"
				style="
          --dock-opacity:{g2Fx.opacity};
          --dock-blur:{g2Fx.blur}px;
          --dock-scale:{g2Fx.scale};
          --center-offset:{centerOffset('grid2')};
        "
			>
				<div class="grid-wrapper">
					<div class="grid-uniform">
						{#each breakthroughCells as item (item.title)}
							<div
								class="cell uniform-cell"
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
		</div>
		<div class="spacer"></div>
	</section>

	<!-- TRACK 3 -->
	<section class="scroll-track" bind:this={trackEls.track3} style={trackStyle('track3')}>
		<div class="sticky-viewport">
			<div
				class="cloud-container"
				style="--mx: {$mouseCoords.x}; --my: {$mouseCoords.y}; --sp:{pTrack3};"
			>
				{#each cloudItems as item (item.id)}
					<div
						class="cloud-item"
						style="--x:{item.x}; --y:{item.y}; --d:{item.depth}; --op:{item.opacity}; --sc:{item.scale};"
					>
						{item.text}
					</div>
				{/each}
			</div>

			<div
				class="text-dock"
				style="
          --center-offset:{centerOffset('track3')};
          --dock-opacity:{t3Fx.opacity};
          --dock-blur:{t3Fx.blur}px;
          --dock-scale:{t3Fx.scale};
          --fs-medium:{dynamicMedium}px;
          --fs-large:{dynamicLarge}px;
        "
			>
				<div class="text-inner">
					<div class="revision-container">
						{#each linesByTrack[2] as line (line.text)}
							<div class="line {line.size}">
								{#each line.words as word (word.globalIndex)}
									<span class="word" class:active={word.globalIndex <= visibleWord3}>
										{word.text}&nbsp;
									</span>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
		<div class="spacer"></div>
	</section>

	<!-- FORM -->
	<section class="scroll-track" bind:this={trackEls.form} style={trackStyle('form')}>
		<div class="sticky-viewport">
			<div
				class="form-dock"
				style="
          --dock-opacity:{formFx.opacity};
          --dock-blur:{formFx.blur}px;
          --dock-scale:{formFx.scale};
          --center-offset:{centerOffset('form')};
        "
			>
				<div class="form-container">
					<div class="contact-form">
						<input type="text" placeholder="Name" />
						<textarea placeholder="Message" rows="4"></textarea>
						<button>SEND</button>
					</div>
				</div>
			</div>
		</div>
		<div class="spacer"></div>
	</section>
</main>

<style>
	/* ---------------------------------------------------------
   * THEME TOKENS (deep audit: real mirroring)
   * --------------------------------------------------------- */
	:global(html) {
		/* DARK defaults */
		--bg: #09090b;
		--bg2: #101012;

		--text: rgba(255, 255, 255, 0.92);
		--muted: rgba(255, 255, 255, 0.62);
		--muted2: rgba(255, 255, 255, 0.42);

		--card: rgba(255, 255, 255, 0.04);
		--card-hover: rgba(255, 255, 255, 0.08);
		--border: rgba(255, 255, 255, 0.14);
		--border-strong: rgba(255, 255, 255, 0.24);

		--input: rgba(255, 255, 255, 0.06);
		--input-border: rgba(255, 255, 255, 0.22);

		/* Shadows (dark: stronger) */
		--shadow-sm: 0 8px 18px rgba(0, 0, 0, 0.45);
		--shadow-md: 0 14px 28px rgba(0, 0, 0, 0.52);
		--shadow-lg: 0 22px 55px rgba(0, 0, 0, 0.62);

		/* Text shadow (dark: helpful) */
		--text-shadow: 0 10px 26px rgba(0, 0, 0, 0.55);

		--bg-inset-shadow: inset 0 0 200px 30px rgba(0, 0, 0, 0.75);

		/* Gradient tuning */
		--grad-opacity: 0.22;
		--grad-blend: normal;
		--grad-filter: url(#goo) blur(30px);

		/* Blob colors (dark: vibrant) */
		--blue-rgb: 96, 165, 250;
		--pink-rgb: 232, 121, 249;
		--green-rgb: 94, 234, 212;

		/* Theme toggle */
		--toggle-bg: rgba(255, 255, 255, 0.08);
		--toggle-border: rgba(255, 255, 255, 0.18);
		--toggle-icon: rgba(255, 255, 255, 0.92);
	}

	:global(html[data-theme='light']) {
		--bg: #f6f7fb;
		--bg2: #ffffff;

		--text: rgba(12, 12, 20, 0.92);
		--muted: rgba(12, 12, 20, 0.62);
		--muted2: rgba(12, 12, 20, 0.42);

		--card: rgba(0, 0, 0, 0.03);
		--card-hover: rgba(0, 0, 0, 0.06);
		--border: rgba(0, 0, 0, 0.1);
		--border-strong: rgba(0, 0, 0, 0.18);

		--input: rgba(0, 0, 0, 0.04);
		--input-border: rgba(0, 0, 0, 0.14);

		/* Shadows (light: softer) */
		--shadow-sm: 0 8px 18px rgba(0, 0, 0, 0.1);
		--shadow-md: 0 14px 28px rgba(0, 0, 0, 0.12);
		--shadow-lg: 0 22px 55px rgba(0, 0, 0, 0.14);

		/* Text shadow (light: minimal) */
		--text-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);

		--bg-inset-shadow: inset 0 0 160px 24px rgba(0, 0, 0, 0.08);

		/* Gradients in light: lower opacity + multiply is cleaner */
		--grad-opacity: 0.14;
		--grad-blend: multiply;
		--grad-filter: url(#goo) blur(32px);

		/* Blob colors (light: slightly softer) */
		--blue-rgb: 70, 130, 220;
		--pink-rgb: 210, 90, 210;
		--green-rgb: 50, 190, 170;

		--toggle-bg: rgba(0, 0, 0, 0.06);
		--toggle-border: rgba(0, 0, 0, 0.12);
		--toggle-icon: rgba(0, 0, 0, 0.86);
	}

	/* -----------------------------
   * Fixed Theme Toggle
   * ----------------------------- */
	.theme-toggle {
		position: fixed;
		top: 18px;
		right: 18px;
		z-index: 100000;
		width: 44px;
		height: 44px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		color: var(--toggle-icon);
		cursor: pointer;
		transition:
			transform 0.15s ease,
			background 0.2s ease,
			border-color 0.2s ease;
	}

	.theme-toggle:hover {
		transform: translateY(-1px);
	}
	.theme-toggle:active {
		transform: scale(0.98);
	}
	.theme-toggle svg {
		width: 22px;
		height: 22px;
		display: block;
	}

	/* -----------------------------
   * Core layout
   * ----------------------------- */
	main {
		height: 100vh;
		width: 100vw;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		background: var(--bg);
		-webkit-overflow-scrolling: touch;
	}

	.scroll-track {
		position: relative;
	}
	.sticky-viewport {
		position: sticky;
		top: 0;
		height: 100vh;
		width: 100%;
		overflow: hidden;
	}
	.spacer {
		height: calc(var(--track-len) + 100vh);
	}

	/* -----------------------------
   * Background FX (deep audit: do NOT capture scroll)
   * ----------------------------- */
	.bg-fx {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none; /* critical: never block scroll */
	}

	.gradient-bg {
		width: 100%;
		height: 100%;
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none; /* keep scroll free; we track mouse via window listener */
	}

	.gradients-container {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;

		filter: var(--grad-filter);
		opacity: var(--grad-opacity);
		mix-blend-mode: var(--grad-blend);

		will-change: transform;
	}

	.back-g {
		width: 100vw;
		height: 100vh;
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		background: var(--bg2);
		box-shadow: var(--bg-inset-shadow);
	}

	/* -----------------------------
   * Gradient blobs
   * ----------------------------- */
	.g1,
	.g2,
	.g3,
	.g4,
	.g5 {
		width: 60%;
		height: 60%;
		opacity: 0.75;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		position: absolute;
		border-radius: 50%;
		mix-blend-mode: hard-light;
		animation-timing-function: ease-in-out;
		will-change: transform;
	}

	:global(html[data-theme='light']) .g1,
	:global(html[data-theme='light']) .g2,
	:global(html[data-theme='light']) .g3,
	:global(html[data-theme='light']) .g4,
	:global(html[data-theme='light']) .g5 {
		mix-blend-mode: normal;
		opacity: 0.65;
	}

	.g1 {
		background: radial-gradient(
			circle,
			rgba(var(--blue-rgb), 0.85) 0%,
			rgba(var(--blue-rgb), 0) 55%
		);
		animation: moveVertical 20s infinite;
	}

	.g2 {
		background: radial-gradient(
			circle,
			rgba(var(--pink-rgb), 0.85) 0%,
			rgba(var(--pink-rgb), 0) 55%
		);
		animation: moveInCircle 18s reverse infinite;
		transform-origin: 25% 50%;
	}

	.g3 {
		background: radial-gradient(
			circle,
			rgba(var(--green-rgb), 0.85) 0%,
			rgba(var(--green-rgb), 0) 55%
		);
		animation: moveInCircle 30s infinite;
		transform-origin: 75% 50%;
	}

	.g4 {
		background: radial-gradient(
			circle,
			rgba(var(--green-rgb), 0.7) 0%,
			rgba(var(--green-rgb), 0) 55%
		);
		animation: moveHorizontal 25s infinite;
		transform-origin: 35% 50%;
	}

	.g5 {
		background: radial-gradient(
			circle,
			rgba(var(--pink-rgb), 0.55) 0%,
			rgba(var(--pink-rgb), 0) 55%
		);
		width: 120%;
		height: 120%;
		animation: moveInCircle 22s infinite;
		transform-origin: 20% 75%;
	}

	.interactive {
		width: 260px;
		height: 260px;
		position: absolute;
		top: 0;
		left: 0;
		transform: translate3d(-50%, -50%, 0);
		pointer-events: none;
		will-change: transform;

		background: radial-gradient(
			circle,
			rgba(var(--green-rgb), 0.95) 0%,
			rgba(var(--green-rgb), 0.25) 62%
		);
		opacity: 0.75;
		filter: blur(12px);
		border: 1px solid rgba(var(--blue-rgb), 0.35);
		box-shadow: 0 0 42px rgba(var(--blue-rgb), 0.28);
	}

	:global(html[data-theme='light']) .interactive {
		opacity: 0.55;
		filter: blur(14px);
		box-shadow: 0 0 46px rgba(var(--blue-rgb), 0.18);
	}

	.interactive .core {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background-color: rgba(var(--green-rgb), 0.88);
		box-shadow: 0 0 14px rgba(var(--green-rgb), 0.42);
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
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

	/* -----------------------------
   * Intro + Logo (boss request: start NE)
   * - default NE comes from initial mouseCoords = {x:0.5,y:-0.5}
   * - clamped in CSS to avoid extremes
   * ----------------------------- */
	.logo-dock {
		position: absolute;
		top: 50vh;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		transform: translateY(-50%) scale(var(--intro-scale, 1));
		opacity: var(--intro-opacity, 1);
		filter: blur(var(--intro-blur, 0px));
		pointer-events: none;
		z-index: 5;
	}

	:global(:root) {
		--logo-size: 50px;
	}

	.logo-mark {
		display: flex;
		gap: var(--gap);
		justify-content: center;
		align-items: center;
		padding: 32px;
		color: var(--text);
	}

	.rest-of-word {
		font-size: var(--rest-font);
		letter-spacing: var(--rest-letter);
		color: var(--text);
	}

	.origin-logo {
		width: var(--logo-size);
		height: var(--logo-size);
		border: 3px solid currentColor;
		border-radius: 50%;
		box-sizing: border-box;
		position: relative;
	}

	:global(html[data-theme='light']) .origin-logo {
		color: #000000;
		border-color: #000000;
	}

	:global(html[data-theme='light']) .origin-logo .inner-circle {
		border-color: #000000;
	}

	.origin-logo .inner-circle {
		width: 40%;
		height: 40%;
		border: 3px solid currentColor;
		border-radius: 50%;
		box-sizing: border-box;
		position: absolute;
		left: 50%;
		top: 50%;

		--border-thickness: calc(var(--logo-size) / 10);
		--orbit: calc((var(--logo-size) * 0.5) - (var(--logo-size) * 0.2) - var(--border-thickness));

		/* clamp normalized mouse to [-0.5, +0.5] */
		--clampx: clamp(-0.5, var(--mx), 0.5);
		--clampy: clamp(-0.5, var(--my), 0.5);

		transform: translate(
			calc(-50% + (var(--clampx) * var(--orbit) * 2)),
			calc(-50% + (var(--clampy) * var(--orbit) * 2))
		);

		transition: transform 0.05s linear;
		will-change: transform;
	}

	.prompt {
		position: absolute;
		left: 50%;
		bottom: 50px;
		transform: translateX(-50%);
		z-index: 6;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		font-size: 12px;
		pointer-events: none;
		text-align: center;
		padding: 0 24px;
		color: var(--muted);
		animation: promptFade 1.6s ease-in-out infinite;
	}

	@keyframes promptFade {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.45;
		}
	}

	/* -----------------------------
   * Cloud
   * ----------------------------- */
	.cloud-container {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		overflow: hidden;
		perspective: 1000px;
	}

	.cloud-item {
		position: absolute;
		color: var(--muted2);
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
		left: 0;
		top: 0;
		white-space: nowrap;
		transition: opacity 0.5s ease;
		opacity: var(--op);
		font-size: calc(1rem * var(--sc));
		will-change: transform, opacity;

		transform: translate3d(calc(var(--x) * 1vw), calc(var(--y) * 1vh), 0)
			translate3d(
				calc(var(--mx) * var(--d) * -100px),
				calc((var(--my) * var(--d) * -50px) + (var(--sp) * var(--d) * -400px)),
				0
			);
	}

	/* -----------------------------
   * Centered docks
   * ----------------------------- */
	.text-dock,
	.grid-dock,
	.form-dock {
		position: absolute;
		top: calc(50vh + var(--center-offset, 0px));
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;

		transform: translateY(-50%) scale(var(--dock-scale, 1));
		opacity: var(--dock-opacity, 1);
		filter: blur(var(--dock-blur, 0px));
		will-change: transform, opacity, filter;
	}

	.text-dock {
		z-index: 10;
		pointer-events: none;
	}
	.grid-dock {
		z-index: 9999;
		pointer-events: none;
	}
	.form-dock {
		z-index: 9999;
		pointer-events: none;
	}

	.text-inner {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.revision-container {
		padding: 64px 24px;
		color: var(--text);
		text-shadow: var(--text-shadow);
		transition:
			opacity 0.8s ease,
			filter 0.8s ease,
			transform 0.8s ease;
	}

	:global(html[data-theme='light']) .revision-container,
	:global(html[data-theme='light']) .revision-container .line,
	:global(html[data-theme='light']) .revision-container .word {
		color: #000000 !important;
		text-shadow: none !important;
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

	/* -----------------------------
   * Grids (scroll-safe)
   * ----------------------------- */
	.grid-wrapper {
		display: flex;
		justify-content: center;
		width: min(1100px, calc(100vw - 48px));
		margin: 0 auto;
		pointer-events: auto;
		box-sizing: border-box;
		touch-action: pan-y pinch-zoom;
	}

	.grid-cloud {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 16px;
		width: 100%;
		pointer-events: auto;
		touch-action: pan-y pinch-zoom;
	}

	.grid-uniform {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		width: 100%;
		pointer-events: auto;
		touch-action: pan-y pinch-zoom;
	}

	.cell {
		position: relative;
		overflow: hidden;
		isolation: isolate;
		background: var(--card);
		border: 1px solid var(--border);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		color: var(--text);
		transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
		user-select: none;
		line-height: 1.3;
		touch-action: pan-y pinch-zoom;
	}

	.cell.cloud-cell {
		flex: 1 1 auto;
		min-width: 220px;
		max-width: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80px;
		padding: 0 32px;
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
		color: var(--muted);
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

	.cell-label {
		font-weight: 650;
		font-size: 1.1rem;
		transition: transform 0.4s cubic-bezier(0.2, 0, 0.2, 1);
		text-transform: capitalize;
	}

	.cell-title {
		font-weight: 750;
		font-size: 1.05rem;
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.cell-desc {
		font-size: 0.92rem;
		color: var(--muted);
		line-height: 1.4;
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

	.cell.fading {
		opacity: 0;
		transform: scale(0.9);
		pointer-events: none;
		filter: blur(8px);
	}

	.cell.is-chosen {
		position: sticky;
		top: 200px;
		left: 50%;
		transform: translateX(-50%) scale(1.2);
		z-index: 10000;
		margin: 0;
		width: 300px;
		height: 180px;
		border-color: var(--border-strong);
		background: var(--bg2);
		box-shadow: var(--shadow-lg);
	}

	.cell:not(.selected-mode):hover {
		background: var(--card-hover);
		border-color: var(--border-strong);
		transform: translateY(-2px) scale(1.01);
		box-shadow: var(--shadow-md);
		z-index: 10;
	}

	/* -----------------------------
   * Form
   * ----------------------------- */
	.form-container {
		width: min(520px, calc(100vw - 48px));
		margin: 0 auto;
		box-sizing: border-box;
		pointer-events: auto;
	}

	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.contact-form input,
	.contact-form textarea {
		width: 100%;
		background: var(--input);
		border: 1px solid var(--input-border);
		border-radius: 10px;
		padding: 16px;
		font-size: 1rem;
		color: var(--text);
		font-family: inherit;
		backdrop-filter: blur(10px);
		transition: all 0.25s ease;
	}

	.contact-form input:focus,
	.contact-form textarea:focus {
		outline: none;
		border-color: var(--border-strong);
		box-shadow: var(--shadow-sm);
	}

	.contact-form button {
		margin-top: 10px;
		background: var(--text);
		color: var(--bg);
		border: none;
		border-radius: 10px;
		padding: 16px;
		font-size: 1rem;
		font-weight: 800;
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		transition:
			transform 0.15s ease,
			box-shadow 0.2s ease;
	}

	.contact-form button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.contact-form button:active {
		transform: scale(0.98);
	}

	/* -----------------------------
   * Mobile
   * ----------------------------- */
	@media (max-width: 768px) {
		.cell.cloud-cell {
			min-width: 100%;
		}
		.grid-uniform {
			grid-template-columns: 1fr;
		}
		.theme-toggle {
			top: 14px;
			right: 14px;
		}
	}
</style>
