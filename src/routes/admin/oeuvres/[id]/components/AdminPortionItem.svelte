<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { parseMarkdown } from '$lib/utils/markdown';
	import { html } from '$lib/actions/html';
	import Button from '$lib/components/ui/Button.svelte';
	import { apiClient } from '$lib/utils/api';

	let {
		portion,
		index,
		typeLabel,
		oeuvre,
		checking
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		portion: any;
		index: number;
		typeLabel: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		oeuvre: any;
		checking: boolean;
	} = $props();

	let isDeleting = $state(false);
	let isValidating = $state(false);
	let isCorrecting = $state(false);
	let isVerifying = $state(false);
	let isUnvalidating = $state(false);

	let isEditing = $state(false);
	let editTitle = $state(portion.title || '');
	let editText = $state(portion.text || '');
	let isSaving = $state(false);

	async function doAction(endpoint: string, stateSetter: (val: boolean) => void, errorMsg: string) {
		stateSetter(true);
		try {
			const res = await apiClient.post(`/api/admin/artworks/${oeuvre.id}/${endpoint}`, { portionId: portion.id });
			if (res.ok) await invalidateAll();
			else alert(errorMsg);
		} finally {
			stateSetter(false);
		}
	}

	function deletePortion() {
		if (confirm('Supprimer définitivement ce paragraphe ?')) {
			doAction('delete-portion', v => isDeleting = v, 'Erreur lors de la suppression');
		}
	}

	function factcheckPortion() { doAction('factcheck-portion', v => isVerifying = v, "Erreur lors de la vérification de la partie"); }
	function unvalidatePortion() { doAction('unvalidate-portion', v => isUnvalidating = v, "Erreur lors de l'invalidation de la partie"); }
	function validatePortion() { doAction('validate-portion', v => isValidating = v, "Erreur lors de la validation de la partie"); }

	async function correctManual() {
		isCorrecting = true;
		try {
			const res = await apiClient.post(`/api/admin/artworks/${oeuvre.id}/correct`, { portionId: portion.id });
			if (res.ok) {
				const json = await res.json();
				if (isEditing && json.content) {
					const updatedPortions = json.content.article_portions || [];
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const updatedPortion = updatedPortions.find((p: any) => p.id === portion.id);
					if (updatedPortion) {
						editText = updatedPortion.text;
						editTitle = updatedPortion.title || '';
					}
				}
				await invalidateAll();
			} else {
				alert('Erreur lors de la correction');
			}
		} finally {
			isCorrecting = false;
		}
	}

	async function saveEditPortion() {
		if (!editText.trim()) return;
		isSaving = true;
		try {
			const res = await apiClient.post(`/api/admin/artworks/${oeuvre.id}/edit-portion`, {
				portionId: portion.id,
				title: editTitle,
				text: editText
			});
			if (res.ok) {
				await invalidateAll();
				isEditing = false;
			} else {
				alert('Erreur lors de la modification');
			}
		} finally {
			isSaving = false;
		}
	}

	function handleCancelEdit() {
		isEditing = false;
	}

	function handleStartEdit() {
		isEditing = true;
		editTitle = portion.title || '';
		editText = portion.text;
	}
</script>

