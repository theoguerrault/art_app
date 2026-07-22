<script lang="ts">
	import { onMount } from "svelte";
	import type { PageData } from "./$types";
	import ArtworkCard from "$lib/features/artwork/components/ArtworkCard.svelte";
	import QuickMCQ from "$lib/features/quiz/components/QuickMCQ.svelte";
	import {
		ArrowLeft,
		Lightbulb,
		Brain,
		X,
		Bank,
		PaintBrush,
		Ruler,
		Tag,
		Calendar,
		User,
		Info,
		Compass,
		BookOpen,
		Eye,
		Article,
	} from "phosphor-svelte";
	import { supabase } from "$lib/supabase/client";
	import {
		queueOfflineAnswer,
		saveToLocalCache,
		readFromLocalCache,
	} from "$lib/offline/storage";
	import { parseMarkdown } from '$lib/utils/markdown';

	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	let lesson = $derived(data.lesson);
	let progress = $derived(data.progress);
	let showQuiz = $state(false);
	let answered = $state(false);

	let dynamicArticlePrincipal = $state<string | null>(null);
	let dynamicAnecdotesSecretes = $state<string[] | null>(null);
	
	let isContentEmpty = $derived(isMissingOrPlaceholder(dynamicArticlePrincipal || lesson.article_principal));

	let isFetchingDescription = $state(false);
	
	let lastInitializedSlug = '';

	function isMissingOrPlaceholder(str: string | null | undefined): boolean {
		if (!str || str.trim() === '') return true;
		const placeholders = [
			'Explorez l\'histoire profonde',
			'Analysez la maîtrise technique',
			'Découvrez les détails cachés',
			'Période historique',
			'Mouvement Artistique',
			'Contenu en cours de rédaction',
		];
		return placeholders.some((p) => str.includes(p));
	}

	function isMissingOrPlaceholderArray(arr: string[] | null | undefined): boolean {
		if (!arr || arr.length === 0) return true;
		return arr.some(str => isMissingOrPlaceholder(str));
	}

	function extractHue(oklch: string): number {
		const match = oklch.match(/oklch\([\d.]+\s+[\d.]+\s+([\d.]+)\)/);
		if (match && match[1]) {
			return parseFloat(match[1]);
		}
		const matches = oklch.match(/oklch\(\s*(?:calc\()?[^,)]+(?:\))?\s*,\s*[^,]+\s*,\s*([\d.]+)\s*\)/);
		if (matches && matches[1]) {
			return parseFloat(matches[1]);
		}
		return 45;
	}

	$effect(() => {
		if (!lesson || typeof window === 'undefined') return;

		// React to lesson.slug changes ONLY
		const currentSlug = lesson.slug;

		untrack(() => {
			if (currentSlug !== lastInitializedSlug) {
				lastInitializedSlug = currentSlug;
				
				// 1. Initialize local states from the new lesson
				const hue = extractHue(lesson.oklch_token);
				document.documentElement.style.setProperty("--artwork-hue", hue.toString());

				dynamicArticlePrincipal = !isMissingOrPlaceholder(lesson.article_principal) ? lesson.article_principal : null;
				dynamicAnecdotesSecretes = !isMissingOrPlaceholderArray(lesson.anecdotes_secretes) ? lesson.anecdotes_secretes : null;
				
				// 2. Handle Description Fetch
				if (dynamicArticlePrincipal === null && navigator.onLine) {
					isFetchingDescription = true;
					fetch(`/api/artwork-description/${encodeURIComponent(lesson.slug)}`)
						.then((res) => res.json())
						.then((data) => {
							if (data?.article_principal) dynamicArticlePrincipal = data.article_principal;
							if (data?.anecdotes_secretes) dynamicAnecdotesSecretes = data.anecdotes_secretes;
						})
						.catch((err) => console.warn('[DetailPage] Failed to fetch descriptions:', err))
						.finally(() => {
							isFetchingDescription = false;
						});
				}
			}
		});
	});

	async function handleAnswer({
		score,
		isCorrect,
		selectedIndex,
	}: {
		score: number;
		isCorrect: boolean;
		selectedIndex: number;
	}) {
		if (!lesson || answered) return;
		answered = true;

		const isOnline =
			typeof window !== "undefined" ? navigator.onLine : true;
		const userId = "anonymous-user-001";
		const nowStr = new Date().toISOString();

		const currentLevel = progress?.box_level ?? 1;
		const newBoxLevel = isCorrect ? Math.min(5, currentLevel + 1) : 1;
		const consecutive = isCorrect
			? (progress?.consecutive_correct ?? 0) + 1
			: 0;

		const answerPayload = {
			user_id: userId,
			id_oeuvre: lesson.id,
			id_courant: lesson.id_courant,
			is_correct: isCorrect,
			reponse_choisie: selectedIndex,
			score,
			encounter_type: "CATALOG" as const,
			answered_at: nowStr,
			box_level: newBoxLevel,
			consecutive_correct: consecutive,
		};

		if (isOnline) {
			try {
				await Promise.all([
					(supabase.from("historique_reponses") as any).insert({
						user_id: userId,
						id_oeuvre: lesson.id,
						id_courant: lesson.id_courant,
						is_correct: isCorrect,
						reponse_choisie: selectedIndex,
						score,
						encounter_type: "CATALOG",
						answered_at: nowStr,
					}),
					(supabase.from("user_artwork_progress") as any).upsert(
						{
							user_id: userId,
							id_oeuvre: lesson.id,
							box_level: newBoxLevel,
							consecutive_correct: consecutive,
							last_score: score,
							updated_at: nowStr,
						},
						{ onConflict: "user_id, id_oeuvre" },
					),
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
		<a href="/catalogue" class="back-link">
			<ArrowLeft size={18} weight="bold" />
			<span>Retour au catalogue</span>
		</a>
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
			article={dynamicArticlePrincipal || lesson.article_principal}
			isEmpty={isContentEmpty}
		/>
	</section>



	{#if !isContentEmpty}
		{#if (dynamicAnecdotesSecretes && dynamicAnecdotesSecretes.length > 0) || (lesson.anecdotes_secretes && lesson.anecdotes_secretes.length > 0)}
			<section class="deep-dive-section" style:--movement-color={lesson.oklch_token}>
				<div class="secret-heading">
					<Lightbulb size={20} weight="fill" />
					<span>Le savais-tu ?</span>
				</div>
				<ul class="secret-list">
					{#each (dynamicAnecdotesSecretes || lesson.anecdotes_secretes) as anecdote}
						<li class="secret-text">{@html parseMarkdown(anecdote)}</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="quiz-toggle-section">
			{#if !showQuiz}
				<button
					type="button"
					class="test-knowledge-btn"
					onclick={() => (showQuiz = true)}
				>
					<Brain size={22} weight="fill" />
					<span>Testez vos connaissances sur cette œuvre →</span>
				</button>
			{:else}
				<div class="quiz-container">
					<div class="quiz-top">
						<h3>Test de connaissances à la demande</h3>
						<button
							type="button"
							class="close-quiz-btn"
							onclick={() => (showQuiz = false)}
						>
							<span>Fermer le quiz</span>
							<X size={16} weight="bold" />
						</button>
					</div>
					<QuickMCQ
						qcm={lesson.qcm}
						disabled={answered}
						onAnswer={handleAnswer}
					/>
				</div>
			{/if}
		</section>
	{/if}
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
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
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
		gap: 1rem;
		background: var(--color-surface);
		padding: 1.75rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		border-left: 4px solid var(--movement-color, var(--color-accent));
		box-shadow: var(--shadow-sm);
	}

	.secret-heading {
		display: flex;
		align-items: center;
		gap: 0.45rem;
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

	:global(.secret-text strong) {
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.secret-list {
		margin: 0;
		padding-left: 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.secret-list li {
		padding-left: 0.2rem;
	}

	.quiz-toggle-section {
		text-align: center;
	}

	.test-knowledge-btn {
		width: 100%;
		max-width: 500px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		padding: 1rem 1.5rem;
		font-size: 1.05rem;
		font-weight: 700;
		border-radius: var(--radius-lg);
		background: var(--color-primary);
		color: oklch(0.99 0 0);
		box-shadow: var(--shadow-md);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
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
		display: flex;
		align-items: center;
		gap: 0.35rem;
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

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}


</style>
