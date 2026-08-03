<script lang="ts">
	import { CheckCircle, XCircle } from 'phosphor-svelte';

	interface Props {
		option: string;
		idx: number;
		isSelected: boolean;
		showSuccess: boolean;
		showError: boolean;
		isLocked: boolean;
		onclick: (e: MouseEvent) => void;
		onkeydown: (e: KeyboardEvent) => void;
	}

	let { option, idx, isSelected, showSuccess, showError, isLocked, onclick, onkeydown }: Props = $props();
</script>

<button
	type="button"
	class="option-btn"
	class:selected={isSelected}
	class:correct-state={showSuccess}
	class:error-state={showError}
	class:locked={isLocked}
	disabled={isLocked}
	data-index={idx}
	{onclick}
	{onkeydown}
	aria-pressed={isSelected}
>
	<span class="option-letter">{String.fromCharCode(65 + idx)}</span>
	<span class="option-text">{option}</span>
	{#if showSuccess}
		<span class="status-icon" aria-label="Correct">
			<CheckCircle size={20} weight="fill" />
		</span>
	{:else if showError}
		<span class="status-icon" aria-label="Incorrect">
			<XCircle size={20} weight="fill" />
		</span>
	{/if}
</button>

<style>
	.option-btn {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		width: 100%;
		padding: 0.875rem 1rem;
		text-align: left;
		background-color: var(--color-bg);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-pill);
		color: var(--color-text-primary);
		font-weight: 500;
		transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.1s ease;
	}

	.option-btn:not(.locked):hover {
		border-color: var(--color-primary);
		background-color: var(--color-surface-hover);
		transform: translateY(-1px);
	}

	.option-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.option-btn.locked {
		cursor: default;
	}

	.option-letter {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.85rem;
		height: 1.85rem;
		border-radius: 50%;
		background-color: var(--color-border-subtle);
		color: var(--color-text-secondary);
		font-weight: 700;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.option-text {
		flex: 1;
		font-size: 0.95rem;
		line-height: 1.4;
	}

	.status-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: auto;
	}

	.correct-state {
		background-color: var(--color-success-bg);
		border-color: var(--color-success);
		color: var(--color-text-primary);
	}

	.correct-state .option-letter {
		background-color: var(--color-success);
		color: oklch(0.99 0 0);
	}

	.error-state {
		background-color: var(--color-error-bg);
		border-color: var(--color-error);
		color: var(--color-text-primary);
	}

	.error-state .option-letter {
		background-color: var(--color-error);
		color: oklch(0.99 0 0);
	}
</style>
