<script lang="ts">
	import { themeStore, type ThemeMode } from '$lib/core/theme.svelte';
	import { Sun, Moon, Check } from 'phosphor-svelte';

	function handleThemeChange(mode: ThemeMode) {
		themeStore.set(mode);
	}

	function setThemeLight() {
		handleThemeChange('light');
	}

	function setThemeDark() {
		handleThemeChange('dark');
	}
</script>

<section class="settings-section" aria-labelledby="appearance-title">
	<div class="section-header">
		<h2 id="appearance-title" class="section-title">Apparence</h2>
		<p class="section-desc">
			Sélectionnez votre thème d'interface préféré. Par défaut, l'application s'affiche en mode clair.
		</p>
	</div>

	<div class="theme-switch-grid" role="radiogroup" aria-label="Theme Selection">
		<!-- Light Mode Option -->
		<button
			type="button"
			role="radio"
			aria-checked={themeStore.current === 'light'}
			class="theme-card"
			class:active={themeStore.current === 'light'}
			onclick={setThemeLight}
		>
			<div class="theme-card-header">
				<div class="theme-icon light-icon">
					<Sun size={28} weight={themeStore.current === 'light' ? 'fill' : 'regular'} />
				</div>
				{#if themeStore.current === 'light'}
					<span class="active-badge" aria-label="Thème actif">
						<Check size={16} weight="bold" />
						<span>Actif</span>
					</span>
				{/if}
			</div>
			<div class="theme-card-body">
				<span class="theme-label">Mode Clair</span>
				<span class="theme-desc">Une toile en papier d'albâtre chaud, conçue pour la clarté en journée.</span>
			</div>
			<div class="theme-preview preview-light" aria-hidden="true">
				<div class="preview-line"></div>
				<div class="preview-box"></div>
			</div>
		</button>

		<!-- Dark Mode Option -->
		<button
			type="button"
			role="radio"
			aria-checked={themeStore.current === 'dark'}
			class="theme-card"
			class:active={themeStore.current === 'dark'}
			onclick={setThemeDark}
		>
			<div class="theme-card-header">
				<div class="theme-icon dark-icon">
					<Moon size={28} weight={themeStore.current === 'dark' ? 'fill' : 'regular'} />
				</div>
				{#if themeStore.current === 'dark'}
					<span class="active-badge" aria-label="Thème actif">
						<Check size={16} weight="bold" />
						<span>Actif</span>
					</span>
				{/if}
			</div>
			<div class="theme-card-body">
				<span class="theme-label">Mode Sombre</span>
				<span class="theme-desc">Toile en basalte sombre, optimisée pour la concentration en basse lumière.</span>
			</div>
			<div class="theme-preview preview-dark" aria-hidden="true">
				<div class="preview-line"></div>
				<div class="preview-box"></div>
			</div>
		</button>
	</div>
</section>

<style>
	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.section-header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.section-desc {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	/* Theme Switch Grid */
	.theme-switch-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1.25rem;
	}

	@media (min-width: 560px) {
		.theme-switch-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.theme-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		text-align: left;
		cursor: pointer;
		transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
	}

	.theme-card:hover {
		background: var(--color-surface-hover);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: oklch(from var(--color-border) l c h / 0.3);
	}

	.theme-card.active {
		border: 2px solid var(--color-primary);
		background: var(--color-surface-elevated);
		box-shadow: var(--shadow-lg);
	}

	.theme-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.theme-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: var(--radius-md);
	}

	.light-icon {
		background: oklch(0.95 0.08 85);
		color: oklch(0.55 0.16 75);
	}

	.dark-icon {
		background: oklch(0.25 0.04 260);
		color: oklch(0.85 0.08 260);
	}

	.active-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.25rem 0.65rem;
		background: var(--color-primary);
		color: oklch(1 0 0);
		border-radius: 9999px;
		font-size: 0.725rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.theme-card-body {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.theme-label {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--color-text-primary);
		font-family: var(--font-body);
	}

	.theme-desc {
		font-size: 0.825rem;
		color: var(--color-text-secondary);
		line-height: 1.45;
	}

	/* Theme visual preview */
	.theme-preview {
		margin-top: 0.5rem;
		width: 100%;
		height: 52px;
		border-radius: var(--radius-sm);
		padding: 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		border: 1px solid var(--color-border);
	}

	.preview-light {
		background: oklch(0.985 0.008 45);
	}

	.preview-dark {
		background: oklch(0.12 0.012 45);
	}

	.preview-line {
		height: 6px;
		width: 45%;
		border-radius: 3px;
	}

	.preview-light .preview-line {
		background: oklch(0.35 0.02 45);
	}

	.preview-dark .preview-line {
		background: oklch(0.85 0.01 45);
	}

	.preview-box {
		height: 18px;
		width: 100%;
		border-radius: 4px;
	}

	.preview-light .preview-box {
		background: oklch(0.94 0.015 45);
	}

	.preview-dark .preview-box {
		background: oklch(0.18 0.015 45);
	}
</style>
