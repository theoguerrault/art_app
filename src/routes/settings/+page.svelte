<script lang="ts">
	import { themeStore, type ThemeMode } from '$lib/core/theme.svelte';
	import { Sun, Moon, Check, Sparkle, Target, Database, CloudCheck, Trash } from 'phosphor-svelte';
	import { saveToLocalCache } from '$lib/offline/storage';

	let dailyGoal = $state<number>(1);
	let cacheCleared = $state<boolean>(false);
	let isOnline = $state<boolean>(typeof window !== 'undefined' ? navigator.onLine : true);

	$effect(() => {
		document.documentElement.style.setProperty('--artwork-hue', '45');
		if (typeof window !== 'undefined') {
			const savedGoal = localStorage.getItem('daily_goal');
			if (savedGoal) {
				dailyGoal = parseInt(savedGoal, 10) || 1;
			}
			const handleOnline = () => (isOnline = true);
			const handleOffline = () => (isOnline = false);
			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);
			return () => {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
			};
		}
	});

	function handleThemeChange(mode: ThemeMode) {
		themeStore.set(mode);
	}

	function handleGoalChange(goal: number) {
		dailyGoal = goal;
		if (typeof window !== 'undefined') {
			localStorage.setItem('daily_goal', goal.toString());
		}
	}

	async function handleClearCache() {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('user_progress_cache');
			await saveToLocalCache('user_progress_cache', []);
			cacheCleared = true;
			setTimeout(() => {
				cacheCleared = false;
			}, 3000);
		}
	}
</script>

<svelte:head>
	<title>Paramètres • Coach Art IA</title>
</svelte:head>

<div class="settings-container">
	<header class="settings-header">
		<div class="header-badge">
			<Sparkle size={16} weight="fill" />
			<span>Préférences & Contrôle</span>
		</div>
		<h1 class="page-title">Paramètres</h1>
		<p class="page-subtitle">
			Personnalisez votre environnement d'apprentissage, la présentation visuelle et le comportement de synchronisation hors ligne.
		</p>
	</header>

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
				onclick={() => handleThemeChange('light')}
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
				onclick={() => handleThemeChange('dark')}
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

	<section class="settings-section" aria-labelledby="goal-title">
		<div class="section-header">
			<div class="title-with-icon">
				<Target size={22} weight="bold" />
				<h2 id="goal-title" class="section-title">Objectif d'Étude Quotidien</h2>
			</div>
			<p class="section-desc">Ajustez votre cadence de répétition espacée Leitner.</p>
		</div>

		<div class="goal-selector">
			<button
				type="button"
				class="goal-btn"
				class:selected={dailyGoal === 1}
				onclick={() => handleGoalChange(1)}
			>
				<span class="goal-num">1</span>
				<div class="goal-text">
					<strong>Apprentissage Rapide</strong>
					<span>1 œuvre / jour (5 min)</span>
				</div>
			</button>
			<button
				type="button"
				class="goal-btn"
				class:selected={dailyGoal === 3}
				onclick={() => handleGoalChange(3)}
			>
				<span class="goal-num">3</span>
				<div class="goal-text">
					<strong>Immersion Profonde</strong>
					<span>3 œuvres / jour (15 min)</span>
				</div>
			</button>
		</div>
	</section>

	<section class="settings-section" aria-labelledby="storage-title">
		<div class="section-header">
			<div class="title-with-icon">
				<Database size={22} weight="bold" />
				<h2 id="storage-title" class="section-title">Cache Hors Ligne & Sync</h2>
			</div>
			<p class="section-desc">Gérez le stockage IndexedDB local et les données de secours hors ligne.</p>
		</div>

		<div class="storage-card">
			<div class="status-row">
				<div class="status-indicator">
					<CloudCheck size={24} weight="fill" class={isOnline ? 'icon-online' : 'icon-offline'} />
					<div>
						<span class="status-title">Statut de Connexion</span>
						<span class="status-val">{isOnline ? 'Connecté à la base de données' : 'Cache hors ligne actif'}</span>
					</div>
				</div>
				<span class="status-dot" class:online={isOnline}></span>
			</div>

			<div class="action-row">
				<div class="action-info">
					<strong>Cache de Répétition Espacée Local</strong>
					<span>Effacer le cache supprime les réponses enregistrées hors ligne.</span>
				</div>
				<button type="button" class="btn-clear" onclick={handleClearCache} disabled={cacheCleared}>
					<Trash size={18} />
					<span>{cacheCleared ? 'Cache Effacé !' : 'Effacer le Cache'}</span>
				</button>
			</div>
		</div>
	</section>

	<footer class="settings-footer">
		<p>Coach Art IA • Version 1.0.0 (Client PWA)</p>
		<p class="footer-sub">Optimisé avec les couleurs perceptuelles OKLCH & les Runes Svelte 5.</p>
	</footer>
</div>

<style>
	.settings-container {
		width: 100%;
		max-width: var(--container-max-width);
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.settings-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 1.5rem;
	}

	.header-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		background: var(--color-primary-light);
		color: var(--color-primary);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		width: fit-content;
	}

	.page-title {
		font-size: 2.75rem;
		font-weight: 400;
		line-height: 1.1;
		color: var(--color-text-primary);
	}

	.page-subtitle {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		max-width: 36rem;
		line-height: 1.5;
	}

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

	.title-with-icon {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-primary);
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
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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

	/* Daily Study Target Selector */
	.goal-selector {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1rem;
	}

	@media (min-width: 520px) {
		.goal-selector {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.goal-btn {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem;
		text-align: left;
		transition: all 0.2s ease;
	}

	.goal-btn:hover {
		background: var(--color-surface-hover);
		border-color: oklch(from var(--color-border) l c h / 0.3);
	}

	.goal-btn.selected {
		border: 2px solid var(--color-primary);
		background: var(--color-primary-light);
	}

	.goal-num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: var(--color-surface-elevated);
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--color-primary);
		border: 1px solid var(--color-border);
	}

	.goal-btn.selected .goal-num {
		background: var(--color-primary);
		color: oklch(1 0 0);
	}

	.goal-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.goal-text strong {
		font-size: 0.95rem;
		color: var(--color-text-primary);
	}

	.goal-text span {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
	}

	/* Storage Card */
	.storage-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--color-border);
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.status-indicator div {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.status-title {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--color-text-primary);
	}

	.status-val {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
	}

	.status-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--color-error);
	}

	.status-dot.online {
		background: var(--color-success);
	}

	.action-row {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: flex-start;
	}

	@media (min-width: 600px) {
		.action-row {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.action-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.action-info strong {
		font-size: 0.9rem;
		color: var(--color-text-primary);
	}

	.action-info span {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
	}

	.btn-clear {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.1rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-elevated);
		color: var(--color-error);
		font-size: 0.85rem;
		font-weight: 600;
		transition: all 0.15s ease;
		cursor: pointer;
	}

	.btn-clear:hover:not(:disabled) {
		background: var(--color-error-bg);
		border-color: var(--color-error);
	}

	.btn-clear:disabled {
		opacity: 0.7;
		cursor: default;
		color: var(--color-success);
	}

	/* Footer */
	.settings-footer {
		margin-top: 1rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border-subtle);
		text-align: center;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.footer-sub {
		font-size: 0.75rem;
	}
</style>
