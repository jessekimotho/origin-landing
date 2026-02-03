<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	export let isOpen = false;
	export let label = '';
	export let style = { border: '', bg: '', text: '' };
	export let article = '';

	const dispatch = createEventDispatcher();
	let dialog: HTMLDialogElement;

	// Use a reactive statement that handles the opening instantly
	// but waits for transitions on closing.
	$: if (dialog) {
		if (isOpen) {
			dialog.showModal();
			document.body.style.overflow = 'hidden';
		} else if (dialog.open) {
			// We don't call dialog.close() here.
			// We let the {#if isOpen} block handle the out-transition.
			document.body.style.overflow = 'unset';
		}
	}

	async function handleClose() {
		dispatch('close');
	}

	// This ensures the native dialog actually closes once the Svelte transition finishes
	function onOutroEnd() {
		if (!isOpen && dialog) {
			dialog.close();
		}
	}
</script>

{#if isOpen}
	<dialog
		bind:this={dialog}
		on:click|self={handleClose}
		on:outroend={onOutroEnd}
		class="role-dialog"
		style="--role-color: {style.border}; --role-text: {style.text}"
		transition:fade={{ duration: 300 }}
	>
		<div
			class="modal-content"
			in:scale={{ duration: 400, start: 0.92, easing: cubicOut }}
			out:scale={{ duration: 250, start: 0.96, easing: cubicOut }}
		>
			<button class="close-btn" on:click={handleClose} aria-label="Close modal">&times;</button>

			<header>
				<h2 class="titling">
					I am {article ? article + ' ' : ''}<span class="highlight titling">{label}</span>
				</h2>
				<p>
					Join Actualfood's mission to accelerate breakthroughs against chronic disease. Tell us how
					you'd like to contribute.
				</p>
			</header>

			<form on:submit|preventDefault={handleClose}>
				<div class="input-group">
					<label for="name">Name</label>
					<input type="text" id="name" required placeholder="Your name" />
				</div>

				<div class="input-group">
					<label for="email">Email</label>
					<input type="email" id="email" required placeholder="email@address.com" />
				</div>

				<div class="input-group">
					<label for="message">Message</label>
					<textarea id="message" placeholder="How can you help?"></textarea>
				</div>

				<button
					type="submit"
					class="submit-btn"
					style="background: {style.text}1c; color: {style.text}c2; border: 1px solid {style.text}33"
				>
					Send Message
				</button>
			</form>
		</div>
	</dialog>
{/if}

<style>
	/* Ensure the dialog is visible and centered when open */
	.role-dialog {
		background: transparent;
		border: none;
		padding: 0;
		margin: 0;
		outline: none;
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		max-width: none;
		max-height: none;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.role-dialog::backdrop {
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	/* Fixed the content container to prevent jank */
	.modal-content {
		background: rgba(10, 10, 15, 0.85);
		backdrop-filter: blur(32px);
		-webkit-backdrop-filter: blur(32px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		width: calc(100vw - 40px);
		max-width: 500px;
		border-radius: 28px;
		padding: 40px;
		box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8);
		color: white;
		position: relative;
		/* Force hardware acceleration for the scale animation */
		will-change: transform, opacity;
	}

	.close-btn {
		position: absolute;
		top: 24px;
		right: 24px;
		background: rgba(255, 255, 255, 0.05);
		border: none;
		color: white;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		opacity: 0.6;
		transition: all 0.2s;
	}

	.close-btn:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.1);
	}

	.titling {
		font-family: 'Exposure', serif;
		font-size: 1.8rem;
		margin-bottom: 12px;
		font-weight: 300;
		letter-spacing: -0.02em;
	}

	.highlight {
		color: var(--role-text);
		font-weight: 600;
	}

	header p {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.95rem;
		line-height: 1.6;
		margin-bottom: 30px;
	}

	.input-group input,
	.input-group textarea {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		transition: all 0.2s;
	}

	.input-group input:focus,
	.input-group textarea:focus {
		background: rgba(255, 255, 255, 0.08);
		border-color: var(--role-color);
		box-shadow: 0 0 0 4px rgba(var(--role-color-rgb), 0.1);
	}

	.submit-btn {
		transition:
			transform 0.2s,
			filter 0.2s,
			box-shadow 0.2s;
	}

	.submit-btn:active {
		transform: scale(0.98);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.input-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	input,
	textarea {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 12px 16px;
		color: white;
		font-family: 'Helvetica Neue', Helvetica, sans-serif;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--role-color);
		background: rgba(255, 255, 255, 0.06);
	}

	.submit-btn {
		width: 100%;
		font-weight: 700;
		padding: 16px;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
		font-family: 'Helvetica Neue', Helvetica, sans-serif;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.submit-btn:hover {
		transform: translateY(-2px);
		filter: brightness(1.3);
		box-shadow: 0 0 20px -5px var(--role-text);
	}

	@media (max-width: 480px) {
		.modal-content {
			padding: 30px 20px;
		}
	}
</style>