<div class="statement-card {portion.status.toLowerCase()}">
	<div class="statement-header">
		<span class="portion-index">{typeLabel} {index + 1}</span>
		<span class="status-pill {portion.status.toLowerCase()}">{portion.status}</span>
	</div>
	
	{#if isEditing}
		{#if typeLabel === 'Partie'}
			<input type="text" bind:value={editTitle} class="edit-input" placeholder="Titre de la partie (optionnel)" />
		{/if}
		<textarea bind:value={editText} class="edit-textarea" rows="4"></textarea>
		<div class="edit-actions">
			<Button variant="primary" size="sm" onclick={saveEditPortion} loading={isSaving}>Enregistrer</Button>
			<Button variant="outline" size="sm" onclick={correctManual} loading={isCorrecting}>Générer</Button>
			<Button variant="outline" size="sm" onclick={handleCancelEdit}>Annuler</Button>
		</div>
	{:else}
		{#if portion.title && typeLabel === 'Partie'}
			<h4 class="statement-title">{portion.title}</h4>
		{/if}
		<div class="rich-text statement-text" use:html={parseMarkdown(portion.text)}></div>
	{/if}
	
	{#if portion.explanation || portion.source_quote || portion.status?.toUpperCase() !== 'VERIFIED'}
		<div class="statement-feedback">
			{#if portion.explanation}
				<p class="statement-explanation">{portion.explanation}</p>
			{/if}
			
			{#if portion.source_quote}
				<div class="statement-source">
					<span class="source-label">Source Wikipédia</span>
					<p>"{portion.source_quote}"</p>
				</div>
			{/if}

			<div class="statement-actions">
				<Button variant="outline" size="sm" onclick={handleStartEdit}>
					Modifier
				</Button>
				<Button variant="outline" size="sm" onclick={factcheckPortion} loading={isVerifying} disabled={portion.status?.toUpperCase() === 'VERIFIED'}>
					Vérifier
				</Button>

				{#if portion.status?.toUpperCase() === 'VERIFIED'}
					<Button variant="outline" size="sm" onclick={unvalidatePortion} loading={isUnvalidating}>
						Invalider
					</Button>
				{:else}
					{#if portion.status?.toUpperCase() === 'FALSE'}
						<Button variant="danger" size="sm" onclick={correctManual} loading={isCorrecting}>
							Corriger
						</Button>
					{/if}
					<Button variant="outline" size="sm" onclick={validatePortion} loading={isValidating}>
						Valider
					</Button>
				{/if}

				<Button variant="outline" size="sm" onclick={deletePortion} loading={isDeleting}>
					Supprimer
				</Button>
			</div>
		</div>
	{/if}
</div>

<style>
	.edit-textarea, .edit-input {
		width: 100%;
		background-color: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 0.75rem;
		font-family: inherit;
		font-size: 0.9rem;
		resize: vertical;
		margin-bottom: 0.5rem;
	}
	.edit-textarea:focus, .edit-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.statement-card {
		padding: 1.5rem;
		border-radius: 16px;
		background: var(--color-surface);
		border: 1px solid var(--color-border-subtle);
		transition: opacity 0.2s ease, transform 0.2s ease;
		box-shadow: 0 2px 8px rgba(0,0,0,0.01);
	}

	.statement-card.verified { 
		border-color: color-mix(in oklch, var(--color-success) 40%, transparent); 
		background: color-mix(in oklch, var(--color-success) 3%, var(--color-surface)); 
	}
	.statement-card.false { 
		border-color: color-mix(in oklch, var(--color-danger) 40%, transparent); 
		background: color-mix(in oklch, var(--color-danger) 3%, var(--color-surface)); 
	}
	.statement-card.unverified, .statement-card.pending { 
		border-color: color-mix(in oklch, var(--color-warning) 40%, transparent); 
		background: color-mix(in oklch, var(--color-warning) 3%, var(--color-surface)); 
	}

	.statement-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.portion-index {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.status-pill {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 0.25rem 0.65rem;
		border-radius: var(--radius-pill);
	}

	.status-pill.verified { background: color-mix(in oklch, var(--color-success) 15%, transparent); color: var(--color-success); }
	.status-pill.pending { background: color-mix(in oklch, var(--color-text-secondary) 15%, transparent); color: var(--color-text-secondary); }
	.status-pill.pending_validation { background: color-mix(in oklch, var(--color-warning) 15%, transparent); color: var(--color-warning); }
	.status-pill.false { background: color-mix(in oklch, var(--color-danger) 15%, transparent); color: var(--color-danger); }


	.statement-title {
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin: 1rem 0 0.5rem 0;
	}

	.statement-text {
		font-weight: 400;
		font-size: 0.95rem;
		color: var(--color-text-primary);
		line-height: 1.6;
		margin: 0 0 1rem 0;
	}

	.rich-text {
		line-height: 1.6;
		color: var(--color-text-primary);
		font-size: 0.95rem;
		font-family: var(--font-body);
	}
	.rich-text :global(h2), .rich-text :global(h3), .rich-text :global(h4) {
		font-family: var(--font-body);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-primary);
		font-weight: 700;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		font-size: 1.05rem;
	}
	.rich-text :global(p) {
		margin-bottom: 1rem;
	}
	.rich-text :global(strong) {
		color: var(--color-text-primary);
		font-weight: 700;
	}


	.statement-feedback {
		margin-top: 1.25rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--color-border-subtle);
	}

	.statement-explanation {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		margin: 0 0 0.75rem 0;
		line-height: 1.5;
	}

	.statement-source {
		font-size: 0.8rem;
		padding: 1rem;
		background: color-mix(in oklch, var(--color-surface) 50%, transparent);
		border-radius: 12px;
		border: 1px solid var(--color-border-subtle);
		color: var(--color-text-secondary);
		margin-top: 1rem;
	}

	.source-label {
		display: block;
		color: var(--color-text-muted);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
		font-weight: 700;
	}

	.statement-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 1rem;
		flex-wrap: wrap;
	}
</style>
