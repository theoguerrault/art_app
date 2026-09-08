<script lang="ts">
	import { MagnifyingGlass, X, Check } from 'phosphor-svelte';

	interface Movement {
		id: number;
		name: string;
		century?: string;
	}

	let {
		isOpen = false,
		movements = [],
		selectedMovements = $bindable([]),
		toggleMovement,
		onClose,
		onClear
	}: {
		isOpen: boolean;
		movements: Movement[];
		selectedMovements: number[];
		toggleMovement: (id: number) => void;
		onClose: () => void;
		onClear: () => void;
	} = $props();

	let movementSearch = $state('');

	$effect(() => {
		if (isOpen) {
			movementSearch = '';
		}
	});

	function handleModalBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleModalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleItemClick(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const id = Number(target.dataset.id);
		if (!isNaN(id)) {
			toggleMovement(id);
		}
	}

	function computeFilteredMovements(list: Movement[], q: string) {
		const trimmed = q.trim().toLowerCase();
		if (!trimmed) return list;
		return list.filter((m) => m.name.toLowerCase().includes(trimmed));
	}

	let filteredModalMovements = $derived(computeFilteredMovements(movements, movementSearch));
</script>

{#if isOpen}
	<div
		class="modal-backdrop"
		onclick={handleModalBackdropClick}
		onkeydown={handleModalKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="movement-modal-title"
		tabindex="-1"
	>
		<div class="modal-sheet">
			<div class="modal-header">
				<div>
					<h2 id="movement-modal-title" class="modal-title">Mouvements Artistiques</h2>
					<p class="modal-subtitle">Filtrer les œuvres par courant d'art</p>
				</div>
				<button type="button" class="close-btn" onclick={onClose} aria-label="Fermer">
					<X size={20} weight="bold" />
				</button>
			</div>

			<div class="modal-search">
				<MagnifyingGlass size={18} class="search-modal-icon" />
				<input
					type="search"
					placeholder="Filtrer les mouvements..."
					bind:value={movementSearch}
					aria-label="Rechercher un mouvement"
				/>
			</div>

			<div class="movements-grid">
				{#each filteredModalMovements as mov (mov.id)}
					{@const isSelected = selectedMovements.includes(mov.id)}
					<button
						type="button"
						class="movement-card-btn"
						class:selected={isSelected}
						data-id={mov.id}
						onclick={handleItemClick}
					>
						<div class="movement-info">
							<span class="movement-card-name">{mov.name}</span>
							{#if mov.century}
								<span class="movement-card-century">{mov.century}</span>
							{/if}
						</div>
						<div class="checkbox-indicator" class:checked={isSelected}>
							{#if isSelected}
								<Check size={14} weight="bold" />
							{/if}
						</div>
					</button>
				{/each}

				{#if filteredModalMovements.length === 0}
					<p class="empty-movements">Aucun mouvement ne correspond à votre recherche.</p>
				{/if}
			</div>

			<div class="modal-actions">
				{#if selectedMovements.length > 0}
					<button type="button" class="btn-secondary" onclick={onClear}>
						Tout désélectionner
					</button>
				{/if}
				<button type="button" class="btn-primary" onclick={onClose}>
					{selectedMovements.length > 0 ? `Afficher (${selectedMovements.length})` : 'Appliquer'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background-color: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		animation: fadeIn 0.2s ease-out;
	}

	@media (min-width: 640px) {
		.modal-backdrop {
			align-items: center;
			padding: 1.5rem;
		}
	}

	.modal-sheet {
		background: var(--color-surface);
		width: 100%;
		max-width: 540px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		border-radius: 24px 24px 0 0;
		border: 1px solid var(--color-border);
		box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.5);
		padding: 1.5rem;
		gap: 1rem;
		animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@media (min-width: 640px) {
		.modal-sheet {
			border-radius: 24px;
			box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.modal-title {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 0;
		font-family: var(--font-body);
	}

	.modal-subtitle {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		margin: 0.2rem 0 0;
	}

	.close-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border-subtle);
		transition: background-color 0.15s ease, color 0.15s ease;
		flex-shrink: 0;
	}

	.close-btn:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}

	.modal-search {
		position: relative;
		display: flex;
		align-items: center;
	}

	.modal-search input {
		width: 100%;
		padding: 0.7rem 1rem 0.7rem 2.4rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-subtle);
		background: var(--color-surface-elevated);
		color: var(--color-text-primary);
		font-size: 0.9rem;
	}

	.modal-search input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	:global(.search-modal-icon) {
		position: absolute;
		left: 0.75rem;
		color: var(--color-text-muted);
		pointer-events: none;
	}

	.movements-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow-y: auto;
		max-height: 48vh;
		padding-right: 0.25rem;
	}

	.movement-card-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border-subtle);
		color: var(--color-text-primary);
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	.movement-card-btn:hover {
		background: var(--color-surface-hover);
	}

	.movement-card-btn.selected {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
	}

	.movement-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.movement-card-name {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.movement-card-century {
		font-size: 0.775rem;
		color: var(--color-text-secondary);
	}

	.checkbox-indicator {
		width: 22px;
		height: 22px;
		border-radius: 6px;
		border: 1.5px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #000000;
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	.checkbox-indicator.checked {
		background: var(--color-primary);
		border-color: var(--color-primary);
	}

	.empty-movements {
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		padding: 2rem 0;
	}

	.modal-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border-subtle);
	}

	.btn-secondary {
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border-subtle);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: color 0.15s ease, border-color 0.15s ease;
	}

	.btn-secondary:hover {
		color: var(--color-text-primary);
		border-color: var(--color-border);
	}

	.btn-primary {
		padding: 0.65rem 1.4rem;
		border-radius: var(--radius-pill);
		background: var(--color-primary);
		color: #000000;
		font-size: 0.875rem;
		font-weight: 700;
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
