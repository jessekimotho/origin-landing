<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	export let isOpen = false;
	export let label = '';
	export let style = { border: '', bg: '', text: '' };
	export let article = 'a';

	const dispatch = createEventDispatcher();
	let dialog: HTMLDialogElement;

	$: if (dialog) {
		if (isOpen) {
			dialog.showModal();
			document.body.style.overflow = 'hidden';
		} else {
			dialog.close();
			document.body.style.overflow = 'unset';
		}
	}

	function close() {
		dispatch('close');
	}
</script>

<dialog
	bind:this={dialog}
	on:close={close}
	on:click|self={close}
	class="role-dialog"
	style="--role-color: {style.border}; --role-text: {style.text}"
>
	{#if isOpen}
		<div class="modal-content" transition:scale={{ duration: 300, start: 0.95 }}>
			<button class="close-btn" on:click={close} aria-label="Close modal">&times;</button>

			<header>
				<h2 class="titling">I am {article} <span class="highlight titling">{label}</span></h2>
				<p>
					Join Actualfood's mission to accelerate breakthroughs against chronic disease. Tell us how
					you'd like to contribute.
				</p>
			</header>

			<form on:submit|preventDefault={() => close()}>
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
	{/if}
</dialog>

<style>
	.role-dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: transparent;
		border: none;
		padding: 0;
		margin: 0;
		outline: none;
		overflow: visible;
		display: block;
	}

	.role-dialog::backdrop {
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(12px);
	}

	.modal-content {
		background: rgba(15, 15, 20, 0.8);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		width: calc(100vw - 40px);
		max-width: 500px;
		border-radius: 24px;
		padding: 40px;
		box-shadow: 0 0 80px -20px rgba(0, 0, 0, 0.5);
		color: white;
	}

	.close-btn {
		position: absolute;
		top: 20px;
		right: 20px;
		background: none;
		border: none;
		color: white;
		font-size: 28px;
		cursor: pointer;
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.titling {
		font-family: 'Exposure', serif;
		font-size: 1.8rem;
		margin-bottom: 12px;
		font-weight: 300;
	}
	.highlight {
		color: var(--role-text);
		font-weight: 700;
	}

	header p {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.95rem;
		line-height: 1.5;
		margin-bottom: 30px;
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
