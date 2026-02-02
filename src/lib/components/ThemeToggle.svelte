<script lang="ts">
	import { theme } from '$lib/stores';

	function toggleTheme() {
		theme.update((current) => {
			const next = current === 'dark' ? 'light' : 'dark';
			// Apply to DOM for global CSS variables
			if (typeof document !== 'undefined') {
				document.documentElement.dataset.theme = next;
				document.documentElement.style.colorScheme = next;
			}
			return next;
		});
	}
</script>

<button class="theme-toggle" on:click={toggleTheme}>
	{$theme === 'dark' ? '☀' : '☾'}
</button>

<style>
	.theme-toggle {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 100;
		background: var(--card);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 10px;
		border-radius: 50%;
		cursor: pointer;
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.theme-toggle:hover {
		background: var(--border);
	}
</style>
