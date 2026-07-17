<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { onNavigate } from '$app/navigation';

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
	<link rel="icon" href={favicon} />
	<title>AI Art Coach</title>
</svelte:head>

<main class="app-shell-main">
	{@render children()}
</main>

<BottomNav />
