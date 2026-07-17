<script lang="ts">
	import type { PageData } from './$types';
	import ArtworkCard from '$lib/components/ArtworkCard.svelte';
	import QuickMCQ from '$lib/components/QuickMCQ.svelte';
	import { supabase } from '$lib/supabase/client';
	import { queueOfflineAnswer, saveToLocalCache, readFromLocalCache } from '$lib/offline/storage';

	let { data }: { data: PageData } = $props();

	let lesson = $derived(data.lesson);
	let progress = $derived(data.progress);
	let showQuiz = $state(false);
	let answered = $state(false);

	async function handleAnswer({ score, isCorrect, selectedIndex }: { score: number; isCorrect: boolean; selectedIndex: number }) {
		if (!lesson || answered) return;
		answered = true;

		const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
		const userId = 'anonymous-user-001';
		const nowStr = new Date().toISOString();

		const currentLevel = progress?.box_level ?? 1;
		const newBoxLevel = isCorrect ? Math.min(5, currentLevel + 1) : 1;
		const consecutive = isCorrect ? (progress?.consecutive_correct ?? 0) + 1 : 0;

		const answerPayload = {
			user_id: userId,
			id_oeuvre: lesson.id,
			id_courant: lesson.id_courant,
			is_correct: isCorrect,
			reponse_choisie: selectedIndex,
			score,
			encounter_type: 'CATALOG' as const,
			answered_at: nowStr,
			box_level: newBoxLevel,
			consecutive_correct: consecutive
		};

		if (isOnline) {
			try {
				await Promise.all([
					(supabase.from('historique_reponses') as any).insert({
						user_id: userId,
						id_oeuvre: lesson.id,
						id_courant: lesson.id_courant,
						is_correct: isCorrect,
						reponse_choisie: selectedIndex,
						score,
						encounter_type: 'CATALOG',
						answered_at: nowStr
					}),
					(supabase.from('user_artwork_progress') as any).upsert(
						{
							user_id: userId,
							id_oeuvre: lesson.id,
							box_level: newBoxLevel,
							consecutive_correct: consecutive,
							last_score: score,
							updated_at: nowStr
						},
						{ onConflict: 'user_id, id_oeuvre' }
					)
				]);
			} catch (err) {
				await queueOfflineAnswer(answerPayload);
			}
		} else {
			await queueOfflineAnswer(answerPayload);
		}
	}
</script>

<div class="detail-view">
	<nav class="back-nav">
		<a href="/catalogue" class="back-link">← Back to Catalog</a>
	</nav>

	<header class="detail-header">
		<span class="movement-tag" style:background-color={lesson.oklch_token}>
			{lesson.nom_courant}
		</span>
		<h1 class="artwork-title">{lesson.titre}</h1>
		<p class="artwork-meta">{lesson.artiste} ({lesson.date_creation})</p>
	</header>

	<section class="card-display">
		<ArtworkCard
			artwork={lesson}
			movementName={lesson.nom_courant}
			oklchToken={lesson.oklch_token}
			anecdote={lesson.anecdote_accroche}
			description={lesson.anecdote_technique}
		/>
	</section>

	<section class="deep-dive-section">
		<div class="info-block">
			<h3 class="block-heading">Historical & Technical Analysis</h3>
			<p class="block-text">{lesson.anecdote_technique}</p>
		</div>

		{#if lesson.anecdote_secrete}
			<div class="secret-block" style:--movement-color={lesson.oklch_token}>
				<h4 class="secret-heading">💡 Secret Anecdote & Symbolism</h4>
				<p class="secret-text">{lesson.anecdote_secrete}</p>
			</div>
		{/if}
	</section>

	<section class="quiz-toggle-section">
		{#if !showQuiz}
			<button type="button" class="test-knowledge-btn" onclick={() => (showQuiz = true)}>
				🧠 Test Your Knowledge on This Masterpiece →
			</button>
		{:else}
			<div class="quiz-container">
				<div class="quiz-top">
					<h3>On-Demand Knowledge Check</h3>
					<button type="button" class="close-quiz-btn" onclick={() => (showQuiz = false)}>Close Quiz ✕</button>
				</div>
				<QuickMCQ qcm={lesson.qcm} disabled={answered} onAnswer={handleAnswer} />
			</div>
		{/if}
	</section>
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding-bottom: 3rem;
	}

	.back-nav {
		margin-top: 0.5rem;
	}

	.back-link {
		display: inline-block;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-primary);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.detail-header {
		text-align: center;
	}

	.movement-tag {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.35rem 0.85rem;
		border-radius: 9999px;
		color: oklch(0.99 0 0);
		margin-bottom: 0.65rem;
		box-shadow: var(--shadow-sm);
	}

	.artwork-title {
		font-size: 2.25rem;
		font-weight: 800;
		line-height: 1.15;
		color: var(--color-text-primary);
		margin-bottom: 0.35rem;
	}

	.artwork-meta {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.deep-dive-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		background: var(--color-surface);
		padding: 1.75rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.block-heading {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: 0.65rem;
	}

	.block-text {
		font-size: 1rem;
		line-height: 1.6;
		color: var(--color-text-secondary);
	}

	.secret-block {
		padding: 1.25rem;
		background: var(--color-bg);
		border-left: 4px solid var(--movement-color, var(--color-accent));
		border-radius: var(--radius-md);
	}

	.secret-heading {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: 0.4rem;
	}

	.secret-text {
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}

	.quiz-toggle-section {
		text-align: center;
	}

	.test-knowledge-btn {
		width: 100%;
		max-width: 500px;
		padding: 1rem 1.5rem;
		font-size: 1.05rem;
		font-weight: 700;
		border-radius: var(--radius-lg);
		background: var(--color-primary);
		color: oklch(0.99 0 0);
		box-shadow: var(--shadow-md);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.test-knowledge-btn:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.quiz-container {
		text-align: left;
		background: var(--color-surface);
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		animation: fadeIn 0.25s ease;
	}

	.quiz-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.close-quiz-btn {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.close-quiz-btn:hover {
		color: var(--color-error);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
