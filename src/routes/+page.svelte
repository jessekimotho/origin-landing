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
	// TIMELINE CONFIG (semantic + human readable)
	// - durationPx controls how long each section "stays on"
	// - phases control in/hold/out animation windows inside that duration
	// ---------------------------------------------------------
	type Phase = { at: number; dur: number }; // normalized 0..1
	type Phases = { in?: Phase; hold?: Phase; out?: Phase };

	type TrackId = 'intro' | 'track1' | 'grid1' | 'track2' | 'grid2' | 'track3' | 'form';

	type TrackSpec = {
		id: TrackId;
		label?: string;
		durationPx: number; // scroll length in px
		phases: Phases;
		centerOffsetPx?: number; // optional nudge for sticky centering
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
			}
		},
		{
			id: 'track1',
			label: 'Message 1',
			durationPx: 2400,
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
			durationPx: 2000,
			phases: {
				in: { at: 0.0, dur: 0.12 },
				hold: { at: 0.12, dur: 0.76 },
				out: { at: 0.88, dur: 0.12 }
			}
		},
		{
			id: 'track2',
			label: 'Message 2',
			durationPx: 2400,
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
			durationPx: 2000,
			phases: {
				in: { at: 0.0, dur: 0.12 },
				hold: { at: 0.12, dur: 0.76 },
				out: { at: 0.88, dur: 0.12 }
			}
		},
		{
			id: 'track3',
			label: 'Message 3',
			durationPx: 1800,
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
			durationPx: 1400,
			phases: {
				in: { at: 0.0, dur: 0.18 },
				hold: { at: 0.18, dur: 0.64 },
				out: { at: 0.82, dur: 0.18 }
			}
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

		// basic "in then out" envelope
		const envelope = clamp01(pin * (1 - pout));

		// useful motion-friendly outputs
		const opacity = envelope;
		const blur = lerp(14, 0, pin) + lerp(0, 14, pout);
		const scale = lerp(0.98, 1.0, pin) * lerp(1.0, 0.98, pout);

		// hold progress (0..1 within hold window)
		const hold = phases.hold ? phaseValue(p, phases.hold) : 0;

		return { pin, pout, hold, envelope, opacity, blur, scale };
	}

	function getArticle(word: string) {
		return /^[aeiou]/i.test(word) ? 'an' : 'a';
	}

	// ---------------------------------------------------------
	// Pixel hover action (kept from your version, with scroll-safe touch-action)
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

	// Make this accurate for your copy length (or compute from linesByTrack)
	const ESTIMATED_WORDS = 22;

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
		'IL-6 Elevation',
		'TNF-alpha',
		'Systolic > 140',
		'Stroke Risk x2',
		'Myocardial Infarction',
		'PAD',
		'Nephropathy',
		'Cancer Correlation',
		'Slow Healing',
		'Sarcopenia',
		'Vitamin D Low',
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

	// ---------------------------------------------------------
	// STATE: scroll + progress ranges
	// ---------------------------------------------------------
	let scrollParent: HTMLElement | null = null;

	const trackEls: Partial<Record<TrackId, HTMLElement>> = {};
	const ranges = new Map<TrackId, { start: number; end: number; len: number }>();

	let scrollTop = 0;
	let viewportH = 0;

	// per-track progress (0..1)
	let pIntro = 0;
	let pTrack1 = 0;
	let pGrid1 = 0;
	let pTrack2 = 0;
	let pGrid2 = 0;
	let pTrack3 = 0;
	let pForm = 0;

	// text reveal indices
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
	// Mouse parallax (RAF throttled)
	// ---------------------------------------------------------
	let mouseCoords = spring({ x: 0, y: 0 }, { stiffness: 0.05, damping: 0.25 });
	let mouseRaf = 0;
	let lastMouse: MouseEvent | null = null;

	function handleMouseMove(e: MouseEvent) {
		if (document.hidden || prefersReducedMotion) return;
		lastMouse = e;
		if (mouseRaf) return;

		mouseRaf = requestAnimationFrame(() => {
			mouseRaf = 0;
			if (!lastMouse) return;
			const x = lastMouse.clientX / window.innerWidth - 0.5;
			const y = lastMouse.clientY / window.innerHeight - 0.5;
			mouseCoords.set({ x, y });
		});
	}

	// ---------------------------------------------------------
	// Progress from ranges
	// ---------------------------------------------------------
	function rebuildRanges() {
		if (!scrollParent) return;
		viewportH = scrollParent.clientHeight;

		(Object.keys(trackEls) as TrackId[]).forEach((id) => {
			const el = trackEls[id];
			const spec = specById.get(id);
			if (!el || !spec) return;

			const start = el.offsetTop;
			const len = spec.durationPx;
			const end = start + len;
			ranges.set(id, { start, end, len });
		});
	}

	function progressFor(id: TrackId) {
		const r = ranges.get(id);
		if (!r || !scrollParent) return 0;
		const y = scrollParent.scrollTop;
		return clamp01((y - r.start) / r.len);
	}

	// ---------------------------------------------------------
	// Derived animation values (semantic phases)
	// ---------------------------------------------------------
	$: introFx = inHoldOut(pIntro, specById.get('intro')!.phases);
	$: t1Fx = inHoldOut(pTrack1, specById.get('track1')!.phases);
	$: g1Fx = inHoldOut(pGrid1, specById.get('grid1')!.phases);
	$: t2Fx = inHoldOut(pTrack2, specById.get('track2')!.phases);
	$: g2Fx = inHoldOut(pGrid2, specById.get('grid2')!.phases);
	$: t3Fx = inHoldOut(pTrack3, specById.get('track3')!.phases);
	$: formFx = inHoldOut(pForm, specById.get('form')!.phases);

	// Intro logo morph (example: use intro hold as the driver)
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

	// Centering offsets
	const centerOffset = (id: TrackId) => `${specById.get(id)?.centerOffsetPx ?? 0}px`;

	// Background fade tied to overall scroll (optional)
	const BG_FADE_PX = 900;
	$: bgFxOpacity = 1 - clamp01(scrollTop / BG_FADE_PX);

	// Typography sizes (keep your responsive tuning here)
	const BASE_MEDIUM = 55;
	const BASE_LARGE = 80;
	let dynamicMedium = BASE_MEDIUM;
	let dynamicLarge = BASE_LARGE;

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

		// section progress
		pIntro = progressFor('intro');
		pTrack1 = progressFor('track1');
		pGrid1 = progressFor('grid1');
		pTrack2 = progressFor('track2');
		pGrid2 = progressFor('grid2');
		pTrack3 = progressFor('track3');
		pForm = progressFor('form');

		// word reveal: drive from "hold" window (feels clean + semantic)
		visibleWord1 = Math.floor(t1Fx.hold * (ESTIMATED_WORDS + 2)) - 1;
		visibleWord2 = Math.floor(t2Fx.hold * (ESTIMATED_WORDS + 2)) - 1;
		visibleWord3 = Math.floor(t3Fx.hold * (ESTIMATED_WORDS + 2)) - 1;
	}

	function handleResize() {
		// tune typography with viewport width if you want
		dynamicMedium = BASE_MEDIUM;
		dynamicLarge = BASE_LARGE;

		rebuildRanges();
		update();
	}

	// ---------------------------------------------------------
	// Mount / destroy
	// ---------------------------------------------------------
	let cleanup: (() => void)[] = [];

	onMount(() => {
		scrollParent?.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', handleResize);
		window.addEventListener('mousemove', handleMouseMove);

		// initial build
		requestAnimationFrame(() => {
			rebuildRanges();
			update();
		});

		cleanup.push(() => {
			scrollParent?.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mousemove', handleMouseMove);
		});
	});

	onDestroy(() => {
		cleanup.forEach((fn) => fn());
		cleanup = [];
	});

	// ---------------------------------------------------------
	// Utility: expose duration to CSS spacer via style
	// ---------------------------------------------------------
	function trackStyle(id: TrackId) {
		return `--track-len:${specById.get(id)!.durationPx}px; --center-offset:${centerOffset(id)};`;
	}

	// Keyboard click helper
	function onCellKeydown(e: KeyboardEvent, i: number) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleCellClick(i);
		}
	}
