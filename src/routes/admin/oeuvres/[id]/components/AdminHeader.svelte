<script lang="ts">
	import { ArrowLeft } from 'phosphor-svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		oeuvre,
		generating,
		checking,
		generateContent
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		oeuvre: any;
		generating: boolean;
		checking: boolean;
		generateContent: () => void;
	} = $props();
</script>

<div class="header-section sticky-header">
	<a data-sveltekit-preload-data="hover" href="/admin/oeuvres" data-sveltekit-prefetch class="back-link">
		<ArrowLeft size={18} weight="bold" />
		Retour
	</a>
	
	<div class="title-row">
		<div class="title-info">
			<h1 class="page-title">{oeuvre.oeuvre_translations?.[0]?.titre || ''}</h1>
			<p class="page-subtitle">{oeuvre.artistes?.artiste_translations?.[0]?.nom}</p>
		</div>
		
		<div class="action-buttons">
			<Button 
				variant="primary" 
				onclick={generateContent} 
				loading={generating || checking}
			>
				{generating ? 'Génération...' : checking ? 'Vérification...' : 'Générer'}
			</Button>
		</div>
	</div>
</div>

<style>
	.sticky-header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: color-mix(in oklch, var(--color-bg) 85%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		padding: 1rem 1.25rem 1.25rem;
		margin: -1rem -1.25rem 0;
		border-bottom: 1px solid var(--color-border-subtle);
	}

	@media (max-width: 600px) {
		.sticky-header {
			padding: 1rem 1.25rem;
		}
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		margin-bottom: 1rem;
		padding: 0.25rem 0;
		transition: color 0.2s ease;
	}

	.back-link:hover {
		color: var(--color-primary);
	}

	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.title-info {
		flex: 1 1 300px;
	}

	.page-title {
		font-family: var(--font-body);
		font-size: 1.6rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-primary);
		margin: 0 0 0.25rem 0;
		line-height: 1.2;
	}

	.page-subtitle {
		font-size: 1rem;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	
	@media (max-width: 600px) {
		.action-buttons {
			width: 100%;
		}
		.action-buttons :global(> *) {
			flex: 1;
		}
	}
</style>
