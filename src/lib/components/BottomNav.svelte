<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { PaintBrush, Books, ChartLineUp, Gear } from 'phosphor-svelte';

	interface TabItem {
		href: string;
		label: string;
		icon: any;
	}

	const tabs: TabItem[] = [
		{ href: '/', label: 'Aujourd\'hui', icon: PaintBrush },
		{ href: '/catalogue', label: 'Catalogue', icon: Books },
		{ href: '/progression', label: 'Progression', icon: ChartLineUp },
		{ href: '/settings', label: 'Paramètres', icon: Gear }
	];

	let currentPath = $derived(page.url?.pathname || '/');

	function isActive(href: string): boolean {
		if (href === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(href);
	}

	async function handleTabClick(event: MouseEvent, href: string) {
		// Prevent reload if already on the active tab
		if (currentPath === href) {
			event.preventDefault();
			return;
		}

		// Use View Transitions API if supported
		if (
			typeof document !== 'undefined' &&
			'startViewTransition' in document &&
			!window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			event.preventDefault();
			document.startViewTransition(async () => {
				await goto(href);
			});
		}
	}
</script>

<nav class="bottom-nav" aria-label="Navigation principale">
	<ul class="nav-list" role="list">
		{#each tabs as tab}
			{@const active = isActive(tab.href)}
			{@const IconComponent = tab.icon}
			<li class="nav-item">
				<a
					href={tab.href}
					class="nav-link"
					class:active
					aria-current={active ? 'page' : undefined}
					onclick={(e) => handleTabClick(e, tab.href)}
				>
					<span class="nav-icon" aria-hidden="true">
						<IconComponent size={24} weight={active ? 'fill' : 'regular'} />
					</span>
					<span class="nav-label">{tab.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: var(--bottom-nav-height);
		padding-bottom: var(--safe-area-bottom);
		background: oklch(from var(--color-surface) l c h / 0.92);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-top: 1px solid var(--color-border);
		box-shadow: 0 -4px 16px oklch(0 0 0 / 0.05);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-list {
		display: flex;
		width: 100%;
		max-width: var(--container-max-width);
		height: 100%;
		list-style: none;
		margin: 0 auto;
		padding: 0 0.5rem;
		justify-content: space-around;
		align-items: center;
	}

	.nav-item {
		flex: 1;
		display: flex;
		justify-content: center;
		height: 100%;
	}

	.nav-link {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		width: 100%;
		max-width: 6rem;
		min-height: 44px;
		min-width: 44px;
		padding: 0.35rem 0.5rem;
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--color-text-secondary);
		transition: color 0.15s ease, background-color 0.15s ease, transform 0.1s ease;
	}

	.nav-link:hover {
		color: var(--color-text-primary);
		background-color: var(--color-surface-hover);
	}

	.nav-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
	}

	.nav-link.active {
		color: var(--color-primary);
		font-weight: 700;
	}

	.nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.35rem;
		line-height: 1;
		transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.nav-link.active .nav-icon {
		transform: scale(1.15);
	}

	.nav-label {
		font-size: 0.725rem;
		letter-spacing: 0.02em;
	}

	:global([data-theme="dark"]) .bottom-nav {
		box-shadow: 0 -4px 16px oklch(0 0 0 / 0.25);
	}

	@media (prefers-color-scheme: dark) {
		:global([data-theme="system"]) .bottom-nav {
			box-shadow: 0 -4px 16px oklch(0 0 0 / 0.25);
		}
	}
</style>
