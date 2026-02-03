<script lang="ts">
	interface LineData {
		size: 'medium' | 'larger';
		text: string;
	}

	export let lines: LineData[] = [];
	export let progress: number = 0;

	// Process lines into global word indices
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
	 * We multiply totalWords by 1.6.
	 * This means when progress is ~0.6 (60% scrolled), the visibleIndex
	 * will already equal totalWords. All words stay 'active' for the
	 * remaining 40% of the scroll.
	 */
	$: visibleIndex = Math.floor(progress * (totalWords * 1.6)) - 1;
</script>

<div class="revision-container">
	{#each processedLines as line}
		<div class="line {line.size}">
			{#each line.words as word}
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
		max-width: 1000px; /* Narrower for better reading rhythm */
		margin: 0 auto;
	}

	.line {
		display: block;
		text-align: center;
		line-height: 1.1;
		font-weight: 600;
		font-family: 'Exposure', serif;
	}

	.line.medium .word {
		font-size: var(--fs-medium, clamp(1.5rem, 2vw, 2.5rem));
		font-weight: 300;
		font-family: 'Exposure', serif;
	}

	.line.larger .word {
		font-size: var(--fs-large, clamp(2rem, 4vw, 3.75rem));
		font-weight: 400;
		font-family: 'Exposure', serif;
		letter-spacing: -0.03em;
	}

	.word {
		opacity: 0.1;
		filter: blur(12px); /* Increased blur for a softer "In" */
		transform: translateY(15px); /* Slightly deeper drop */
		display: inline-block;
		/* Snappier transitions to give more time for the 'Linger' */
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

	:global(html[data-theme='light']) .word {
		opacity: 0.05;
	}

	@media (max-width: 768px) {
		.line.medium .word {
			font-size: 1.5rem;
		}
		.line.larger .word {
			font-size: 2rem;
		}
	}
</style>
