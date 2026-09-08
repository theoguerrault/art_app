<script lang="ts">
	import { Sparkle } from 'phosphor-svelte';
	import AccountSection from './components/AccountSection.svelte';
	import ThemeSelector from './components/ThemeSelector.svelte';
	import StorageManager from './components/StorageManager.svelte';
	import AdminSection from './components/AdminSection.svelte';

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

	<AccountSection />

	<ThemeSelector />

	<StorageManager {isOnline} />

	<AdminSection />

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
</style>
