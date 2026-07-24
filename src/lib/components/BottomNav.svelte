<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { PaintBrush, Books, Gear, ShieldStar } from 'phosphor-svelte';

	interface TabItem {
		href: string;
		label: string;
		icon: any;
	}

	const tabs: TabItem[] = [
		{ href: '/', label: 'Aujourd\'hui', icon: PaintBrush },
		{ href: '/catalogue', label: 'Catalogue', icon: Books },
		{ href: '/admin/oeuvres', label: 'Admin', icon: ShieldStar },
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
		if (currentPath === href) {
			event.preventDefault();
			return;
		}

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

	let keyboardOpen = $state(false);

	$effect(() => {
		const handleFocusIn = (e: FocusEvent) => {
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
				keyboardOpen = true;
			}
		};

		const handleFocusOut = () => {
			keyboardOpen = false;
		};

		document.addEventListener('focusin', handleFocusIn);
		document.addEventListener('focusout', handleFocusOut);

		return () => {
			document.removeEventListener('focusin', handleFocusIn);
			document.removeEventListener('focusout', handleFocusOut);
		};
	});
</script>

<!-- SVG filter for the liquid glass refraction distortion effect -->
<svg class="liquid-glass-filters" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<filter id="liquid-glass-distort" x="-10%" y="-50%" width="120%" height="200%">
			<feTurbulence
				type="fractalNoise"
				baseFrequency="0.018 0.025"
				numOctaves="3"
				seed="7"
				result="noise"
			/>
			<feDisplacementMap
				in="SourceGraphic"
				in2="noise"
				scale="3"
				xChannelSelector="R"
				yChannelSelector="G"
				result="distorted"
			/>
			<feComposite in="distorted" in2="SourceGraphic" operator="in" />
		</filter>
	</defs>
</svg>

<nav class="bottom-nav" class:keyboard-open={keyboardOpen} aria-label="Navigation principale">
	<!-- Specular highlight rim (top edge) -->
	<div class="glass-rim" aria-hidden="true"></div>

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
					<!-- Active background pill -->
					{#if active}
						<span class="active-pill" aria-hidden="true"></span>
					{/if}

					<span class="nav-icon" aria-hidden="true">
						<IconComponent size={24} weight={active ? 'fill' : 'regular'} />
					</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	/* ── Hidden SVG filter ── */
	.liquid-glass-filters {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
		pointer-events: none;
	}

	/* ══════════════════════════════════════════════════════════════════
	   LIQUID GLASS NAV CONTAINER
	   ══════════════════════════════════════════════════════════════════ */
	.bottom-nav {
		position: fixed;
		bottom: calc(var(--safe-area-bottom, 0px) + 0.6rem);
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 3rem);
		max-width: var(--container-max-width, 450px);
		padding: 0.35rem 0.5rem;
		border-radius: 2.5rem;
		z-index: 1000;
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;

		/* ── Liquid glass background (Gris anthracite) ── */
		background: rgba(18, 18, 20, 0.75);
		backdrop-filter: blur(28px) saturate(1.8);
		-webkit-backdrop-filter: blur(28px) saturate(1.8);

		/* ── Layered border: bright top + subtle shadow ── */
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-top: 1px solid rgba(255, 255, 255, 0.25);

		/* ── Depth shadow ── */
		box-shadow:
			0 12px 36px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);

		display: flex;
		align-items: center;
		justify-content: center;

		/* Liquid glass refraction — applied on the element itself */
		filter: url(#liquid-glass-distort);

		/* Prevent the filter from bleeding on content below */
		isolation: isolate;
	}

	.bottom-nav.keyboard-open {
		transform: translate(-50%, 150%);
		opacity: 0;
		pointer-events: none;
	}

	/* ── Top specular highlight rim ── */
	.glass-rim {
		position: absolute;
		top: 0;
		left: 10%;
		right: 10%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.2) 30%,
			rgba(255, 255, 255, 0.4) 50%,
			rgba(255, 255, 255, 0.2) 70%,
			transparent 100%
		);
		pointer-events: none;
		border-radius: 100%;
	}

	/* ══════════════════════════════════════════════════════════════════
	   NAV LIST & ITEMS
	   ══════════════════════════════════════════════════════════════════ */
	.nav-list {
		display: flex;
		width: 100%;
		list-style: none;
		margin: 0;
		padding: 0;
		justify-content: space-around;
		align-items: center;
	}

	.nav-item {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	/* ══════════════════════════════════════════════════════════════════
	   NAV LINK
	   ══════════════════════════════════════════════════════════════════ */
	.nav-link {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		max-width: 4.5rem;
		min-height: 44px;
		min-width: 44px;
		padding: 0.5rem;
		border-radius: 2rem;
		text-decoration: none;
		color: #FFFFFF;
		transition:
			color 0.2s ease,
			transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
		/* Remove individual distortion so only the container is distorted */
		filter: none;
	}

	.nav-link:hover {
		color: #FFFFFF;
		transform: translateY(-1px);
	}

	.nav-link:focus-visible {
		outline: 2px solid rgba(255, 255, 255, 0.5);
		outline-offset: 2px;
	}

	/* Active state */
	.nav-link.active {
		color: oklch(1 0 0 / 1);
		font-weight: 600;
	}

	/* ── Active pill (glass button inset) ── */
	.active-pill {
		position: absolute;
		inset: 0;
		border-radius: 2rem;
		background: rgba(255, 255, 255, 0.25);
		border: 0.5px solid rgba(255, 255, 255, 0.3);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.3),
			inset 0 -1px 0 rgba(0, 0, 0, 0.1),
			0 2px 8px rgba(0, 0, 0, 0.25);
		backdrop-filter: blur(8px) brightness(1.15);
		-webkit-backdrop-filter: blur(8px) brightness(1.15);
		animation: pill-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
		pointer-events: none;
	}

	@keyframes pill-pop {
		from {
			transform: scale(0.7);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* ── Icon ── */
	.nav-icon {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
		z-index: 1;
	}

	.nav-link.active .nav-icon {
		transform: scale(1.12) translateY(-1px);
	}
</style>
