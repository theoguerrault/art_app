<script lang="ts">
	import type { PageData } from './$types';
	import { Target, Package, ChartLineUp } from 'phosphor-svelte';
	import LeitnerDistribution from './components/LeitnerDistribution.svelte';

	let { data }: { data: PageData } = $props();

	$effect(() => {
		document.documentElement.style.setProperty('--artwork-hue', '220');
	});

	// Calculate box distribution
	function computeBoxDistribution(progressList: { box_level?: number }[]) {
		const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
		for (const p of progressList) {
			const level = Math.max(1, Math.min(5, p.box_level || 1)) as 1 | 2 | 3 | 4 | 5;
			counts[level]++;
		}
		return counts;
	}
	let boxDistribution = $derived(computeBoxDistribution(data.progressList));

	// Mastery by movement
	function computeMovementMastery(
		movements: { id: number; name: string; oklch_token?: string }[],
		progressList: { artwork_id: number; box_level?: number }[],
		artworkToMovement: Record<number, number>
	) {
		return (movements || []).map((m) => {
			// Find progress for this movement
			const itemsInMovement = progressList.filter((p) => {
				return artworkToMovement[p.artwork_id] === m.id;
			});
			const avgBox =
				itemsInMovement.length > 0
					? itemsInMovement.reduce((acc, curr) => acc + (curr.box_level || 1), 0) / itemsInMovement.length
					: 1;
			const percentage = Math.min(100, Math.round(((avgBox - 1) / 4) * 100));
			return {
				id: m.id,
				name: m.name,
				oklch_token: m.oklch_token || 'var(--color-primary)',
				masteryPercentage: percentage,
				avgBox: avgBox.toFixed(1)
			};
		});
	}
	let movementMastery = $derived(computeMovementMastery(data.movements, data.progressList, data.artworkToMovement));
</script>

<div class="progress-view">
	<header class="progress-header">
		<h1 class="page-title">Progression de l'apprentissage</h1>
		<p class="page-subtitle">Suivez la rétention de votre mémoire à long terme à travers le système Leitner à 5 boîtes.</p>
	</header>

	{#if data.progressList.length > 0}
		<section class="overview-cards">
			<div class="stat-card">
				<span class="stat-icon"><Package size={38} weight="fill" /></span>
				<div class="stat-content">
					<span class="stat-value">{boxDistribution[5]}</span>
					<span class="stat-label">Concepts Maîtrisés (Boîte 5)</span>
				</div>
			</div>
		</section>

		<LeitnerDistribution boxDistribution={boxDistribution as Record<number, number>} />

		<section class="movements-section">
			<h2 class="section-title">Maîtrise par Mouvement Artistique</h2>
			<div class="movements-list">
				{#each movementMastery as m, i (i)}
					<div class="movement-bar-item">
						<div class="bar-top">
							<span class="movement-name">{m.name}</span>
							<span class="movement-percent">{m.masteryPercentage}% Maîtrise (Boîte Moy. {m.avgBox})</span>
						</div>
						<div class="progress-track">
							<div
								class="progress-fill"
								style:width="{m.masteryPercentage}%"
								style:background-color={m.oklch_token}
							></div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{:else}
		<div class="empty-state">
			<span class="empty-icon"><ChartLineUp size={56} weight="fill" /></span>
			<h3>Aucune donnée d'apprentissage</h3>
			<p>Vous n'avez pas encore effectué de révisions quotidiennes ou de quiz du catalogue. Commencez à explorer pour développer votre maîtrise Leitner !</p>
			<div class="cta-actions">
				<a data-sveltekit-preload-data="hover" href="/" data-sveltekit-prefetch class="cta-btn primary">Essayer la révision du jour</a>
				<a data-sveltekit-preload-data="hover" href="/catalogue" data-sveltekit-prefetch class="cta-btn secondary">Explorer le catalogue</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.progress-view {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		padding-bottom: 3rem;
	}

	.progress-header {
		text-align: center;
		margin-top: 0.5rem;
	}

	.page-title {
		font-size: 2.1rem;
		font-weight: 800;
		color: var(--color-text-primary);
	}

	.page-subtitle {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		margin: 0.35rem auto 0;
	}

	.overview-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.25rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		color: var(--color-primary);
	}

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 1.85rem;
		font-weight: 800;
		color: var(--color-text-primary);
	}

	.stat-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.section-title {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin-bottom: 1rem;
	}

	.movements-section {
		background: var(--color-surface);
		padding: 1.75rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.movements-list {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.movement-bar-item {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.bar-top {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.movement-percent {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		font-weight: 600;
	}

	.progress-track {
		width: 100%;
		height: 10px;
		background: var(--color-border-subtle);
		border-radius: 9999px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 9999px;
		transition: width 0.4s ease;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 1.5rem;
		background: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
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
		max-width: 420px;
		margin: 0 auto 1.75rem;
	}

	.cta-actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.cta-btn {
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-md);
		font-weight: 700;
		text-decoration: none;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.cta-btn.primary {
		background: var(--color-primary);
		color: oklch(0.99 0 0);
	}

	.cta-btn.secondary {
		background: var(--color-bg);
		border: 1.5px solid var(--color-border);
		color: var(--color-text-primary);
	}

	.cta-btn:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
</style>
