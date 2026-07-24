<script lang="ts">
	import '../app.css';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import { onNavigate } from '$app/navigation';
	import { themeStore } from '$lib/core/theme.svelte';
	import { authStore } from '$lib/core/auth.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

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

<main class={$page.url.pathname.startsWith('/admin') ? 'app-shell-admin' : 'app-shell-main'}>
	{@render children()}
</main>

<OfflineBanner />

{#if $page.url.pathname !== '/auth'}
	<BottomNav />
{/if}
