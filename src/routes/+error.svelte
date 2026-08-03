<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="error-container">
	<h1>Error {page.status}</h1>
	<p>{page.error?.message ?? 'An unknown error occurred.'}</p>
	<a href="/" data-sveltekit-prefetch data-sveltekit-preload-data="hover">Return to home</a>
</div>

<style>
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		text-align: center;
		padding: 2rem;
	}
	h1 {
		font-size: 2rem;
		margin-bottom: 1rem;
		color: var(--color-error, #d32f2f);
	}
	p {
		margin-bottom: 2rem;
		color: var(--color-text-secondary, #666);
	}
	a {
		color: var(--color-primary, #1976d2);
		text-decoration: none;
		font-weight: 600;
	}
	a:hover {
		text-decoration: underline;
	}
</style>