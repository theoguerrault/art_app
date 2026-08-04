<script lang="ts">
	import '../app.css';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import { onNavigate } from '$app/navigation';

	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	let props = $props() as { children: Snippet };

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
	{@render props.children()}
</main>

<OfflineBanner />

{#if page.url.pathname !== '/auth'}
	<BottomNav />
{/if}
