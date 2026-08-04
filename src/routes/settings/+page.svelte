<script lang="ts">
	import { Sparkle, User } from 'phosphor-svelte';
	import { authStore } from '$lib/core/auth.svelte';
	import ThemeSelector from './components/ThemeSelector.svelte';
	import StorageManager from './components/StorageManager.svelte';

	let isOnline = $state<boolean>(typeof window !== 'undefined' ? navigator.onLine : true);

	$effect(() => {
		document.documentElement.style.setProperty('--artwork-hue', '45');
		if (typeof window !== 'undefined') {
			const handleOnline = () => (isOnline = true);
			const handleOffline = () => (isOnline = false);
			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);
			return () => {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
			};
		}
	});


</script>

<svelte:head>
	<title>Paramètres • Coach Art IA</title>
</svelte:head>

<div class="settings-container">
	<header class="settings-header">
		<div class="header-badge">
			<Sparkle size={16} weight="fill" />
			<span>Préférences & Contrôle</span>
		</div>
		<h1 class="page-title">Paramètres</h1>
		<p class="page-subtitle">
			Personnalisez la présentation visuelle et le comportement de synchronisation hors ligne.
		</p>
	</header>

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
					<div class="theme-icon light-icon user-icon">
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
					<a data-sveltekit-preload-data="hover" href="/auth" data-sveltekit-prefetch class="cta-btn primary cta-auth-btn">
						Créer un compte
					</a>
				{/if}
			</div>
		</div>
	</section>

	<ThemeSelector />

	<StorageManager {isOnline} />

	<footer class="settings-footer">
		<p>Coach Art IA • Version 1.0.0 (Client PWA)</p>
		<p class="footer-sub">Optimisé avec les couleurs perceptuelles OKLCH & les Runes Svelte 5.</p>
	</footer>
</div>

<style>
	.settings-container {
		width: 100%;
		max-width: var(--container-max-width);
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.settings-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 1.5rem;
	}

	.header-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		background: var(--color-primary-light);
		color: var(--color-primary);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		width: fit-content;
	}

	.page-title {
		font-size: 2.75rem;
		font-weight: 400;
		line-height: 1.1;
		color: var(--color-text-primary);
	}

	.page-subtitle {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		max-width: 36rem;
		line-height: 1.5;
	}

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



	/* Footer */
	.settings-footer {
		margin-top: 1rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border-subtle);
		text-align: center;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.footer-sub {
		font-size: 0.75rem;
	}

	.user-icon {
		border-radius: 50%;
		width: 2.5rem;
		height: 2.5rem;
	}

	.cta-auth-btn {
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-md);
		font-weight: 600;
		background: var(--color-primary);
		color: white;
		display: inline-block;
	}
</style>
