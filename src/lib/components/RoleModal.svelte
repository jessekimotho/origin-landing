<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut, quintOut } from 'svelte/easing';
	import { ROLE_COPY } from '$lib/constants';

	export let isOpen = false;
	export let label = '';
	export let style = { border: '', bg: '', text: '' };
	export let article = '';

	const dispatch = createEventDispatcher();
	let dialog: HTMLDialogElement;

	$: activeCopy = ROLE_COPY[label] || ROLE_COPY['default'];

	$: if (dialog) {
		if (isOpen) {
			dialog.showModal();
			document.body.style.overflow = 'hidden';
		} else if (dialog.open) {
			document.body.style.overflow = 'unset';
		}
	}

	function handleClose() {
		dispatch('close');
	}

	function onOutroEnd() {
		if (!isOpen && dialog) {
			dialog.close();
		}
	}

	function blurTransition(node: HTMLElement, { duration = 500 }) {
		return {
			duration,
			tick: (t: number) => {
				node.style.setProperty('--backdrop-blur', `${t * 20}px`);
				node.style.setProperty('--vignette-opacity', `${t * 0.9}`);
			}
		};
	}
</script>

{#if isOpen}
	<dialog
		bind:this={dialog}
		on:click|self={handleClose}
		on:outroend={onOutroEnd}
		class="role-dialog"
		style="--role-color: {style.border}; --role-text: {style.text}"
		transition:blurTransition={{ duration: 500 }}
	>
		<div
			class="modal-content"
			in:scale={{ duration: 600, start: 0.9, easing: quintOut }}
			out:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
		>
			<button class="close-btn" on:click={handleClose} aria-label="Close modal">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
					<path
						d="M1 1L13 13M1 13L13 1"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</button>

			<header>
				<h2 class="titling">
					I am {article ? article + ' ' : ''}<span class="highlight">{label}</span>
				</h2>
				<p class="role-desc">
					{activeCopy.desc}
				</p>
			</header>

			<form on:submit|preventDefault={handleClose}>
				<div class="input-row">
					<div class="input-group">
						<label for="name">Name</label>
						<input type="text" id="name" required placeholder="Enter your name" />
					</div>

					<div class="input-group">
						<label for="email">Email</label>
						<input type="email" id="email" required placeholder="email@address.com" />
					</div>
				</div>

				<div class="input-group">
					<label for="message">Contribution</label>
					<textarea id="message" rows="4" placeholder={activeCopy.placeholder}></textarea>
				</div>

				<button
					type="submit"
					class="submit-btn"
					style:background="{style.text}33"
					style:color={style.text}
					style:border="1px solid {style.text}88"
				>
					Transmit Message
				</button>
			</form>
		</div>
	</dialog>
{/if}

<style>
	.role-dialog {
		background: transparent;
		border: none;
		padding: 20px;
		margin: 0;
		outline: none;
		position: fixed;
		inset: 0;
		min-width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start; /* Allow content to flow naturally */
		overflow-y: auto; /* The dialog itself becomes the scroll container */
		z-index: 9999;
	}

	.role-dialog::before {
		content: '';
		position: fixed;
		inset: 0;
		background: radial-gradient(
			circle,
			transparent 0%,
			rgba(0, 0, 0, var(--vignette-opacity, 0)) 100%
		);
		backdrop-filter: blur(var(--backdrop-blur, 0px));
		-webkit-backdrop-filter: blur(var(--backdrop-blur, 0px));
		pointer-events: none;
		z-index: -1;
	}

	.modal-content {
		background: rgba(12, 12, 14, 0.45);
		backdrop-filter: blur(40px);
		-webkit-backdrop-filter: blur(40px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		width: 100%;
		max-width: 540px;
		margin: auto; /* Vertically centers when short, flows when tall */
		border-radius: 32px;
		padding: 48px;
		box-shadow: 0 40px 120px -20px rgba(0, 0, 0, 0.8);
		color: white;
		position: relative;
		box-sizing: border-box;
		/* Removed max-height constraints to allow natural growth */
		/* Removed overflow-y: auto since the parent now scrolls */
	}

	.close-btn {
		position: absolute;
		top: 32px;
		right: 32px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: white;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 10;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: rotate(90deg);
	}

	.titling {
		font-family: 'Exposure', serif;
		font-size: 2.2rem;
		line-height: 1.1;
		margin-bottom: 20px;
		font-weight: 300;
		letter-spacing: -0.03em;
	}

	.highlight {
		color: var(--role-text);
		font-weight: 600;
		filter: saturate(1.8) drop-shadow(0 0 15px var(--role-text));
	}

	.role-desc {
		color: rgba(255, 255, 255, 0.5);
		font-size: 1.05rem;
		line-height: 1.6;
		margin-bottom: 40px;
		max-width: 90%;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 24px;
		width: 100%;
	}

	.input-row {
		display: flex;
		gap: 20px;
		width: 100%;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex: 1;
		min-width: 0; /* Critical for preventing overflow */
	}

	label {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.2em;
		font-weight: 600;
	}

	input,
	textarea {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 14px 18px;
		color: white;
		font-family: inherit;
		font-size: 0.95rem;
		transition: all 0.3s ease;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus,
	textarea:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.06);
		border-color: var(--role-color);
		box-shadow: 0 0 20px -10px var(--role-color);
	}

	.submit-btn {
		width: 100%;
		font-weight: 700;
		padding: 18px;
		border-radius: 14px;
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		font-size: 0.8rem;

		/* Glassmorphic Base */
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.05) 0%,
			rgba(255, 255, 255, 0.01) 100%
		);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);

		position: relative;
		overflow: hidden;
		transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
		will-change: transform, box-shadow;
	}

	.submit-btn:hover {
		/* Subtle Lift */
		transform: translateY(-3px);

		/* Role-Tuned Vibrant Border */
		border-color: var(--role-text);
		color: #ffffff;

		/* Glass Refraction Effect */
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.1) 0%,
			/* Saturated role-based tint in the background */ calc(var(--role-text)) 10%
		);

		/* Dual-Layer Glow: 
           1. Sharp Inner Highlight
           2. Broad Atmospheric Color Spillage 
        */
		box-shadow:
			inset 0 0 12px 0 rgba(255, 255, 255, 0.1),
			0 0 0 1px var(--role-text),
			0 20px 40px -12px rgba(0, 0, 0, 0.5),
			0 10px 30px -5px var(--role-text);

		filter: saturate(1.8) brightness(1.1);
	}

	/* Add a subtle "shimmer" streak on hover */
	.submit-btn::after {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transform: rotate(45deg) translateY(100%);
		transition: transform 0.8s ease;
	}

	.submit-btn:hover::after {
		transform: rotate(45deg) translateY(-100%);
	}

	@media (max-width: 600px) {
		.modal-content {
			padding: 32px 24px;
			width: 100%;
			margin: auto;
			border-radius: 24px;
		}
		.input-row {
			flex-direction: column;
			gap: 16px;
		}
		.titling {
			font-size: 1.8rem;
		}
	}

	@media (max-width: 560px) {
		.role-dialog {
			padding: 10px;
		}

		.modal-content {
			padding: 24px 20px;
			border-radius: 20px;
		}

		.close-btn {
			top: 20px;
			right: 20px;
			width: 32px;
			height: 32px;
		}

		.titling {
			font-size: 1.5rem;
			margin-bottom: 16px;
			padding-right: 20px; /* Make space for close button */
		}

		.role-desc {
			font-size: 0.9rem;
			line-height: 1.5;
			margin-bottom: 24px;
		}

		form {
			gap: 16px;
		}

		.input-group {
			gap: 6px;
		}

		label {
			font-size: 0.6rem;
		}

		input,
		textarea {
			padding: 12px 14px;
			font-size: 16px; /* Prevents iOS zoom */
			border-radius: 10px;
		}

		.submit-btn {
			padding: 14px;
			font-size: 0.75rem;
		}
	}
</style>
