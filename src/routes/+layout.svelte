<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>AI Art Coach</title>
</svelte:head>

<main class="app-shell-main">
	{@render children()}
</main>
