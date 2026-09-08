<script lang="ts">
	import { toast } from '$lib/utils/toast.svelte';
	import { CheckCircle, WarningCircle, XCircle, Info, X } from 'phosphor-svelte';

	function handleCloseClick(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const id = target.dataset.toastId;
		if (id) toast.dismiss(id);
	}
</script>

{#if toast.toasts.length > 0}
	<aside class="toast-container" aria-live="polite" aria-label="Notifications">
		{#each toast.toasts as item (item.id)}
			<div class="toast-item {item.type}" role="status">
				<div class="toast-icon">
					{#if item.type === 'success'}
						<CheckCircle size={20} weight="fill" />
					{:else if item.type === 'error'}
						<XCircle size={20} weight="fill" />
					{:else if item.type === 'warning'}
						<WarningCircle size={20} weight="fill" />
					{:else}
						<Info size={20} weight="fill" />
					{/if}
				</div>

				<p class="toast-message">{item.message}</p>

				<button
					type="button"
					class="toast-close"
					data-toast-id={item.id}
					onclick={handleCloseClick}
					aria-label="Fermer la notification"
				>
					<X size={16} weight="bold" />
				</button>
			</div>
		{/each}
	</aside>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 10000;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 420px;
		width: calc(100vw - 2rem);
		pointer-events: none;
	}

	@media (max-width: 600px) {
		.toast-container {
			bottom: 1rem;
			right: 1rem;
			left: 1rem;
			width: auto;
		}
	}

	.toast-item {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1rem;
		border-radius: var(--radius-lg, 1rem);
		background: color-mix(in srgb, var(--color-surface-elevated, #1E1E1E) 92%, black);
		border: 1px solid var(--color-border-subtle);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		color: var(--color-text-primary);
		animation: toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.toast-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.toast-item.success {
		border-color: color-mix(in oklch, var(--color-success) 40%, transparent);
	}
	.toast-item.success .toast-icon {
		color: var(--color-success);
	}

	.toast-item.error {
		border-color: color-mix(in oklch, var(--color-error) 40%, transparent);
	}
	.toast-item.error .toast-icon {
		color: var(--color-error);
	}

	.toast-item.warning {
		border-color: color-mix(in oklch, var(--color-warning) 40%, transparent);
	}
	.toast-item.warning .toast-icon {
		color: var(--color-warning);
	}

	.toast-item.info {
		border-color: color-mix(in oklch, var(--color-primary) 40%, transparent);
	}
	.toast-item.info .toast-icon {
		color: var(--color-primary);
	}

	.toast-message {
		flex: 1;
		font-size: 0.88rem;
		line-height: 1.4;
		margin: 0;
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.toast-close {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: var(--radius-pill);
		transition: color 0.15s ease, background-color 0.15s ease;
		flex-shrink: 0;
	}

	.toast-close:hover {
		color: var(--color-text-primary);
		background: color-mix(in srgb, white 10%, transparent);
	}
</style>
