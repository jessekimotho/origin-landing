// src/lib/pixelHover.ts
export interface HoverOptions {
	gap?: number;
	speed?: number;
	colors?: string[];
}

class Pixel {
	ctx: CanvasRenderingContext2D;
	x: number;
	y: number;
	color: string;
	speed: number;
	size: number = 0;
	sizeStep: number;
	minSize: number = 0.5;
	maxSize: number;
	delay: number;
	counter: number = 0;
	counterStep: number;
	isIdle: boolean = false;
	isReverse: boolean = false;
	isShimmer: boolean = false;

	constructor(
		context: CanvasRenderingContext2D,
		x: number,
		y: number,
		color: string,
		speed: number,
		delay: number,
		canvasWidth: number,
		canvasHeight: number
	) {
		this.ctx = context;
		this.x = x;
		this.y = y;
		this.color = color;
		this.speed = (Math.random() * 0.8 + 0.1) * speed;
		this.sizeStep = Math.random() * 0.4;
		this.maxSize = Math.random() * (2 - 0.5) + 0.5;
		this.delay = delay;
		// Adjust counterStep to the actual scale of the container
		this.counterStep = Math.random() * 4 + (canvasWidth + canvasHeight) * 0.01;
	}

	draw() {
		const centerOffset = 1 - this.size * 0.5;
		this.ctx.fillStyle = this.color;
		this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
	}

	appear() {
		this.isIdle = false;
		if (this.counter <= this.delay) {
			this.counter += this.counterStep;
			return;
		}
		if (this.size >= this.maxSize) this.isShimmer = true;
		if (this.isShimmer) this.shimmer();
		else this.size += this.sizeStep;
		this.draw();
	}

	disappear() {
		this.isShimmer = false;
		this.counter = 0;
		if (this.size <= 0) {
			this.isIdle = true;
			return;
		} else this.size -= 0.1;
		this.draw();
	}

	shimmer() {
		if (this.size >= this.maxSize) this.isReverse = true;
		else if (this.size <= this.minSize) this.isReverse = false;
		this.size += this.isReverse ? -this.speed : this.speed;
	}
}

export function pixelHover(node: HTMLElement, opts: HoverOptions) {
	let { gap = 6, speed = 0.035, colors = ['#f8fafc'] } = opts;
	const canvas = node.querySelector('canvas') as HTMLCanvasElement;
	const ctx = canvas?.getContext('2d');
	if (!ctx) return;

	let pixels: Pixel[] = [];
	let raf: number;
	let animationName: 'appear' | 'disappear' = 'disappear';

	function init() {
		const rect = node.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;

		// Force the canvas to match the physical pixel grid of the screen
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;

		// Use CSS to scale it back down to fit the cell
		canvas.style.width = `${rect.width}px`;
		canvas.style.height = `${rect.height}px`;

		// Scale the context so our coordinates match logical pixels
		ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

		pixels = [];
		// Loop through logical pixels (rect.width/height)
		for (let x = 0; x < rect.width; x += gap) {
			for (let y = 0; y < rect.height; y += gap) {
				const color = colors[Math.floor(Math.random() * colors.length)];
				const dx = x - rect.width / 2;
				const dy = y - rect.height / 2;
				const delay = Math.sqrt(dx * dx + dy * dy);

				pixels.push(new Pixel(ctx!, x, y, color, speed, delay, rect.width, rect.height));
			}
		}
	}

	function loop() {
		const rect = node.getBoundingClientRect();
		ctx!.clearRect(0, 0, rect.width, rect.height);
		pixels.forEach((p) => p[animationName]());

		if (animationName === 'disappear' && pixels.every((p) => p.isIdle)) {
			cancelAnimationFrame(raf);
		} else {
			raf = requestAnimationFrame(loop);
		}
	}

	const onEnter = () => {
		animationName = 'appear';
		loop();
	};
	const onLeave = () => {
		animationName = 'disappear';
	};

	node.addEventListener('mouseenter', onEnter);
	node.addEventListener('mouseleave', onLeave);

	// ResizeObserver is much more reliable than window 'resize' for individual cells
	const ro = new ResizeObserver(() => init());
	ro.observe(node);

	init();

	return {
		update(newOpts: HoverOptions) {
			gap = newOpts.gap || 6;
			speed = newOpts.speed || 0.035;
			colors = newOpts.colors || colors;
			init();
		},
		destroy() {
			node.removeEventListener('mouseenter', onEnter);
			node.removeEventListener('mouseleave', onLeave);
			ro.disconnect();
			cancelAnimationFrame(raf);
		}
	};
}
