<script lang="ts">
	import type { MCQ, QCMSynthese } from '$lib/types/database';
	import { CheckCircle, XCircle, Target, Lightbulb } from 'phosphor-svelte';
	import { createQuizSession } from '../logic/useQuizSession.svelte';

	interface QuickMCQProps {
		qcm_synthese?: QCMSynthese | MCQ | null;
		qcm?: QCMSynthese | MCQ | null;
		disabled?: boolean;
		onAnswer?: (result: { score: number; isCorrect: boolean; selectedIndex: number }) => void;
		onStart?: () => void;
	}

	let {
		qcm_synthese,
		qcm,
		disabled = false,
		onAnswer,
		onStart
	}: QuickMCQProps = $props();

	// Initialize state machine
	const session = createQuizSession(null, (...args) => onAnswer?.(...args));

	// Sync props to state if they change externally
	$effect(() => {
		session.setQcm(qcm_synthese || qcm || null);
	});
	$effect(() => {
		session.setDisabled(disabled);
	});

	function handleKeyDown(event: KeyboardEvent, index: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			session.selectOption(index);
		}
	}

	function handleStart() {
		session.startQuiz();
		onStart?.();
	}
</script>

<div class="mcq-wrapper container-mcq">
	{#if session.qcm}
		<div class="mcq-card">
			<div class="question-header">
				<span class="mcq-badge">Test de connaissances</span>
				{#if session.isStarted}
					<h3 class="question-text">{session.qcm.question}</h3>
				{/if}
			</div>

			{#if !session.isStarted}
				<div class="quiz-start-container">
					<p class="quiz-start-text">Testez vos connaissances sur cette œuvre. Attention : la description sera masquée !</p>
					<button class="start-quiz-btn" onclick={handleStart}>
						Démarrer le quiz
					</button>
				</div>
			{:else}
				<div class="options-container responsive-options-grid" role="group" aria-label="Options à choix multiples">
				{#each session.qcm.options as option, idx}
					{@const isSelected = session.selectedIndex === idx}
					{@const isCorrectOption = idx === session.qcm.correctIndex}
					{@const showSuccess = session.isAnswered && isCorrectOption}
					{@const showError = session.isAnswered && isSelected && !isCorrectOption}

					<button
						type="button"
						class="option-btn"
						class:selected={isSelected}
						class:correct-state={showSuccess}
						class:error-state={showError}
						class:locked={session.isAnswered || session.disabled}
						disabled={session.isAnswered || session.disabled}
						onclick={() => session.selectOption(idx)}
						onkeydown={(e) => handleKeyDown(e, idx)}
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
				{/each}
			</div>

			{#if session.isAnswered && session.qcm.explanation}
				<div
					class="explanation-box"
					class:explanation-success={session.isCorrect}
					class:explanation-error={!session.isCorrect}
					role="region"
					aria-live="polite"
				>
					<div class="explanation-title">
						{#if session.isCorrect}
							<Target size={20} weight="fill" class="title-icon success-icon" />
							<span>Correct !</span>
						{:else}
							<Lightbulb size={20} weight="fill" class="title-icon info-icon" />
							<span>Bel effort !</span>
						{/if}
					</div>
					<p class="explanation-text">{session.qcm.explanation}</p>
				</div>
			{/if}
			{/if}
		</div>
	{:else}
		<div class="mcq-empty">
			<p>Aucune question disponible pour cet élément.</p>
		</div>
	{/if}
</div>

<style>
	.quiz-start-container {
		text-align: center;
		padding: 2rem 1rem;
		background: var(--color-surface-hover);
		border-radius: var(--radius-md);
		border: 1px dashed var(--color-border);
	}

	.quiz-start-text {
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
		font-size: 0.95rem;
	}

	.start-quiz-btn {
		background: var(--color-primary);
		color: oklch(0.99 0 0);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-pill);
		font-weight: 700;
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.start-quiz-btn:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}

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
		border-radius: 50%; /* Perfect circle inside pill */
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
		display: flex;
		align-items: center;
		gap: 0.45rem;
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
