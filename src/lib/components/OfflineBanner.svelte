<script lang="ts">
	import { WifiSlash, CloudArrowUp } from 'phosphor-svelte';
	import { flushOfflineQueue } from '$lib/offline/sync';

	let isOnline = $state(typeof window !== 'undefined' ? navigator.onLine : true);
	let isSyncing = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;

		const handleOnline = async () => {
			isOnline = true;
			isSyncing = true;
			await flushOfflineQueue();
			setTimeout(() => {
				isSyncing = false;
			}, 2000);
		};

		const handleOffline = () => {
			isOnline = false;
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});
</script>

{#if !isOnline}
	<div class="offline-banner" role="alert">
		<WifiSlash size={20} weight="bold" />
		<span>Vous êtes hors ligne. L'application continue de fonctionner et sauvegardera vos progrès.</span>
	</div>
{:else}
	<!-- Hidden sync indicator that slides up when reconnected -->
	<div class="sync-banner" class:active={isSyncing} role="status">
		<CloudArrowUp size={20} weight="bold" />
		<span>Connexion rétablie. Synchronisation de vos données...</span>
	</div>
{/if}

<style>
	.offline-banner, .sync-banner {
		position: fixed;
		bottom: calc(var(--bottom-nav-height) + 1rem); /* Above bottom nav */
		left: 50%;
		transform: translateX(-50%) translateY(20px);
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		border-radius: 9999px;
		font-size: 0.85rem;
		font-weight: 600;
		box-shadow: var(--shadow-lg);
		width: max-content;
		max-width: 90vw;
		opacity: 0;
		pointer-events: none;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.offline-banner {
		background: var(--color-error);
		color: white;
		opacity: 1;
		pointer-events: auto;
		transform: translateX(-50%) translateY(0);
		animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.sync-banner {
		background: var(--color-success);
		color: white;
	}

	.sync-banner.active {
		opacity: 1;
		pointer-events: auto;
		transform: translateX(-50%) translateY(0);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
