<script lang="ts">
	import { getCatalogData } from '$lib/features/artwork/logic/catalogCache.svelte';

	let visible = $state(true);
	let fading = $state(false);

	$effect(() => {
		// Pre-warm the catalogue cache silently in the background
		void getCatalogData().catch(() => {});

		// Keep splash active for 1.2s on app launch, then smoothly dissolve
		const timer = setTimeout(() => {
			fading = true;
			setTimeout(() => {
				visible = false;
			}, 400); // Matches CSS transition duration
		}, 1200);

		return () => clearTimeout(timer);
	});
</script>

{#if visible}
	<aside
		class="splash-overlay"
		class:fading
		aria-hidden={!visible}
		role="status"
		aria-live="polite"
		aria-label="Chargement d'Artichaut"
	>
		<!-- Background ambient glow -->
		<div class="splash-glow" aria-hidden="true"></div>

		<div class="splash-content">
			<div class="logo-mark">
				<img src="/icon.png" alt="Artichaut" class="logo-image" width="96" height="96" />
			</div>
		</div>
	</aside>
{/if}

<style>
	.splash-overlay {
		position: fixed;
		inset: 0;
		z-index: 999999;
		background: #121212;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		transition:
			opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
			visibility 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		user-select: none;
		-webkit-user-select: none;
	}

	.splash-overlay.fading {
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
	}

	.splash-glow {
		position: absolute;
		width: 320px;
		height: 320px;
		background: radial-gradient(
			circle,
			color-mix(in srgb, #FA47FF 25%, transparent) 0%,
			color-mix(in srgb, #FFFD82 10%, transparent) 45%,
			transparent 70%
		);
		filter: blur(52px);
		pointer-events: none;
		animation: pulse-glow 2s ease-in-out infinite alternate;
	}

	.splash-content {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: splash-appear 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.logo-mark {
		position: relative;
		width: 96px;
		height: 96px;
		border-radius: 24px;
		overflow: hidden;
		box-shadow:
			0 16px 40px rgba(0, 0, 0, 0.6),
			0 0 32px color-mix(in srgb, #FA47FF 35%, transparent);
	}

	.logo-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	@keyframes splash-appear {
		from {
			opacity: 0;
			transform: scale(0.92);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes pulse-glow {
		from {
			opacity: 0.6;
			transform: scale(0.88);
		}
		to {
			opacity: 1;
			transform: scale(1.12);
		}
	}
</style>
