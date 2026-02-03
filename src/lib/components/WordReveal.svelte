<script lang="ts">
	interface LineData {
		// Updated to handle the specific three-tier request
		size: 'medium' | 'small' | 'large';
		text: string;
	}

	export let lines: LineData[] = [];
	export let progress: number = 0;

	// Process lines into global word indices for a continuous reveal animation
	$: processedLines = (() => {
		let globalWordCount = 0;
		return lines.map((line) => {
			const words = line.text.split(/\s+/).map((text) => ({
				text,
				index: globalWordCount++
			}));
			return { size: line.size, words };
		});
	})();

	$: totalWords = processedLines.reduce((acc, line) => acc + line.words.length, 0);

	/**
	 * LINGER LOGIC:
	 * We multiply totalWords by 1.6 so the reveal finishes around 60% scroll,
	 * allowing the full message to "linger" as the user continues scrolling.
	 */
	$: visibleIndex = Math.floor(progress * (totalWords * 1.6)) - 1;
</script>

<div class="revision-container">
	{#each processedLines as line, i (i)}
		<div class="line {line.size}">
			{#each line.words as word (word.index)}
				<span
					class="word"
					class:active={word.index <= visibleIndex}
					style="transition-delay: {word.index * 4}ms;"
				>
					{word.text}&nbsp;
				</span>
			{/each}
		</div>
	{/each}
</div>

<style>
	.revision-container {
		padding: 40px 24px;
		color: var(--text);
		text-shadow: var(--text-shadow);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		max-width: 1200px;
		margin: 0 auto;
		margin-top: 40px;
		/* gap removed in favor of em-based margins on lines for proportional spacing */
	}

	.line {
		display: block;
		text-align: center;
		line-height: 1.5;
		margin-bottom: 0;
		font-family: 'Exposure';
	}

	.line:last-child {
		margin-bottom: 0;
	}

	/* Tier 1: Medium (The Intro) */
	.line.medium {
		font-size: 2.75rem;
		font-weight: 300;
		letter-spacing: -0.01em;
	}

	/* Tier 2: Small (The Bridge) */
	.line.small {
		font-size: 1.8rem;
		line-height: 2;
	}

	/* Tier 3: Large (The Statement) */
	.line.large {
		font-size: 3.25rem;
		font-weight: 700; /* Heavier for the large statement */
		letter-spacing: -0.05em; /* Tighter kerning for impact */
	}

	.word {
		opacity: 0.1;
		filter: blur(12px);
		transform: translateY(20px);
		display: inline-block;
		transition:
			opacity 0.4s cubic-bezier(0.2, 0, 0.2, 1),
			filter 0.5s ease-out,
			transform 0.5s cubic-bezier(0.2, 0, 0.2, 1);
		will-change: opacity, filter, transform;
	}

	.word.active {
		opacity: 1;
		filter: blur(0px);
		transform: translateY(0px);
	}

	/* Keep the small bridge text slightly more subtle even when active */
	.line.small .word.active {
		opacity: 0.8;
	}

	:global(html[data-theme='light']) .word {
		opacity: 0.08;
	}

	@media (max-width: 768px) {
		.line.medium {
			font-size: 1.4rem;
		}
		.line.small {
			font-size: 1.2rem;
		}
		.line.large {
			font-size: 1.5rem;
		}
	}
</style>
