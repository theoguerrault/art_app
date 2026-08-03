<script lang="ts">
	import { Target, Lightbulb } from 'phosphor-svelte';

	interface Props {
		isCorrect: boolean;
		explanation: string;
	}

	let { isCorrect, explanation }: Props = $props();
</script>

<div
	class="explanation-box"
	class:explanation-success={isCorrect}
	class:explanation-error={!isCorrect}
	role="region"
	aria-live="polite"
>
	<div class="explanation-title">
		{#if isCorrect}
			<Target size={20} weight="fill" class="title-icon success-icon" />
			<span>Correct !</span>
		{:else}
			<Lightbulb size={20} weight="fill" class="title-icon info-icon" />
			<span>Bel effort !</span>
		{/if}
	</div>
	<p class="explanation-text">{explanation}</p>
</div>

<style>
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
