<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		itemCount: number;
		rootMargin?: string;
		children: any;
	}

	let { itemCount, rootMargin = '200px', children }: Props = $props();

	let sectionEl: HTMLElement;
	let isVisible = $state(false);
	let observer: IntersectionObserver;

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					isVisible = true;
					observer.disconnect();
				}
			},
			{ rootMargin }
		);
		observer.observe(sectionEl);
	});

	onDestroy(() => {
		observer?.disconnect();
	});
</script>

<div bind:this={sectionEl} class="lazy-section-wrapper">
	{#if isVisible}
		{@render children()}
	{:else}
		<div class="skeleton-grid">
			{#each { length: Math.min(itemCount, 12) } as _}
				<div class="skeleton-card">
					<div class="skeleton-thumb"></div>
					<div class="skeleton-line long"></div>
					<div class="skeleton-line short"></div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.lazy-section-wrapper {
		min-height: 1px;
	}

	.skeleton-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1rem 0.85rem;
	}

	.skeleton-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.skeleton-thumb {
		width: 100%;
		aspect-ratio: 1 / 1;
		border-radius: 12px;
		background: linear-gradient(
			90deg,
			var(--color-border-subtle) 25%,
			var(--color-surface) 50%,
			var(--color-border-subtle) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-line {
		height: 0.75rem;
		border-radius: 4px;
		background: linear-gradient(
			90deg,
			var(--color-border-subtle) 25%,
			var(--color-surface) 50%,
			var(--color-border-subtle) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-line.long {
		width: 85%;
	}

	.skeleton-line.short {
		width: 55%;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
</style>
