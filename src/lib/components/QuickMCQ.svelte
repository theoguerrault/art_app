<script lang="ts">
	import type { MCQ, QCMSynthese } from '$lib/types/database';

	interface QuickMCQProps {
		qcm_synthese?: QCMSynthese | MCQ | null;
		qcm?: QCMSynthese | MCQ | null;
		disabled?: boolean;
		onAnswer?: (result: { score: number; isCorrect: boolean; selectedIndex: number }) => void;
	}

	let {
		qcm_synthese,
		qcm,
		disabled = false,
		onAnswer
	}: QuickMCQProps = $props();

	let activeQcm = $derived(qcm_synthese || qcm || null);
	let selectedIndex = $state<number | null>(null);

	let isAnswered = $derived(selectedIndex !== null);
	let isCorrect = $derived(
		activeQcm && selectedIndex !== null ? selectedIndex === activeQcm.correctIndex : false
	);

	function selectOption(index: number) {
		if (isAnswered || disabled || !activeQcm) return;

		selectedIndex = index;
		const correct = index === activeQcm.correctIndex;
		const score = correct ? 100 : 0;

		if (onAnswer) {
			onAnswer({ score, isCorrect: correct, selectedIndex: index });
		}
	}

	function handleKeyDown(event: KeyboardEvent, index: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectOption(index);
		}
	}
</script>

<div class="mcq-wrapper container-mcq">
	{#if activeQcm}
		<div class="mcq-card">
			<div class="question-header">
				<span class="mcq-badge">Knowledge Check</span>
				<h3 class="question-text">{activeQcm.question}</h3>
			</div>

			<div class="options-container responsive-options-grid" role="group" aria-label="Multiple choice options">
				{#each activeQcm.options as option, idx}
					{@const isSelected = selectedIndex === idx}
					{@const isCorrectOption = idx === activeQcm.correctIndex}
					{@const showSuccess = isAnswered && isCorrectOption}
					{@const showError = isAnswered && isSelected && !isCorrectOption}

					<button
						type="button"
						class="option-btn"
						class:selected={isSelected}
						class:correct-state={showSuccess}
						class:error-state={showError}
						class:locked={isAnswered || disabled}
						disabled={isAnswered || disabled}
						onclick={() => selectOption(idx)}
						onkeydown={(e) => handleKeyDown(e, idx)}
						aria-pressed={isSelected}
					>
						<span class="option-letter">{String.fromCharCode(65 + idx)}</span>
						<span class="option-text">{option}</span>
						{#if showSuccess}
							<span class="status-icon" aria-label="Correct">✓</span>
						{:else if showError}
							<span class="status-icon" aria-label="Incorrect">✕</span>
						{/if}
					</button>
				{/each}
			</div>

			{#if isAnswered && activeQcm.explanation}
				<div
					class="explanation-box"
					class:explanation-success={isCorrect}
					class:explanation-error={!isCorrect}
					role="region"
					aria-live="polite"
				>
					<div class="explanation-title">
						<span>{isCorrect ? '🎯 Correct!' : '💡 Good effort!'}</span>
					</div>
					<p class="explanation-text">{activeQcm.explanation}</p>
				</div>
			{/if}
		</div>
	{:else}
		<div class="mcq-empty">
			<p>No question available for this item.</p>
		</div>
	{/if}
</div>

<style>
	.mcq-wrapper {
		width: 100%;
		max-width: 100%;
		margin: 1.25rem auto 0;
	}

	.mcq-card {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
	}

	.question-header {
		margin-bottom: 1.25rem;
	}

	.mcq-badge {
		display: inline-block;
		font-size: 0.725rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
		background-color: var(--color-border-subtle);
		color: var(--color-text-secondary);
		margin-bottom: 0.65rem;
	}

	.question-text {
		font-size: 1.15rem;
		font-weight: 700;
		line-height: 1.35;
		color: var(--color-text-primary);
	}

	.options-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.option-btn {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		width: 100%;
		padding: 0.875rem 1rem;
		text-align: left;
		background-color: var(--color-bg);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-md);
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
		border-radius: 0.4rem;
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
		font-weight: 800;
		font-size: 1.1rem;
		margin-left: auto;
	}

	/* Semantic Feedback States */
	.correct-state {
		background-color: var(--color-success-bg) !important;
		border-color: var(--color-success) !important;
		color: var(--color-text-primary);
	}

	.correct-state .option-letter {
		background-color: var(--color-success);
		color: oklch(0.99 0 0);
	}

	.error-state {
		background-color: var(--color-error-bg) !important;
		border-color: var(--color-error) !important;
		color: var(--color-text-primary);
	}

	.error-state .option-letter {
		background-color: var(--color-error);
		color: oklch(0.99 0 0);
	}

	.explanation-box {
		margin-top: 1.25rem;
		padding: 1.1rem;
		border-radius: var(--radius-md);
		border-left: 4px solid var(--color-primary);
		background-color: var(--color-bg);
		animation: fadeIn 0.2s ease;
	}

	.explanation-success {
		border-left-color: var(--color-success);
		background-color: var(--color-success-bg);
	}

	.explanation-error {
		border-left-color: var(--color-error);
		background-color: var(--color-error-bg);
	}

	.explanation-title {
		font-weight: 700;
		font-size: 0.95rem;
		margin-bottom: 0.35rem;
	}

	.explanation-text {
		font-size: 0.925rem;
		line-height: 1.5;
		color: var(--color-text-primary);
	}

	.mcq-empty {
		padding: 1.5rem;
		text-align: center;
		color: var(--color-text-muted);
		background: var(--color-surface);
		border-radius: var(--radius-md);
		border: 1px dashed var(--color-border);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
