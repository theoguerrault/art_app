<script lang="ts">
	let { boxDistribution }: { boxDistribution: Record<number, number> } = $props();
</script>

<section class="leitner-section">
	<h2 class="section-title">Distribution Leitner (5 boîtes)</h2>
	<div class="leitner-grid">
		{#each [1, 2, 3, 4, 5] as box (box)}
			<div class="leitner-box" class:mastered={box === 5}>
				<span class="box-number">Boîte {box}</span>
				<span class="box-count">{boxDistribution[box] || 0}</span>
				<span class="box-interval">
					{#if box === 1}Révision Quot.
					{:else if box === 2}+3 Jours
					{:else if box === 3}+7 Jours
					{:else if box === 4}+14 Jours
					{:else}+30 Jours (Maîtrisé){/if}
				</span>
			</div>
		{/each}
	</div>
</section>

<style>
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
</style>
