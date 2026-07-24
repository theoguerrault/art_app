<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';

  let { oeuvre }: { oeuvre: any } = $props();

  let editingImage = $state(false);
  let newImageUrl = $state('');
  let newImageFile = $state<File | null>(null);
  let savingImage = $state(false);
  
  async function saveImageEdit() {
    if (!newImageUrl && !newImageFile) {
      alert("Veuillez fournir une URL ou sélectionner un fichier.");
      return;
    }
    
    savingImage = true;
    try {
      const formData = new FormData();
      if (newImageFile) {
        formData.append('image', newImageFile);
      } else if (newImageUrl) {
        formData.append('url', newImageUrl);
      }

      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/edit-image`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        await invalidateAll();
        editingImage = false;
        newImageFile = null;
        newImageUrl = '';
      } else {
        const json = await res.json();
        alert('Erreur lors de la sauvegarde : ' + (json.error || 'Erreur inconnue'));
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau lors de la sauvegarde');
    } finally {
      savingImage = false;
    }
  }
</script>

<section class="panel">
  <div class="panel-header">
    <h2 class="panel-title mb-0">IMAGE DE L'ŒUVRE</h2>
    <div style="display: flex; gap: 0.5rem;">
      {#if editingImage}
        <Button variant="primary" size="sm" onclick={saveImageEdit} loading={savingImage}>Sauvegarder</Button>
        <Button variant="outline" size="sm" onclick={() => { editingImage = false; newImageFile = null; newImageUrl = ''; }}>Annuler</Button>
      {:else}
        <Button variant="outline" size="sm" onclick={() => editingImage = true}>Modifier</Button>
      {/if}
    </div>
  </div>
  
  <div class="image-section">
    <div class="current-image" style="margin-bottom: 1rem; display: flex; justify-content: center; align-items: center; background: transparent; padding: 0;">
      {#if oeuvre.image_url_full}
        <img src={oeuvre.image_url_full} alt={(oeuvre.oeuvre_translations?.[0]?.titre || '')} style="max-height: 300px; max-width: 100%; object-fit: contain; border-radius: 4px; margin: 0 auto;" />
      {:else}
        <p style="color: var(--color-text-secondary); padding: 2rem;">Aucune image disponible</p>
      {/if}
    </div>
    
    {#if editingImage}
      <div class="edit-image-form" style="display: flex; flex-direction: column; gap: 1rem; background: color-mix(in oklch, var(--color-surface) 95%, black); padding: 1rem; border-radius: 8px; border: 1px solid var(--color-border-subtle);">
        <div>
          <label for="image-upload" style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem;">Uploader un fichier :</label>
          <input 
            id="image-upload" 
            type="file" 
            accept="image/*" 
            class="edit-input" 
            style="width: 100%; padding: 0.5rem; background: var(--color-bg);"
            onchange={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.files && target.files.length > 0) {
                newImageFile = target.files[0];
                newImageUrl = ''; // Clear URL if file is selected
              } else {
                newImageFile = null;
              }
            }} 
          />
        </div>
        
        <div style="text-align: center; color: var(--color-text-secondary); font-size: 0.85rem; font-weight: 600;">OU</div>
        
        <div>
          <label for="image-url" style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem;">Utiliser une URL externe :</label>
          <input 
            id="image-url" 
            type="url" 
            class="edit-input" 
            placeholder="https://exemple.com/image.jpg"
            bind:value={newImageUrl} 
            oninput={() => { if (newImageUrl) newImageFile = null; }}
            disabled={newImageFile !== null}
          />
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .panel {
    background: transparent;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border-subtle);
    padding-bottom: 0.75rem;
    margin-bottom: -0.5rem;
  }

  .panel-title {
    font-family: var(--font-body);
    font-size: 1.15rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-primary);
  }

  .mb-0 {
    margin-bottom: 0;
  }
  
  .edit-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg);
    color: var(--color-text-primary);
  }
</style>
