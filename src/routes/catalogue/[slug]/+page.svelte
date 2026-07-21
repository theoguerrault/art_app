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

	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	let lesson = $derived(data.lesson);
	let progress = $derived(data.progress);
	let showQuiz = $state(false);
	let answered = $state(false);

	let dynamicAnecdoteAccroche = $state<string | null>(null);
	let dynamicAnecdoteTechnique = $state<string | null>(null);
	let dynamicAnecdoteSecrete = $state<string | null>(null);

	let detailedDescription = $state<{title: string, content: string}[] | null>(null);
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
		];
		return placeholders.some((p) => str.includes(p));
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

				dynamicAnecdoteAccroche = !isMissingOrPlaceholder(lesson.anecdote_accroche) ? lesson.anecdote_accroche : null;
				dynamicAnecdoteTechnique = !isMissingOrPlaceholder(lesson.anecdote_technique) ? lesson.anecdote_technique : null;
				dynamicAnecdoteSecrete = !isMissingOrPlaceholder(lesson.anecdote_secrete) ? lesson.anecdote_secrete : null;
				
				// 2. Handle Detailed Description Fetch
				if (lesson.detailed_description && Array.isArray(lesson.detailed_description) && lesson.detailed_description.length > 0) {
					detailedDescription = lesson.detailed_description;
				} else if (navigator.onLine) {
					detailedDescription = null;
					isFetchingDescription = true;
					fetch(`/api/artwork-description/${encodeURIComponent(lesson.slug)}`)
						.then((res) => res.json())
						.then((data) => {
							if (data?.detailed_description) {
								detailedDescription = data.detailed_description;
							}
						})
						.catch((err) => console.warn('[DetailPage] Failed to fetch detailed description:', err))
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
			anecdote={dynamicAnecdoteAccroche || lesson.anecdote_accroche}
			description={dynamicAnecdoteTechnique || lesson.anecdote_technique}
		/>
	</section>

	{#if detailedDescription || isFetchingDescription}
		<section class="detailed-description-section" style:--movement-color={lesson.oklch_token}>
			<div class="description-header">
				<Article size={22} weight="fill" />
				<h2>Description Détaillée</h2>
			</div>

			{#if isFetchingDescription && !detailedDescription}
				<div class="description-loading">
					<div class="skeleton-block"></div>
					<div class="skeleton-block short"></div>
					<div class="skeleton-block"></div>
					<div class="skeleton-block shorter"></div>
					<span class="loading-hint">
						<span class="spinning-icon"><Eye size={16} /></span>
						Génération de la description détaillée depuis Wikipédia...
					</span>
				</div>
			{:else if detailedDescription}
				<div class="description-body">
					{#each detailedDescription as section}
						{#if section.content && section.content.trim()}
							<h3 class="section-title">{section.title}</h3>
							<p>{section.content}</p>
						{/if}
					{/each}
				</div>
			{/if}
		</section>
	{/if}

	{#if dynamicAnecdoteSecrete || lesson.anecdote_secrete}
		<section class="deep-dive-section">
			<div
				class="secret-block"
				style:--movement-color={lesson.oklch_token}
			>
				<div class="secret-heading">
					<Lightbulb size={20} weight="fill" />
					<span>Anecdote Secrète & Symbolisme</span>
				</div>
				<p class="secret-text">{dynamicAnecdoteSecrete || lesson.anecdote_secrete}</p>
			</div>
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

	.specifications-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		background: var(--color-surface);
		padding: 1.85rem;
		border-radius: var(--radius-xl);
		border: 1.5px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.specs-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--movement-color, var(--color-primary));
		border-bottom: 1px solid var(--color-border-subtle);
		padding-bottom: 1rem;
	}

	.specs-header h2 {
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin: 0;
	}

	.spec-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.15rem;
	}

	.spec-tile {
		display: flex;
		align-items: flex-start;
		gap: 0.9rem;
		padding: 1.15rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		transition:
			transform 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.spec-tile:hover {
		transform: translateY(-2px);
		border-color: var(--movement-color, var(--color-primary));
		box-shadow: var(--shadow-sm);
	}

	.tile-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		background-color: var(--color-surface-elevated);
		color: var(--movement-color, var(--color-primary));
		flex-shrink: 0;
	}

	.tile-content {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.tile-label {
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
	}

	.tile-value {
		font-size: 1.02rem;
		font-weight: 600;
		color: var(--color-text-primary);
		line-height: 1.35;
	}

	.keywords-block {
		margin-top: 0.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--color-border-subtle);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.keywords-heading {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.88rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--movement-color, var(--color-primary));
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.keyword-tag {
		display: inline-block;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.4rem 0.85rem;
		border-radius: 9999px;
		background-color: var(--color-bg);
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		transition:
			background-color 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.keyword-tag:hover {
		background-color: var(--color-surface-elevated);
		border-color: var(--movement-color, var(--color-primary));
		color: var(--color-text-primary);
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

	.secret-block {
		padding: 1.25rem;
		background: var(--color-bg);
		border-left: 4px solid var(--movement-color, var(--color-accent));
		border-radius: var(--radius-md);
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

	.extended-content-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.wiki-loading-bar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 1rem 1.25rem;
		background: var(--color-surface-elevated);
		border-radius: var(--radius-md);
		border: 1px dashed var(--movement-color, var(--color-primary));
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.spinning-icon {
		display: inline-flex;
		animation: spin 1.5s linear infinite;
		color: var(--movement-color, var(--color-primary));
	}

	/* Detailed Description Section */
	.detailed-description-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		background: var(--color-surface);
		padding: 1.85rem;
		border-radius: var(--radius-xl);
		border: 1.5px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		animation: fadeIn 0.35s ease;
	}

	.description-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--movement-color, var(--color-primary));
		border-bottom: 1px solid var(--color-border-subtle);
		padding-bottom: 1rem;
	}

	.description-header h2 {
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin: 0;
	}

	.description-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.description-body p {
		font-size: 0.98rem;
		line-height: 1.7;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.description-body .section-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 1.25rem 0 0.25rem 0;
	}
	
	.description-body .section-title:first-child {
		margin-top: 0;
	}

	.description-body p:first-child {
		font-size: 1.05rem;
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.description-source {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding-top: 0.85rem;
		border-top: 1px solid var(--color-border-subtle);
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
	}

	.description-loading {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.skeleton-block {
		height: 1rem;
		background: linear-gradient(90deg, var(--color-surface-elevated) 25%, var(--color-border-subtle) 50%, var(--color-surface-elevated) 75%);
		background-size: 200% 100%;
		border-radius: var(--radius-sm, 4px);
		animation: shimmer 1.5s infinite ease-in-out;
		width: 100%;
	}

	.skeleton-block.short {
		width: 85%;
	}

	.skeleton-block.shorter {
		width: 60%;
	}

	.loading-hint {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}
</style>
