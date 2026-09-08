<script lang="ts">
	import { User } from 'phosphor-svelte';
	import { authStore } from '$lib/core/auth.svelte';
</script>

<section class="settings-section" aria-labelledby="account-title">
	<div class="section-header">
		<h2 id="account-title" class="section-title">Mon Compte</h2>
		<p class="section-desc">
			Gérez votre connexion et la sauvegarde de vos données sur le cloud.
		</p>
	</div>

	<div class="storage-card">
		<div class="status-row">
			<div class="status-indicator">
				<div class="theme-icon user-icon">
					<User size={22} weight="fill" />
				</div>
				<div>
					<span class="status-title">
						{#if authStore.user}
							Connecté en tant que {authStore.user.email}
						{:else}
							Mode Anonyme
						{/if}
					</span>
					<span class="status-val">
						{#if authStore.user}
							Vos données sont synchronisées avec le cloud.
						{:else}
							Vos progrès sont sauvegardés uniquement sur cet appareil.
						{/if}
					</span>
				</div>
			</div>
		</div>

		<div class="action-row">
			<div class="action-info">
				<strong>Authentification</strong>
				<span>Rejoignez-nous pour ne jamais perdre votre progression.</span>
			</div>
			{#if authStore.user}
				<button type="button" class="btn-clear" onclick={async () => await authStore.signOut()}>
					<span>Se déconnecter</span>
				</button>
			{:else}
				<a
					data-sveltekit-preload-data="hover"
					data-sveltekit-prefetch
					href="/auth"
					class="cta-auth-btn"
				>
					Créer un compte
				</a>
			{/if}
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

	.status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border-subtle);
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
		border-radius: 50%;
		flex-shrink: 0;
	}

	.user-icon {
		background: var(--color-primary-light);
		color: var(--color-primary);
	}

	.status-title {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--color-text-primary);
		display: block;
	}

	.status-val {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		display: block;
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
		transition: opacity 0.15s ease, transform 0.15s ease, background-color 0.15s ease;
		cursor: pointer;
	}

	.btn-clear:hover {
		background: var(--color-error-bg);
		border-color: var(--color-error);
	}

	.cta-auth-btn {
		text-decoration: none;
		padding: 0.6rem 1.25rem;
		border-radius: var(--radius-pill);
		font-weight: 700;
		font-size: 0.875rem;
		background: var(--color-primary);
		color: #000000;
		display: inline-block;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.cta-auth-btn:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}
</style>
