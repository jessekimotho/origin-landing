<script>
	import { onMount, tick } from 'svelte';
	import { spring } from 'svelte/motion';
	import BlurBackground from '$lib/BlurBackground.svelte';

	// ---------------------------------------------------------
	// ✅ PIXEL HOVER ACTION
	// ---------------------------------------------------------
	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

	function pixelHover(node, opts) {
		const {
			gap = 6,
			speed = 0.035,
			colors = ['#f8fafc', '#f1f5f9', '#cbd5e1'],
			noFocus = false
		} = opts || {};

		const canvas = node.querySelector('canvas');
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		let pixels = [];
		let raf = 0;
		let hovering = false;

		const rand = (min, max) => Math.random() * (max - min) + min;

		function resize() {
			const r = canvas.getBoundingClientRect();
			const w = Math.max(1, Math.floor(r.width));
			const h = Math.max(1, Math.floor(r.height));
			canvas.width = w;
			canvas.height = h;

			pixels = [];
			for (let x = 0; x < w; x += gap) {
				for (let y = 0; y < h; y += gap) {
					const color = colors[(Math.random() * colors.length) | 0];
					const maxSizeInteger = 2;
					const minSize = 0.5;
					const maxSize = rand(minSize, maxSizeInteger);
					const dx = x - w / 2;
					const dy = y - h / 2;
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
						counterStep: Math.random() * 4 + (w + h) * 0.01,
						delay,
						idle: true,
						spd: rand(0.1, 0.9) * (prefersReducedMotion ? 0 : speed)
					});
				}
			}
		}

		function drawPixel(p) {
			const centerOffset = p.maxSizeInteger * 0.5 - p.size * 0.5;
			ctx.fillStyle = p.color;
			ctx.fillRect(p.x + centerOffset, p.y + centerOffset, p.size, p.size);
		}

		function step() {
			raf = requestAnimationFrame(step);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			let allIdle = true;

			for (const p of pixels) {
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
			}
		}

		const ro = new ResizeObserver(() => {
			resize();
			if (hovering && !raf) step();
		});

		function onEnter() {
			if (noFocus) return;
			hovering = true;
			resize();
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
	// CORE COMPONENT LOGIC
	// ---------------------------------------------------------

	let scrollParent;

	// --- Track 1 (Top) Refs ---
	let introTrack;
	let logoDockEl;
	let messageTrack1;
	let stickyViewportEl1;
	let textDockEl1;
	let textSentinelEl1;

	// --- Track 2 (Middle) Refs ---
	let messageTrack2;
	let stickyViewportEl2;
	let textDockEl2;
	let textSentinelEl2;

	// --- Track 3 (Bottom) Refs ---
	let messageTrack3;
	let stickyViewportEl3;
	let textDockEl3;
	let textSentinelEl3;

	// --- Grids & Fillers ---
	let gridDockEl;
	let gridSentinelEl;
	let fillerEl;

	let gridDockEl2;
	let gridSentinelEl2;
	let fillerEl2;
	let isGridFixed2 = false;
	let gridFixedLeftPx2 = 0;

	// --- FORM DOCK REFS (New) ---
	let formDockEl;
	let formSentinelEl;
	let isFormFixed = false;
	let formFixedLeftPx = 0;

	// --- Progress / State ---
	let introP = 0;
	let pageScrollTop = 0;
	let fillerP = 0;
	let fillerP2 = 0;

	// Track 1 State
	let revealP1 = 0;
	let visibleWordIndex1 = -1;
	let isTextFixed1 = false;
	let textScale1 = 1;
	let textFixedLeftPx1 = 0;

	// Track 2 State
	let revealP2 = 0;
	let visibleWordIndex2 = -1;
	let isTextFixed2 = false;
	let textScale2 = 1;
	let textFixedLeftPx2 = 0;

	// Track 3 State
	let revealP3 = 0;
	let visibleWordIndex3 = -1;
	let isTextFixed3 = false;
	let textScale3 = 1;
	let textFixedLeftPx3 = 0;

	// --- Mouse ---
	let mouseCoords = spring({ x: 0, y: 0 }, { stiffness: 0.05, damping: 0.25 });
	function handleMouseMove(e) {
		const x = e.clientX / window.innerWidth - 0.5;
		const y = e.clientY / window.innerHeight - 0.5;
		mouseCoords.set({ x, y });
	}

	const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
	const lerp = (a, b, t) => a + (b - a) * t;

	// --- CONFIG ---
	const INTRO_DISTANCE_PX = 40;
	const FIX_ON_P = 0.985;
	const FIX_OFF_P = 0.93;
	const REVEAL_LEADIN = 0.18;
	const BG_FADE_PX = 900;
	const ESTIMATED_WORDS = 20;

	const TEXT_FIX_TOP_PX = 240;
	const SHRINK_RANGE_PX = 400;
	const TARGET_SCALE = 0.5;
	const GRID_FIX_TOP_PX = 340;

	// ✅ Form Locks below the text (Text is at 240px)
	const FORM_FIX_TOP_PX = 380;

	const BASE_MEDIUM = 55;
	const BASE_LARGE = 80;
	let dynamicMedium = BASE_MEDIUM;
	let dynamicLarge = BASE_LARGE;

	// Logo morph config
	const START_GAP = 64;
	const END_GAP = 36;
	const START_FONT = 26;
	const END_FONT = 20;
	const START_LETTER = 32;
	const END_LETTER = 8;

	let isFixed = false;
	let fixedLeftPx = 0;

	function setFixed(on) {
		if (on === isFixed) return;
		if (on) {
			if (logoDockEl) {
				const rect = logoDockEl.getBoundingClientRect();
				fixedLeftPx = rect.left + rect.width / 2;
			} else {
				fixedLeftPx = window.innerWidth / 2;
			}
			isFixed = true;
		} else {
			isFixed = false;
		}
	}

	function setGridFixed(on) {
		if (on === isGridFixed) return;
		if (on) {
			if (gridDockEl) {
				const rect = gridDockEl.getBoundingClientRect();
				gridFixedLeftPx = rect.left + rect.width / 2;
			} else {
				gridFixedLeftPx = window.innerWidth / 2;
			}
			isGridFixed = true;
		} else {
			isGridFixed = false;
		}
	}

	function setGridFixed2(on) {
		if (on === isGridFixed2) return;
		if (on) {
			if (gridDockEl2) {
				const rect = gridDockEl2.getBoundingClientRect();
				gridFixedLeftPx2 = rect.left + rect.width / 2;
			} else {
				gridFixedLeftPx2 = window.innerWidth / 2;
			}
			isGridFixed2 = true;
		} else {
			isGridFixed2 = false;
		}
	}

	// ✅ NEW: Form Fixed Logic
	function setFormFixed(on) {
		if (on === isFormFixed) return;
		if (on) {
			if (formDockEl) {
				const rect = formDockEl.getBoundingClientRect();
				formFixedLeftPx = rect.left + rect.width / 2;
			} else {
				formFixedLeftPx = window.innerWidth / 2;
			}
			isFormFixed = true;
		} else {
			isFormFixed = false;
		}
	}

	// --- TEXT DATA ---
	const topTextData = [
		{ size: 'medium', text: 'Chronic Disease' },
		{ size: 'medium', text: 'lies in wait for all of us' },
		{ size: 'larger', text: 'We all have the right to contribute' }
	];

	const bottomTextData = [
		{ size: 'medium', text: 'Breakthroughs are being made' },
		{ size: 'medium', text: 'against chronic disease' },
		{ size: 'larger', text: 'Together we can ensure they make it to patients' }
	];

	const finalTextData = [
		{ size: 'medium', text: 'The fight against Chronic Disease' },
		{ size: 'larger', text: 'starts with you' }
	];

	function prepareLines(dataLines, offsetCount = 0) {
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

	// --- GRID 1 DATA (Masonic) ---
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

	// --- GRID 2 DATA (Breakthroughs) ---
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
	let isGridFixed = false;
	let gridFixedLeftPx = 0;
	let isFading = false;

	function handleCellClick(index) {
		if (selectedCellIndex !== -1) return;
		isFading = true;
		setTimeout(() => {
			selectedCellIndex = index;
		}, 400);
	}

	// --- CLOUD ITEMS ---
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
		'Fatty Liver (NAFLD)',
		'Autoimmunity',
		'Genetics (TCF7L2)',
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
		'Triglycerides > 150'
	];
	let cloudItems = [];
	for (let i = 0; i < 60; i++) {
		const text = clinicalFacts[i % clinicalFacts.length];
		cloudItems.push({
			text,
			x: Math.random() * 100,
			y: Math.random() * 100,
			depth: 0.2 + Math.random() * 0.8,
			opacity: 0.05 + Math.random() * 0.25,
			scale: 0.8 + Math.random() * 0.4
		});
	}

	// --- SCROLL HANDLER ---
	function computeTrackProgress(trackEl) {
		if (!scrollParent || !trackEl) return 0;
		const viewportH = scrollParent.clientHeight;
		const parentRect = scrollParent.getBoundingClientRect();
		const trackRect = trackEl.getBoundingClientRect();
		const trackTopInScroll = trackRect.top - parentRect.top + scrollParent.scrollTop;
		const start = trackTopInScroll;
		const end = start + (trackEl.offsetHeight - viewportH);
		const current = scrollParent.scrollTop;
		const denom = end - start;
		return clamp01(denom > 0 ? (current - start) / denom : 0);
	}

	function handleStickyText(viewportEl, sentinelEl, isFixedState, setFixedFn, targetScaleVar) {
		if (viewportEl && sentinelEl) {
			const viewportRect = viewportEl.getBoundingClientRect();
			const naturalCenterY = viewportRect.top + window.innerHeight / 2;

			if (!isFixedState && naturalCenterY <= TEXT_FIX_TOP_PX) {
				setFixedFn(true);
			} else if (isFixedState && naturalCenterY > TEXT_FIX_TOP_PX) {
				setFixedFn(false);
			}

			const distFromLock = naturalCenterY - TEXT_FIX_TOP_PX;
			let calculatedScale = 1;
			if (distFromLock <= 0) {
				calculatedScale = TARGET_SCALE;
			} else if (distFromLock < SHRINK_RANGE_PX) {
				const progress = 1 - distFromLock / SHRINK_RANGE_PX;
				calculatedScale = lerp(1, TARGET_SCALE, progress);
			} else {
				calculatedScale = 1;
			}
			return calculatedScale;
		}
		return targetScaleVar;
	}

	function updateScroll() {
		if (!scrollParent) return;
		const st = scrollParent.scrollTop;
		pageScrollTop = st;

		// 1. Logo
		introP = computeTrackProgress(introTrack);
		if (!isFixed && introP >= FIX_ON_P) setFixed(true);
		if (isFixed && introP <= FIX_OFF_P) setFixed(false);

		// 2. Track 1
		revealP1 = computeTrackProgress(messageTrack1);
		const prog1 = clamp01((revealP1 - REVEAL_LEADIN) / (1 - REVEAL_LEADIN));
		visibleWordIndex1 = Math.floor(prog1 * (ESTIMATED_WORDS + 2)) - 1;

		textScale1 = handleStickyText(
			stickyViewportEl1,
			textSentinelEl1,
			isTextFixed1,
			(v) => {
				if (v !== isTextFixed1) {
					isTextFixed1 = v;
					if (v && textDockEl1) {
						const r = textDockEl1.getBoundingClientRect();
						textFixedLeftPx1 = r.left + r.width / 2;
					} else {
						textFixedLeftPx1 = window.innerWidth / 2;
					}
				}
			},
			textScale1
		);

		// 3. Grid Docking 1
		if (gridSentinelEl) {
			const rect = gridSentinelEl.getBoundingClientRect();
			if (!isGridFixed && rect.top <= GRID_FIX_TOP_PX) {
				setGridFixed(true);
			} else if (isGridFixed && rect.top > GRID_FIX_TOP_PX) {
				setGridFixed(false);
			}
		}

		// 4. FILLER GAP LOGIC 1
		if (fillerEl) {
			const rect = fillerEl.getBoundingClientRect();
			const entryPoint = window.innerHeight;
			const exitPoint = 0;
			const p = (entryPoint - rect.top) / (entryPoint - exitPoint);
			fillerP = clamp01(p);
		}

		// 5. Track 2
		revealP2 = computeTrackProgress(messageTrack2);
		const prog2 = clamp01((revealP2 - REVEAL_LEADIN) / (1 - REVEAL_LEADIN));
		visibleWordIndex2 = Math.floor(prog2 * (ESTIMATED_WORDS + 2)) - 1;

		textScale2 = handleStickyText(
			stickyViewportEl2,
			textSentinelEl2,
			isTextFixed2,
			(v) => {
				if (v !== isTextFixed2) {
					isTextFixed2 = v;
					if (v && textDockEl2) {
						const r = textDockEl2.getBoundingClientRect();
						textFixedLeftPx2 = r.left + r.width / 2;
					} else {
						textFixedLeftPx2 = window.innerWidth / 2;
					}
				}
			},
			textScale2
		);

		// 6. Grid Docking 2
		if (gridSentinelEl2) {
			const rect = gridSentinelEl2.getBoundingClientRect();
			if (!isGridFixed2 && rect.top <= GRID_FIX_TOP_PX) {
				setGridFixed2(true);
			} else if (isGridFixed2 && rect.top > GRID_FIX_TOP_PX) {
				setGridFixed2(false);
			}
		}

		// 7. FILLER GAP LOGIC 2
		if (fillerEl2) {
			const rect = fillerEl2.getBoundingClientRect();
			const entryPoint = window.innerHeight;
			const exitPoint = 0;
			const p = (entryPoint - rect.top) / (entryPoint - exitPoint);
			fillerP2 = clamp01(p);
		}

		// 8. Track 3 (Text)
		revealP3 = computeTrackProgress(messageTrack3);
		const prog3 = clamp01((revealP3 - REVEAL_LEADIN) / (1 - REVEAL_LEADIN));
		visibleWordIndex3 = Math.floor(prog3 * (ESTIMATED_WORDS + 2)) - 1;

		textScale3 = handleStickyText(
			stickyViewportEl3,
			textSentinelEl3,
			isTextFixed3,
			(v) => {
				if (v !== isTextFixed3) {
					isTextFixed3 = v;
					if (v && textDockEl3) {
						const r = textDockEl3.getBoundingClientRect();
						textFixedLeftPx3 = r.left + r.width / 2;
					} else {
						textFixedLeftPx3 = window.innerWidth / 2;
					}
				}
			},
			textScale3
		);

		// ✅ 9. FORM DOCKING LOGIC
		if (formSentinelEl) {
			const rect = formSentinelEl.getBoundingClientRect();
			if (!isFormFixed && rect.top <= FORM_FIX_TOP_PX) {
				setFormFixed(true);
			} else if (isFormFixed && rect.top > FORM_FIX_TOP_PX) {
				setFormFixed(false);
			}
		}
	}

	function handleResize() {
		updateScroll();
		if (isFixed) fixedLeftPx = window.innerWidth / 2;
		if (isTextFixed1) textFixedLeftPx1 = window.innerWidth / 2;
		if (isTextFixed2) textFixedLeftPx2 = window.innerWidth / 2;
		if (isTextFixed3) textFixedLeftPx3 = window.innerWidth / 2;
		if (isGridFixed) gridFixedLeftPx = window.innerWidth / 2;
		if (isGridFixed2) gridFixedLeftPx2 = window.innerWidth / 2;
		if (isFormFixed) formFixedLeftPx = window.innerWidth / 2;
	}

	onMount(async () => {
		await tick();
		scrollParent.addEventListener('scroll', updateScroll, { passive: true });
		window.addEventListener('resize', handleResize);
		window.addEventListener('mousemove', handleMouseMove);
		updateScroll();

		return () => {
			scrollParent.removeEventListener('scroll', updateScroll);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});

	// Styles
	$: logoY = `${(1 - introP) * 50 + introP * 0}%`;
	$: logoTranslateY = `${(1 - introP) * -50 + introP * 0}%`;
	$: logoTopPx = `${introP * INTRO_DISTANCE_PX}px`;
	$: promptOpacity = clamp01(1 - introP * 1.2);
	$: morphT = clamp01(1 - promptOpacity);
	$: logoGapPx = `${lerp(START_GAP, END_GAP, morphT).toFixed(2)}px`;
	$: restFontPx = `${lerp(START_FONT, END_FONT, morphT).toFixed(2)}px`;
	$: restLetterPx = `${lerp(START_LETTER, END_LETTER, morphT).toFixed(2)}px`;

	// Change these lines:
	$: fixedLeftStyle = `${fixedLeftPx || (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)}px`;
	$: textFixedLeftStyle1 = `${textFixedLeftPx1 || (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)}px`;
	$: textFixedLeftStyle2 = `${textFixedLeftPx2 || (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)}px`;
	$: textFixedLeftStyle3 = `${textFixedLeftPx3 || (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)}px`;
	$: gridFixedLeftStyle = `${gridFixedLeftPx || (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)}px`;
	$: gridFixedLeftStyle2 = `${gridFixedLeftPx2 || (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)}px`;
	$: formFixedLeftStyle = `${formFixedLeftPx || (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)}px`;

	$: bgFxOpacity = 1 - clamp01(pageScrollTop / BG_FADE_PX);

	// Transition Logic 1 (Fade Section 1)
	$: fadeOutOld1 = clamp01((fillerP - 0.4) * 2.5);
	$: previousContentOpacity1 = 1 - fadeOutOld1;

	// Transition Logic 2 (Fade Section 2)
	$: fadeOutOld2 = clamp01((fillerP2 - 0.4) * 2.5);
	$: previousContentOpacity2 = 1 - fadeOutOld2;
</script>

<div class="back-g"></div>

<main bind:this={scrollParent}>
	<div class="bg-fx" style="opacity: {bgFxOpacity}">
		<BlurBackground />
	</div>

	<section class="intro-track" bind:this={introTrack}>
		<div class="intro-sticky">
			<div
				bind:this={logoDockEl}
				class="logo-dock"
				class:fixed={isFixed}
				style="
          --mx: {$mouseCoords.x};
          --my: {$mouseCoords.y};
          --logo-y: {logoY};
          --logo-ty: {logoTranslateY};
          --logo-top: {logoTopPx};
          --gap: {logoGapPx};
          --rest-font: {restFontPx};
          --rest-letter: {restLetterPx};
          --fixed-left: {fixedLeftStyle};
        "
			>
				<div class="logo-mark">
					<div class="origin-logo">
						<div class="inner-circle"></div>
					</div>
					<div class="rest-of-word">ORIGIN</div>
				</div>
			</div>
			<div class="prompt" style="opacity: {promptOpacity}">Scroll BELOW to access the site</div>
		</div>
	</section>

	<div style="opacity: {previousContentOpacity1}; transition: opacity 0.1s linear;">
		<div class="message-track" bind:this={messageTrack1}>
			<div class="sticky-viewport" bind:this={stickyViewportEl1}>
				<div
					class="cloud-container"
					style="--mouse-x: {$mouseCoords.x}; --mouse-y: {$mouseCoords.y}; --scroll-p: {revealP1};"
				>
					{#each cloudItems as item}
						<div
							class="cloud-item"
							style="left: {item.x}%; top: {item.y}%; opacity: {item.opacity}; --depth: {item.depth}; --scale: {item.scale};"
						>
							{item.text}
						</div>
					{/each}
				</div>

				<div bind:this={textSentinelEl1} class="text-sentinel" />

				<div
					bind:this={textDockEl1}
					class="text-dock"
					class:fixed={isTextFixed1}
					style="
            --text-fixed-left: {textFixedLeftStyle1};
            --text-fix-top: {TEXT_FIX_TOP_PX}px;
            --fs-medium: {dynamicMedium}px;
            --fs-large: {dynamicLarge}px;
            --text-scale: {textScale1};
          "
				>
					<div class="revision-container" class:fading={isFading}>
						{#each lines1 as line}
							<div class="line {line.size}">
								{#each line.words as word}
									<span class="word" class:active={word.globalIndex <= visibleWordIndex1}>
										{word.text}&nbsp;
									</span>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<section class="content">
			<div bind:this={gridSentinelEl} class="grid-sentinel"></div>

			<div
				bind:this={gridDockEl}
				class="grid-dock"
				class:fixed={isGridFixed}
				style="--grid-fixed-left: {gridFixedLeftStyle}; --grid-fix-top: {GRID_FIX_TOP_PX}px;"
			>
				<div class="grid-wrapper">
					<div class="grid" role="button" tabindex="0">
						{#each gridCells as c, i}
							<div
								class="cell"
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
							>
								<canvas class="pixel-bg"></canvas>
								<span class="cell-label">{c.label}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="filler" bind:this={fillerEl}></div>
		</section>
	</div>

	<div style="opacity: {previousContentOpacity2}; transition: opacity 0.1s linear;">
		<div class="message-track" bind:this={messageTrack2}>
			<div class="sticky-viewport" bind:this={stickyViewportEl2}>
				<div
					class="cloud-container"
					style="--mouse-x: {$mouseCoords.x}; --mouse-y: {$mouseCoords.y}; --scroll-p: {revealP2};"
				>
					{#each cloudItems as item}
						<div
							class="cloud-item"
							style="left: {item.x}%; top: {item.y}%; opacity: {item.opacity}; --depth: {item.depth}; --scale: {item.scale};"
						>
							{item.text}
						</div>
					{/each}
				</div>

				<div bind:this={textSentinelEl2} class="text-sentinel" />

				<div
					bind:this={textDockEl2}
					class="text-dock"
					class:fixed={isTextFixed2}
					style="
            --text-fixed-left: {textFixedLeftStyle2};
            --text-fix-top: {TEXT_FIX_TOP_PX}px;
            --fs-medium: {dynamicMedium}px;
            --fs-large: {dynamicLarge}px;
            --text-scale: {textScale2};
            "
				>
					<div class="revision-container">
						{#each lines2 as line}
							<div class="line {line.size}">
								{#each line.words as word}
									<span class="word" class:active={word.globalIndex <= visibleWordIndex2}>
										{word.text}&nbsp;
									</span>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<section class="content">
			<div bind:this={gridSentinelEl2} class="grid-sentinel"></div>

			<div
				bind:this={gridDockEl2}
				class="grid-dock"
				class:fixed={isGridFixed2}
				style="--grid-fixed-left: {gridFixedLeftStyle2}; --grid-fix-top: {GRID_FIX_TOP_PX}px;"
			>
				<div class="grid-wrapper">
					<div class="grid-uniform">
						{#each breakthroughCells as item}
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

			<div class="filler" bind:this={fillerEl2}></div>
		</section>
	</div>

	<div class="message-track" bind:this={messageTrack3}>
		<div class="sticky-viewport" bind:this={stickyViewportEl3}>
			<div
				class="cloud-container"
				style="--mouse-x: {$mouseCoords.x}; --mouse-y: {$mouseCoords.y}; --scroll-p: {revealP3};"
			>
				{#each cloudItems as item}
					<div
						class="cloud-item"
						style="left: {item.x}%; top: {item.y}%; opacity: {item.opacity}; --depth: {item.depth}; --scale: {item.scale};"
					>
						{item.text}
					</div>
				{/each}
			</div>

			<div bind:this={textSentinelEl3} class="text-sentinel" />

			<div
				bind:this={textDockEl3}
				class="text-dock"
				class:fixed={isTextFixed3}
				style="
          --text-fixed-left: {textFixedLeftStyle3};
          --text-fix-top: {TEXT_FIX_TOP_PX}px;
          --fs-medium: {dynamicMedium}px;
          --fs-large: {dynamicLarge}px;
          --text-scale: {textScale3};
        "
			>
				<div class="revision-container">
					{#each lines3 as line}
						<div class="line {line.size}">
							{#each line.words as word}
								<span class="word" class:active={word.globalIndex <= visibleWordIndex3}>
									{word.text}&nbsp;
								</span>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<section class="content footer-content">
		<div bind:this={formSentinelEl} class="form-sentinel"></div>

		<div
			bind:this={formDockEl}
			class="form-dock"
			class:fixed={isFormFixed}
			style="--form-fixed-left: {formFixedLeftStyle}; --form-fix-top: {FORM_FIX_TOP_PX}px;"
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
	main {
		height: 100vh;
		width: 100vw;
		overflow: auto;
		position: relative;
		background: #09090b;
	}

	.bg-fx {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	/* INTRO & LOGO STYLES */
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
	.logo-dock {
		position: absolute;
		left: 50%;
		top: var(--logo-y);
		transform: translate(-50%, var(--logo-ty));
		padding-top: var(--logo-top);
		z-index: 999;
		pointer-events: none;
	}
	.logo-dock.fixed {
		position: fixed;
		top: 40px;
		left: var(--fixed-left);
		transform: translate(-50%, 0);
		padding-top: 0;
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

	/* REVEAL TRACK */
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
		font-size: calc(1rem * var(--scale));
		white-space: nowrap;
		will-change: transform;
		transform: translate3d(
			calc(var(--mouse-x) * var(--depth) * -100px),
			calc((var(--mouse-y) * var(--depth) * -50px) + (var(--scroll-p) * var(--depth) * -400px)),
			0
		);
		transition: opacity 0.5s ease;
	}

	/* TEXT DOCK */
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
	.text-dock {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%) scale(var(--text-scale, 1));
		z-index: 10;
		pointer-events: none;
		width: 100%;
		display: flex;
		justify-content: center;
		will-change: transform, top, left;
	}
	.text-dock.fixed {
		position: fixed;
		left: var(--text-fixed-left);
		top: var(--text-fix-top);
		transform: translate(-50%, -50%) scale(var(--text-scale, 1));
		z-index: 9999;
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

	/* GRID DOCK STYLES */
	.grid-sentinel {
		width: 100%;
		height: 1px;
	}
	.grid-dock {
		position: relative;
		width: 100%;
		z-index: 5;
	}
	.grid-dock.fixed {
		position: fixed;
		top: var(--grid-fix-top);
		left: var(--grid-fixed-left);
		transform: translateX(-50%);
		width: 100%;
		max-width: 1000px;
		padding: 0 24px;
		box-sizing: border-box;
		z-index: 9999;
		pointer-events: none;
	}

	.grid-wrapper {
		display: flex;
		justify-content: center;
		width: 100%;
		pointer-events: auto;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-auto-rows: minmax(100px, auto);
		grid-auto-flow: dense;
		gap: 16px;
		width: 100%;
		max-height: 600px;
		cursor: pointer;
	}

	/* GRID 2 (UNIFORM) */
	.grid-uniform {
		display: grid;
		grid-template-columns: repeat(3, 1fr); /* 3 Columns */
		gap: 16px;
		width: 100%;
		pointer-events: auto;
	}

	.grid > :nth-child(2) {
		grid-column: span 2;
		grid-row: span 1;
		font-size: 1.2rem;
	}
	.grid > :nth-child(7) {
		grid-column: span 2;
		grid-row: span 2;
		font-size: 1.4rem;
		z-index: 2;
	}
	.grid > :nth-child(9) {
		grid-column: span 2;
		grid-row: span 2;
		font-size: 1.2rem;
	}
	.grid > :nth-child(6) {
		grid-row: span 2;
	}
	.grid > :nth-child(5) {
		grid-column: span 1;
	}
	.grid > :nth-child(10) {
		grid-column: span 2;
	}

	/* CELL STYLING */
	.cell {
		position: relative;
		overflow: hidden;
		isolation: isolate;
		display: grid;
		place-items: center;
		text-align: center;
		padding: 12px 16px;
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

	/* Uniform Cell Specifics */
	.uniform-cell {
		min-height: 140px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 24px;
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

	.cell.is-chosen {
		position: fixed;
		top: 200px;
		left: 50%;
		transform: translate(-50%, 0) scale(1.2);
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
	.cell-label {
		position: relative;
		z-index: 2;
		transition: all 200ms;
	}
	.cell:hover .cell-label {
		transform: scale(1.05);
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
	/* ✅ INCREASED HEIGHT TO ALLOW SAFE ZONE */
	.filler {
		height: 100vh;
	}

	.back-g {
		width: 100vw;
		height: 100vh;
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		background: #101010;
		box-shadow: inset 0 0 200px 30px black;
	}

	@media (max-width: 768px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
			max-height: none;
		}
		.grid-uniform {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 480px) {
		.grid {
			gap: 8px;
		}
		.cell {
			font-size: 0.9rem !important;
			padding: 8px;
		}
	}

	/* --- CONTACT FORM STYLES --- */
	.footer-content {
		/* Removed padding top to let dock handle position */
	}

	.form-sentinel {
		width: 100%;
		height: 1px;
	}

	/* New Dock Style for Form */
	.form-dock {
		position: relative;
		width: 100%;
		z-index: 5;
	}
	.form-dock.fixed {
		position: fixed;
		top: var(--form-fix-top);
		left: var(--form-fixed-left);
		transform: translateX(-50%);
		width: 100%;
		max-width: 1000px;
		padding: 0 24px;
		box-sizing: border-box;
		z-index: 9999;
	}

	.form-container {
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
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
</style>
