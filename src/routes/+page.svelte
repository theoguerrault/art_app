<script lang="ts">
	import type { PageData } from './$types';
	import ArtworkCard from '$lib/features/artwork/components/ArtworkCard.svelte';
	import QuickMCQ from '$lib/features/quiz/components/QuickMCQ.svelte';
	import { supabase } from '$lib/supabase/client';
	import { queueOfflineAnswer, saveToLocalCache, readFromLocalCache } from '$lib/offline/storage';
	import { _getLeitnerReviewDate } from './+page';
	import { Package, Palette } from 'phosphor-svelte';
	import { authStore } from '$lib/core/auth.svelte';

	let { data }: { data: PageData } = $props();

	let lesson = $derived(data.lesson);
	let currentBoxLevel = $state<number>(1);
	let answered = $state(false);
	let lastScore = $state<number | null>(null);

	function extractHue(oklchToken: string | undefined): number {
		if (!oklchToken) return 45;
		const matches = oklchToken.match(/[\d.]+/g);
		if (matches && matches.length >= 3) {
			return parseFloat(matches[2]);
		}
		return 45;
	}

	$effect(() => {
		if (lesson) {
			const hue = extractHue(lesson.oklch_token);
			document.documentElement.style.setProperty('--artwork-hue', hue.toString());
		} else {
			document.documentElement.style.setProperty('--artwork-hue', '45');
		}
	});

	async function handleAnswer({ score, isCorrect, selectedIndex }: { score: number; isCorrect: boolean; selectedIndex: number }) {
		if (!lesson || answered) return;
		answered = true;
		lastScore = score;

		const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
		const userId = 'anonymous-user-001'; // Fallback or authenticated session ID
		const nowStr = new Date().toISOString();

		// Calculate new Leitner box progression
		let newBoxLevel = isCorrect ? Math.min(5, currentBoxLevel + 1) : 1;
		let consecutive = isCorrect ? 1 : 0;
		let nextReviewAt = _getLeitnerReviewDate(newBoxLevel);

		currentBoxLevel = newBoxLevel;

		const answerPayload = {
			user_id: userId,
			id_oeuvre: lesson.id,
			id_courant: lesson.id_courant,
			is_correct: isCorrect,
			reponse_choisie: selectedIndex,
			score,
			encounter_type: 'DAILY' as const,
			answered_at: nowStr,
			next_review_at: nextReviewAt,
			box_level: newBoxLevel,
			consecutive_correct: consecutive
		};

		if (isOnline) {
			try {
				// Save directly to Supabase if online
				await Promise.all([
					(supabase.from('historique_reponses') as any).insert({
						user_id: userId,
						id_oeuvre: lesson.id,
						id_courant: lesson.id_courant,
						is_correct: isCorrect,
						reponse_choisie: selectedIndex,
						score,
						encounter_type: 'DAILY',
						answered_at: nowStr
					}),
					(supabase.from('user_artwork_progress') as any).upsert(
						{
							user_id: userId,
							id_oeuvre: lesson.id,
							box_level: newBoxLevel,
							consecutive_correct: consecutive,
							next_review_at: nextReviewAt,
							last_score: score,
							last_presented_daily_at: nowStr,
							updated_at: nowStr
						},
						{ onConflict: 'user_id, id_oeuvre' }
					)
				]);
			} catch (err) {
				console.warn('[TodayAnswer] Online sync failed, queuing to IndexedDB:', err);
				await queueOfflineAnswer(answerPayload);
			}
		} else {
			// Queue directly for offline synchronization
			await queueOfflineAnswer(answerPayload);
		}

		// Update local cache progress directly for instant offline continuity
		const cachedProgress: any[] = (await readFromLocalCache('user_progress_cache')) || [];
		const idx = cachedProgress.findIndex((p: any) => p.id_oeuvre === lesson?.id);
		const progressItem = {
			user_id: userId,
			id_oeuvre: lesson.id,
			box_level: newBoxLevel,
			consecutive_correct: consecutive,
			next_review_at: nextReviewAt,
			last_score: score,
			last_presented_daily_at: nowStr,
			updated_at: nowStr
		};

		if (idx >= 0) {
			cachedProgress[idx] = progressItem;
		} else {
			cachedProgress.push(progressItem);
		}
		await saveToLocalCache('user_progress_cache', cachedProgress);
	}
</script>

<div class="today-view">
	<header class="today-header">
		<div class="date-badge">
			<span>À la une aujourd'hui</span>
		</div>
		<h1 class="page-title">Découverte Quotidienne</h1>
		<p class="page-subtitle">Prenez 3 minutes pour étudier l'œuvre du jour et améliorer votre maîtrise de l'art.</p>
	</header>

	{#if lesson}
		<section class="card-section">
			<ArtworkCard
				artwork={lesson}
				movementName={lesson.nom_courant}
				oklchToken={lesson.oklch_token}
				anecdote={lesson.anecdote_accroche}
				description={lesson.anecdote_technique}
			/>
		</section>

		<section class="quiz-section">
			<QuickMCQ
				qcm={lesson.qcm}
				disabled={answered}
				onAnswer={handleAnswer}
			/>
		</section>

		{#if answered}
			<div class="leitner-feedback" style:--movement-color={lesson.oklch_token}>
				<div class="leitner-level">
					<span class="level-icon"><Package size={22} weight="fill" /></span>
					<span>Statut de la boîte Leitner : <strong>Niveau {currentBoxLevel} / 5</strong></span>
				</div>
				<p class="leitner-note">
					Prochaine révision prévue pour ce concept : <strong>{new Date(_getLeitnerReviewDate(currentBoxLevel)).toLocaleDateString()}</strong>
				</p>
			</div>
		{/if}
	{:else}
		<div class="empty-state">
			<span class="empty-icon"><Palette size={48} weight="fill" /></span>
			<h3>Tout est à jour !</h3>
			<p>Aucune révision prévue pour le moment. Visitez le catalogue pour explorer de nouveaux mouvements artistiques à votre rythme.</p>
			<a href="/catalogue" class="cta-link">Explorer le catalogue →</a>
		</div>
	{/if}
</div>

<style>
	.today-view {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		padding-bottom: 2rem;
	}

	.today-header {
		text-align: center;
		margin-top: 0.5rem;
	}

	.date-badge {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.35rem 0.8rem;
		border-radius: 9999px;
		background-color: var(--color-primary-light);
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}

	.page-title {
		font-size: 2.1rem;
		font-weight: 800;
		line-height: 1.15;
		color: var(--color-text-primary);
	}

	.page-subtitle {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		max-width: 480px;
		margin: 0.35rem auto 0;
	}

	.card-section, .quiz-section {
		width: 100%;
	}

	.leitner-feedback {
		margin-top: 0.5rem;
		padding: 1.25rem;
		border-radius: var(--radius-md);
		background-color: var(--color-surface);
		border: 1.5px solid var(--movement-color, var(--color-primary));
		box-shadow: var(--shadow-sm);
		text-align: center;
		animation: slideUp 0.3s ease;
	}

	.leitner-level {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: 0.35rem;
	}

	.leitner-note {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.empty-state {
		text-align: center;
		padding: 3.5rem 1.5rem;
		background-color: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		margin-top: 1rem;
	}

	.empty-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
		color: var(--color-primary);
	}

	.empty-state h3 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
		max-width: 360px;
		margin-left: auto;
		margin-right: auto;
	}

	.cta-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-md);
		background-color: var(--color-primary);
		color: oklch(0.99 0 0);
		font-weight: 700;
		text-decoration: none;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.cta-link:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
