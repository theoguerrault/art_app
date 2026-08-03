<script lang="ts">
	import { Database, CloudCheck, Trash } from 'phosphor-svelte';
	import { saveToLocalCache } from '$lib/offline/storage';

	let { isOnline = true } = $props<{ isOnline: boolean }>();
	let cacheCleared = $state<boolean>(false);

	async function handleClearCache() {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('user_progress_cache');
			await saveToLocalCache('user_progress_cache', []);
			cacheCleared = true;
			setTimeout(() => {
				cacheCleared = false;
			}, 3000);
		}
	}
</script>

<section class="settings-section" aria-labelledby="storage-title">
	<div class="section-header">
		<div class="title-with-icon">
			<Database size={22} weight="bold" />
			<h2 id="storage-title" class="section-title">Cache Hors Ligne & Sync</h2>
		</div>
		<p class="section-desc">Gérez le stockage IndexedDB local et les données de synchronisation hors ligne.</p>
	</div>

	<div class="storage-card">
		<div class="status-row">
			<div class="status-indicator">
				<CloudCheck size={24} weight="fill" class={isOnline ? 'icon-online' : 'icon-offline'} />
				<div>
					<span class="status-title">Statut de Connexion</span>
					<span class="status-val">{isOnline ? 'Connecté à la base de données' : 'Cache hors ligne actif'}</span>
				</div>
			</div>
			<span class="status-dot" class:online={isOnline}></span>
		</div>

		<div class="action-row">
			<div class="action-info">
				<strong>Cache Local</strong>
				<span>Effacer le cache supprime les données enregistrées hors ligne.</span>
			</div>
			<button type="button" class="btn-clear" onclick={handleClearCache} disabled={cacheCleared}>
				<Trash size={18} />
				<span>{cacheCleared ? 'Cache Effacé !' : 'Effacer le Cache'}</span>
			</button>
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

	.title-with-icon {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-primary);
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

	/* Storage Card */
	.storage-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--color-border);
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.status-indicator div {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.status-title {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--color-text-primary);
	}

	.status-val {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
	}

	.status-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--color-error);
	}

	.status-dot.online {
		background: var(--color-success);
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

	.btn-clear {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.1rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-elevated);
		color: var(--color-error);
		font-size: 0.85rem;
		font-weight: 600;
		transition: opacity 0.15s ease, transform 0.15s ease;
		cursor: pointer;
	}

	.btn-clear:hover:not(:disabled) {
		background: var(--color-error-bg);
		border-color: var(--color-error);
	}

	.btn-clear:disabled {
		opacity: 0.7;
		cursor: default;
		color: var(--color-success);
	}
</style>
