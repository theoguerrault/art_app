<script lang="ts">
	import '../app.css';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import SplashScreen from '$lib/components/SplashScreen.svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
	import { onNavigate } from '$app/navigation';

	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	let { children }: { children: Snippet } = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<title>Artichaut</title>
</svelte:head>

<main class={page.url.pathname.startsWith('/admin') ? 'app-shell-admin' : 'app-shell-main'}>
	{@render children()}
</main>

<OfflineBanner />
<ToastContainer />

{#if page.url.pathname !== '/auth'}
	<BottomNav />
{/if}

<SplashScreen />