</script>

<div class="back-g"></div>

<main bind:this={scrollParent}>
	<div class="bg-fx" style="opacity:{bgFxOpacity}">
		<div class="gradient-bg">
			<div class="gradients-container">
				<div class="g1"></div>
				<div class="g2"></div>
				<div class="g3"></div>
				<div class="g4"></div>
				<div class="g5"></div>
			</div>
		</div>
	</div>

	<!-- INTRO (timeline-driven) -->
	<section
		class="scroll-track intro-track"
		data-track="intro"
		bind:this={trackEls.intro}
		style={trackStyle('intro')}
	>
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
        "
			>
				<div class="logo-mark">
					<div class="origin-logo" style="--mx: {$mouseCoords.x}; --my: {$mouseCoords.y};">
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
	<section
		class="scroll-track"
		data-track="track1"
		bind:this={trackEls.track1}
		style={trackStyle('track1')}
	>
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

	<!-- GRID 1 (timeline-driven, centered sticky) -->
	<section
		class="scroll-track"
		data-track="grid1"
		bind:this={trackEls.grid1}
		style={trackStyle('grid1')}
	>
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
	<section
		class="scroll-track"
		data-track="track2"
		bind:this={trackEls.track2}
		style={trackStyle('track2')}
	>
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
	<section
		class="scroll-track"
		data-track="grid2"
		bind:this={trackEls.grid2}
		style={trackStyle('grid2')}
	>
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
								style="--active-color:{item.colors[0]}"
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
	<section
		class="scroll-track"
		data-track="track3"
		bind:this={trackEls.track3}
		style={trackStyle('track3')}
	>
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
	<section
		class="scroll-track"
		data-track="form"
		bind:this={trackEls.form}
		style={trackStyle('form')}
	>
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
	/* -----------------------------
   * Core scroll model
   * ----------------------------- */
	main {
		height: 100vh;
		width: 100vw;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		background: #09090b;
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

	/* Duration control: this is the “semantic timeline” length */
	.spacer {
		height: calc(var(--track-len) + 100vh);
	}

	/* -----------------------------
   * Background FX (kept minimal)
   * ----------------------------- */
	.bg-fx {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
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

	.gradient-bg {
		width: 100%;
		height: 100%;
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
	}

	.gradients-container {
		filter: blur(30px);
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		opacity: 0.22;
	}

	:root {
		--color-blue-rgb: 96, 165, 250;
		--color-pink-rgb: 232, 121, 249;
		--color-green-rgb: 94, 234, 212;
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
   * Intro
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
		color: #a3a3a3;
		font-family: 'Courier New', Courier, monospace;
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
   * Text dock (timeline-driven, centered)
   * ----------------------------- */
	.text-dock {
		position: absolute;
		top: calc(50vh + var(--center-offset, 0px));
		left: 0;
		right: 0;
		z-index: 10;
		display: flex;
		justify-content: center;
		pointer-events: none;

		transform: translateY(-50%) scale(var(--dock-scale, 1));
		opacity: var(--dock-opacity, 1);
		filter: blur(var(--dock-blur, 0px));
		will-change: transform, opacity, filter;
	}

	.text-inner {
		width: 100%;
		display: flex;
		justify-content: center;
		transform-origin: center;
	}

	.revision-container {
		padding: 64px 24px;
		color: white;
		text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
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

	/* -----------------------------
   * Grid dock (timeline-driven, centered)
   * ----------------------------- */
	.grid-dock {
		position: absolute;
		top: calc(50vh + var(--center-offset, 0px));
		left: 0;
		right: 0;
		z-index: 9999;
		display: flex;
		justify-content: center;
		pointer-events: none;

		transform: translateY(-50%) scale(var(--dock-scale, 1));
		opacity: var(--dock-opacity, 1);
		filter: blur(var(--dock-blur, 0px));
		will-change: transform, opacity, filter;
	}

	.grid-wrapper {
		display: flex;
		justify-content: center;
		width: min(1100px, calc(100vw - 48px));
		margin: 0 auto;
		pointer-events: auto;
		box-sizing: border-box;

		/* IMPORTANT: allow vertical scroll gestures to win on touch devices */
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
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		color: rgba(255, 255, 255, 0.9);
		transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
		user-select: none;
		line-height: 1.3;

		/* scroll-friendly */
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

	.cell-label {
		font-weight: 600;
		font-size: 1.1rem;
		transition: transform 0.4s cubic-bezier(0.2, 0, 0.2, 1);
		text-transform: capitalize;
	}

	.cell:hover .cell-label {
		transform: translateX(0);
		color: white;
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

	/* -----------------------------
   * Form (timeline-driven)
   * ----------------------------- */
	.form-dock {
		position: absolute;
		top: calc(50vh + var(--center-offset, 0px));
		left: 0;
		right: 0;
		z-index: 9999;
		display: flex;
		justify-content: center;

		transform: translateY(-50%) scale(var(--dock-scale, 1));
		opacity: var(--dock-opacity, 1);
		filter: blur(var(--dock-blur, 0px));
		will-change: transform, opacity, filter;
	}

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
	}
</style>
