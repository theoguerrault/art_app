<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { parseMarkdown } from '$lib/utils/markdown';
	import { html } from '$lib/actions/html';
	import { autosize } from '$lib/actions/autosize';
	import Button from '$lib/components/ui/Button.svelte';
	import { apiClient } from '$lib/utils/api';
	import { toast } from '$lib/utils/toast.svelte';
	import { Sparkle, Check, X, PencilSimple, ArrowClockwise, Trash } from 'phosphor-svelte';

	let {
		portion,
		index,
		typeLabel,
		artwork,
		checking = false
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		portion: any;
		index: number;
		typeLabel: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		artwork: any;
		checking?: boolean;
	} = $props();

	let isDeleting = $state(false);
	let isValidating = $state(false);
	let isCorrecting = $state(false);
	let isVerifying = $state(false);
	let isUnvalidating = $state(false);

	let isEditing = $state(false);
	let editTitle = $state('');
	let editText = $state('');
	let isSaving = $state(false);

	async function doAction(endpoint: string, stateSetter: (val: boolean) => void, successMsg: string, errorMsg: string) {
		stateSetter(true);
		try {
			const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/${endpoint}`, { portionId: portion.id });
			if (res.ok) {
				await invalidateAll();
				toast.success(successMsg);
			} else {
				toast.error(errorMsg);
			}
		} catch {
			toast.error('Erreur réseau');
		} finally {
			stateSetter(false);
		}
	}

	function deletePortion() {
		if (confirm('Supprimer définitivement ce paragraphe ?')) {
			doAction('delete-portion', (v) => (isDeleting = v), 'Paragraphe supprimé', 'Erreur lors de la suppression');
		}
	}

	function factcheckPortion() {
		doAction('factcheck-portion', (v) => (isVerifying = v), 'Vérification terminée', 'Erreur lors de la vérification');
	}
	function unvalidatePortion() {
		doAction('unvalidate-portion', (v) => (isUnvalidating = v), 'Paragraphe invalidé', "Erreur lors de l'invalidation");
	}
	function validatePortion() {
		doAction('validate-portion', (v) => (isValidating = v), 'Paragraphe validé', 'Erreur lors de la validation');
	}

	async function correctManual() {
		isCorrecting = true;
		try {
			const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/correct`, { portionId: portion.id });
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
				toast.success('Paragraphe corrigé par IA');
			} else {
				toast.error('Erreur lors de la correction');
			}
		} catch {
			toast.error('Erreur réseau lors de la correction');
		} finally {
			isCorrecting = false;
		}
	}

	async function saveEditPortion() {
		if (!editText.trim()) return;
		isSaving = true;
		try {
			const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/edit-portion`, {
				portionId: portion.id,
				title: editTitle,
				text: editText
			});
			if (res.ok) {
				await invalidateAll();
				isEditing = false;
				toast.success('Modifications enregistrées');
			} else {
				toast.error('Erreur lors de la modification');
			}
		} catch {
			toast.error('Erreur réseau');
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

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			saveEditPortion();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			handleCancelEdit();
		}
	}
</script>

<div class="statement-card {portion.status?.toLowerCase()}">
	<div class="statement-header">
		<span class="portion-index">{typeLabel} {index + 1}</span>
		<span class="status-pill {portion.status?.toLowerCase()}">{portion.status}</span>
	</div>

	{#if isEditing}
		<div class="edit-box">
			{#if typeLabel === 'Partie'}
				<input
					type="text"
					bind:value={editTitle}
					class="edit-input"
					placeholder="Titre de la partie (optionnel)"
					onkeydown={handleKeydown}
				/>
			{/if}
			<textarea
				bind:value={editText}
				use:autosize
				onkeydown={handleKeydown}
				class="edit-textarea"
				rows="3"
				placeholder="Texte du paragraphe..."
			></textarea>

			<div class="edit-footer">
				<span class="shortcut-hint">
					<kbd>⌘</kbd>+<kbd>Entrée</kbd> pour sauvegarder • <kbd>Échap</kbd> pour annuler
				</span>
				<div class="edit-actions">
					<Button variant="ghost" size="sm" onclick={handleCancelEdit}>Annuler</Button>
					<Button variant="outline" size="sm" onclick={correctManual} loading={isCorrecting}>
						<Sparkle size={14} weight="fill" />
						Corriger par IA
					</Button>
					<Button variant="primary" size="sm" onclick={saveEditPortion} loading={isSaving}>
						<Check size={14} weight="bold" />
						Enregistrer
					</Button>
				</div>
			</div>
		</div>
	{:else}
		{#if portion.title && typeLabel === 'Partie'}
			<h4 class="statement-title">{portion.title}</h4>
		{/if}
		<div class="rich-text statement-text" use:html={parseMarkdown(portion.text)}></div>
	{/if}

	{#if !isEditing}
		{#if portion.explanation || portion.source_quote}
			<div class="statement-feedback">
				{#if portion.explanation}
					<p class="statement-explanation">{portion.explanation}</p>
				{/if}

				{#if portion.source_quote}
					<div class="statement-source">
						<span class="source-label">Extrait Wikipédia</span>
						<p>"{portion.source_quote}"</p>
					</div>
				{/if}
			</div>
		{/if}

		<div class="statement-actions">
			{#if portion.status?.toUpperCase() === 'FALSE'}
				<Button variant="primary" size="sm" onclick={correctManual} loading={isCorrecting}>
					<Sparkle size={14} weight="fill" />
					Corriger par IA
				</Button>
				<Button variant="outline" size="sm" onclick={handleStartEdit}>
					<PencilSimple size={14} weight="bold" />
					Modifier
				</Button>
				<Button variant="outline" size="sm" onclick={factcheckPortion} loading={isVerifying || checking}>
					<ArrowClockwise size={14} weight="bold" />
					Vérifier
				</Button>
				<Button variant="ghost" size="sm" onclick={validatePortion} loading={isValidating}>
					<Check size={14} weight="bold" />
					Valider
				</Button>
			{:else if portion.status?.toUpperCase() === 'VERIFIED'}
				<Button variant="outline" size="sm" onclick={handleStartEdit}>
					<PencilSimple size={14} weight="bold" />
					Modifier
				</Button>
				<Button variant="ghost" size="sm" onclick={unvalidatePortion} loading={isUnvalidating}>
					<X size={14} weight="bold" />
					Invalider
				</Button>
			{:else}
				<Button variant="primary" size="sm" onclick={validatePortion} loading={isValidating}>
					<Check size={14} weight="bold" />
					Valider
				</Button>
				<Button variant="outline" size="sm" onclick={factcheckPortion} loading={isVerifying || checking}>
					<ArrowClockwise size={14} weight="bold" />
					Vérifier
				</Button>
				<Button variant="outline" size="sm" onclick={handleStartEdit}>
					<PencilSimple size={14} weight="bold" />
					Modifier
				</Button>
			{/if}

			<div class="delete-action-wrapper">
				<Button variant="ghost" size="sm" onclick={deletePortion} loading={isDeleting} title="Supprimer ce paragraphe">
					<Trash size={14} weight="bold" />
					Supprimer
				</Button>
			</div>
		</div>
	{/if}
</div>

<style>
	.statement-card {
		padding: 1.25rem 1.5rem;
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border-subtle);
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.statement-card.verified {
		border-color: color-mix(in oklch, var(--color-success) 35%, transparent);
		background: color-mix(in oklch, var(--color-success) 3%, var(--color-surface));
	}
	.statement-card.false {
		border-color: color-mix(in oklch, var(--color-error) 40%, transparent);
		background: color-mix(in oklch, var(--color-error) 4%, var(--color-surface));
	}
	.statement-card.pending,
	.statement-card.pending_validation {
		border-color: color-mix(in oklch, var(--color-warning) 35%, transparent);
		background: color-mix(in oklch, var(--color-warning) 3%, var(--color-surface));
	}

	.statement-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.portion-index {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-pill {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.25rem 0.65rem;
		border-radius: var(--radius-pill);
		border: 1px solid transparent;
	}

	.status-pill.verified {
		background: color-mix(in oklch, var(--color-success) 15%, transparent);
		color: var(--color-success);
		border-color: color-mix(in oklch, var(--color-success) 30%, transparent);
	}
	.status-pill.pending {
		background: color-mix(in oklch, var(--color-text-secondary) 15%, transparent);
		color: var(--color-text-secondary);
		border-color: color-mix(in oklch, var(--color-text-secondary) 30%, transparent);
	}
	.status-pill.pending_validation {
		background: color-mix(in oklch, var(--color-warning) 15%, transparent);
		color: var(--color-warning);
		border-color: color-mix(in oklch, var(--color-warning) 30%, transparent);
	}
	.status-pill.false {
		background: color-mix(in oklch, var(--color-error) 15%, transparent);
		color: var(--color-error);
		border-color: color-mix(in oklch, var(--color-error) 30%, transparent);
	}

	.statement-title {
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin: 0.25rem 0 0.25rem 0;
	}

	.statement-text {
		font-weight: 400;
		font-size: 0.95rem;
		color: var(--color-text-primary);
		line-height: 1.65;
		margin: 0;
	}

	.rich-text {
		line-height: 1.65;
		color: var(--color-text-primary);
		font-size: 0.95rem;
		font-family: var(--font-body);
	}

	.edit-box {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.edit-input {
		width: 100%;
		background-color: var(--color-bg);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0.65rem 0.85rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.edit-textarea {
		width: 100%;
		background-color: var(--color-bg);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0.85rem 1rem;
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.edit-textarea:focus,
	.edit-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.edit-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.25rem;
	}

	.shortcut-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
	.shortcut-hint kbd {
		background: var(--color-surface-hover);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		border: 1px solid var(--color-border-subtle);
		font-size: 0.7rem;
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		margin-left: auto;
	}

	.statement-feedback {
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border-subtle);
	}

	.statement-explanation {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		margin: 0 0 0.5rem 0;
		line-height: 1.5;
	}

	.statement-source {
		font-size: 0.82rem;
		padding: 0.75rem 1rem;
		background: color-mix(in srgb, var(--color-bg) 80%, black);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-subtle);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.source-label {
		display: block;
		color: var(--color-primary);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.35rem;
		font-weight: 700;
		font-style: normal;
	}

	.statement-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.25rem;
		flex-wrap: wrap;
	}

	.delete-action-wrapper {
		margin-left: auto;
	}
</style>
