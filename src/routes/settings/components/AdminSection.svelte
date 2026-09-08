<script lang="ts">
	import { ShieldStar } from 'phosphor-svelte';
</script>

<section class="settings-section" aria-labelledby="admin-title">
	<div class="section-header">
		<h2 id="admin-title" class="section-title">Administration</h2>
		<p class="section-desc">
			Gestion du catalogue d'œuvres, vérification et annotations pédagogiques.
		</p>
	</div>

	<div class="storage-card">
		<div class="action-row">
			<div class="status-indicator">
				<div class="theme-icon admin-icon">
					<ShieldStar size={24} weight="fill" />
				</div>
				<div class="action-info">
					<strong>Gestion du Catalogue</strong>
					<span>Accédez à l'interface d'édition, de modération et de validation.</span>
				</div>
			</div>
			<a
				data-sveltekit-preload-data="hover"
				data-sveltekit-prefetch
				href="/admin/artworks"
				class="cta-admin-btn"
			>
				Accéder à l'Admin →
			</a>
		</div>
	</div>
</section>

<style>
	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.section-header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.section-desc {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.storage-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.action-row {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: flex-start;
	}

	@media (min-width: 600px) {
		.action-row {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.theme-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-md);
		flex-shrink: 0;
	}

	.admin-icon {
		background: color-mix(in srgb, var(--color-accent) 20%, transparent);
		color: var(--color-accent);
		border-radius: var(--radius-md);
	}

	.action-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.action-info strong {
		font-size: 0.9rem;
		color: var(--color-text-primary);
	}

	.action-info span {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
	}

	.cta-admin-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.25rem;
		border-radius: var(--radius-pill);
		font-size: 0.875rem;
		font-weight: 700;
		background: var(--color-surface-elevated);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
		text-decoration: none;
		white-space: nowrap;
		transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
	}

	.cta-admin-btn:hover {
		transform: translateY(-2px);
		border-color: var(--color-primary);
		background: var(--color-surface-hover);
	}
</style>
