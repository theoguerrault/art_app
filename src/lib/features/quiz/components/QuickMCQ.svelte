<script lang="ts">
	import type { MCQ, QCMSynthese } from '$lib/types/database';
	import { createQuizSession } from '../logic/useQuizSession.svelte';
	import MCQOption from './MCQOption.svelte';
	import MCQExplanation from './MCQExplanation.svelte';

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

	function handleOptionClick(e: MouseEvent) {
		const target = e.currentTarget as HTMLButtonElement;
		const index = parseInt(target.dataset.index || '0', 10);
		session.selectOption(index);
	}

	function handleOptionKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const target = e.currentTarget as HTMLButtonElement;
			const index = parseInt(target.dataset.index || '0', 10);
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
				{#each session.qcm.options as option, idx (idx)}
					<MCQOption
						{option}
						{idx}
						isSelected={session.selectedIndex === idx}
						showSuccess={session.isAnswered && idx === session.qcm.correctIndex}
						showError={session.isAnswered && session.selectedIndex === idx && idx !== session.qcm.correctIndex}
						isLocked={session.isAnswered || session.disabled}
						onclick={handleOptionClick}
						onkeydown={handleOptionKeydown}
					/>
				{/each}
			</div>

			{#if session.isAnswered && session.qcm.explanation}
				<MCQExplanation isCorrect={session.isCorrect} explanation={session.qcm.explanation} />
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


	.mcq-empty {
		padding: 1.5rem;
		text-align: center;
		color: var(--color-text-muted);
		background: var(--color-surface);
		border-radius: var(--radius-md);
		border: 1px dashed var(--color-border);
	}
</style>
