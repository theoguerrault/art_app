<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { apiClient } from '$lib/utils/api';
  import { toast } from '$lib/utils/toast.svelte';
  import { Bank, CalendarBlank, Check } from 'phosphor-svelte';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { artwork }: { artwork: any } = $props();

  let editing = $state(false);
  let museeValue = $state('');
  let dateValue = $state('');
  let saving = $state(false);

  $effect(() => {
    museeValue = artwork.musee || '';
    dateValue = artwork.creation_date || '';
  });

  function startEdit() {
    museeValue = artwork.musee || '';
    dateValue = artwork.creation_date || '';
    editing = true;
  }

  function cancelEdit() {
    museeValue = artwork.musee || '';
    dateValue = artwork.creation_date || '';
    editing = false;
  }

  async function saveMetadata() {
    saving = true;
    try {
      const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/edit-metadata`, {
        musee: museeValue,
        creation_date: dateValue
      });

      if (res.ok) {
        await invalidateAll();
        editing = false;
        toast.success("Métadonnées mises à jour");
      } else {
        const json = await res.json().catch(() => ({}));
        toast.error('Erreur lors de la sauvegarde : ' + (json.error || 'Erreur inconnue'));
      }
    } catch {
      toast.error('Erreur réseau lors de la sauvegarde');
    } finally {
      saving = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveMetadata();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }
</script>

<section class="panel">
  <div class="panel-header">
    <h2 class="panel-title">MÉTADONNÉES & LIEU</h2>
    <div class="action-buttons">
      {#if editing}
        <Button variant="ghost" size="sm" onclick={cancelEdit}>Annuler</Button>
        <Button variant="primary" size="sm" onclick={saveMetadata} loading={saving}>
          <Check size={14} weight="bold" />
          Sauvegarder
        </Button>
      {:else}
        <Button variant="outline" size="sm" onclick={startEdit}>Modifier</Button>
      {/if}
    </div>
  </div>

  {#if editing}
    <div class="edit-form-container">
      <div class="form-group">
        <label for="input-musee" class="form-label">
          <Bank size={16} weight="bold" />
          Musée / Lieu d'exposition (avec la ville) :
        </label>
        <input
          id="input-musee"
          type="text"
          class="edit-input"
          placeholder="Ex: Musée du Louvre, Paris"
          bind:value={museeValue}
          onkeydown={handleKeydown}
        />
      </div>

      <div class="form-group">
        <label for="input-date" class="form-label">
          <CalendarBlank size={16} weight="bold" />
          Date de création :
        </label>
        <input
          id="input-date"
          type="text"
          class="edit-input"
          placeholder="Ex: 1503–1519"
          bind:value={dateValue}
          onkeydown={handleKeydown}
        />
      </div>
    </div>
  {:else}
    <div class="metadata-display-grid">
      <div class="meta-card">
        <div class="meta-icon">
          <Bank size={18} weight="bold" />
        </div>
        <div class="meta-content">
          <span class="meta-label">Lieu d'exposition</span>
          <span class="meta-val {artwork.musee ? '' : 'empty'}">
            {artwork.musee || 'Non renseigné'}
          </span>
        </div>
      </div>

      <div class="meta-card">
        <div class="meta-icon">
          <CalendarBlank size={18} weight="bold" />
        </div>
        <div class="meta-content">
          <span class="meta-label">Date de création</span>
          <span class="meta-val {artwork.creation_date ? '' : 'empty'}">
            {artwork.creation_date || 'Inconnue'}
          </span>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .panel {
    background: transparent;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border-subtle);
    padding-bottom: 0.5rem;
  }

  .panel-title {
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-primary);
    margin: 0;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .metadata-display-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .meta-card {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.85rem 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
  }

  .meta-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-pill);
    background: color-mix(in oklch, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .meta-content {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .meta-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .meta-val {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta-val.empty {
    color: var(--color-text-muted);
    font-style: italic;
    font-weight: 400;
  }

  .edit-form-container {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    background: var(--color-surface);
    padding: 1rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-subtle);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 600;
    font-size: 0.82rem;
    color: var(--color-text-secondary);
  }

  .edit-input {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: 0.9rem;
  }

  .edit-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
</style>

