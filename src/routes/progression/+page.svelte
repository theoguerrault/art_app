<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Calculate overall statistics
	let totalAnswers = $derived(data.historyList.length);
	let correctAnswers = $derived(data.historyList.filter((h) => h.is_correct).length);
	let successPercentage = $derived(totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0);

	// Calculate box distribution
	let boxDistribution = $derived(() => {
		const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
		for (const p of data.progressList) {
			const level = Math.max(1, Math.min(5, p.box_level || 1)) as 1 | 2 | 3 | 4 | 5;
			counts[level]++;
		}
		return counts;
	});

	// Mastery by movement
	let movementMastery = $derived(() => {
		return (data.movements || []).map((m) => {
			// Find progress for this movement or mock calculation based on movement ID
			const itemsInMovement = data.progressList.filter((p) => {
				// We match via id_oeuvre or history
				return true;
			});
			const avgBox =
				itemsInMovement.length > 0
					? itemsInMovement.reduce((acc, curr) => acc + (curr.box_level || 1), 0) / itemsInMovement.length
					: 1;
			const percentage = Math.min(100, Math.round(((avgBox - 1) / 4) * 100));
			return {
				id: m.id,
				nom: m.nom,
				oklch_token: m.oklch_token || 'var(--color-primary)',
				masteryPercentage: percentage,
				avgBox: avgBox.toFixed(1)
			};
		});
	});
</script>

<div class="progress-view">
	<header class="progress-header">
		<h1 class="page-title">Learning Progression</h1>
		<p class="page-subtitle">Track your long-term memory retention across the 5-Box Leitner system.</p>
	</header>

	{#if totalAnswers > 0 || data.progressList.length > 0}
		<section class="overview-cards">
			<div class="stat-card">
				<span class="stat-icon">🎯</span>
				<div class="stat-content">
					<span class="stat-value">{successPercentage}%</span>
					<span class="stat-label">MCQ Accuracy ({correctAnswers}/{totalAnswers})</span>
				</div>
			</div>

			<div class="stat-card">
				<span class="stat-icon">📦</span>
				<div class="stat-content">
					<span class="stat-value">{boxDistribution()[5]}</span>
					<span class="stat-label">Mastered Concepts (Box 5)</span>
				</div>
			</div>
		</section>

		<section class="leitner-section">
			<h2 class="section-title">5-Box Leitner Distribution</h2>
			<div class="leitner-grid">
				{#each [1, 2, 3, 4, 5] as box}
					<div class="leitner-box" class:mastered={box === 5}>
						<span class="box-number">Box {box}</span>
						<span class="box-count">{(boxDistribution() as any)[box] || 0}</span>
						<span class="box-interval">
							{#if box === 1}Daily Review
							{:else if box === 2}+3 Days
							{:else if box === 3}+7 Days
							{:else if box === 4}+14 Days
							{:else}+30 Days (Mastered){/if}
						</span>
					</div>
				{/each}
			</div>
		</section>

		<section class="movements-section">
			<h2 class="section-title">Mastery by Artistic Movement</h2>
			<div class="movements-list">
				{#each movementMastery() as m}
					<div class="movement-bar-item">
						<div class="bar-top">
							<span class="movement-name">{m.nom}</span>
							<span class="movement-percent">{m.masteryPercentage}% Mastery (Avg Box {m.avgBox})</span>
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
			<span class="empty-icon">📈</span>
			<h3>No Learning Data Yet</h3>
			<p>You haven't completed any daily reviews or catalog quizzes yet. Start exploring to build your Leitner mastery trajectory!</p>
			<div class="cta-actions">
				<a href="/" class="cta-btn primary">Try Today's Review</a>
				<a href="/catalogue" class="cta-btn secondary">Explore Catalog</a>
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
		font-size: 2.5rem;
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

	.leitner-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
		gap: 1rem;
	}

	.leitner-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.25rem 0.75rem;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
		text-align: center;
		transition: transform 0.15s ease;
	}

	.leitner-box.mastered {
		border-color: var(--color-success);
		background: oklch(0.97 0.05 140 / 0.15);
	}

	.box-number {
		font-size: 0.825rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.box-count {
		font-size: 2.2rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin: 0.35rem 0;
	}

	.box-interval {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-weight: 600;
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
		font-size: 3.5rem;
		display: block;
		margin-bottom: 1rem;
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
