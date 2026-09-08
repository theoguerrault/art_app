<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { apiClient } from '$lib/utils/api';
  import { toast } from '$lib/utils/toast.svelte';
  import { Sparkle, Image as ImageIcon, UploadSimple, LinkSimple, Check, X } from 'phosphor-svelte';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { artwork }: { artwork: any } = $props();

  let editingImage = $state(false);
  let newImageUrl = $state('');
  let newImageFile = $state<File | null>(null);
  let savingImage = $state(false);
  
  let verifyingImage = $state(false);
  let verificationResult = $state<{isValid: boolean; explanation: string} | null>(null);

  async function verifyImage() {
    verifyingImage = true;
    verificationResult = null;
    try {
      const res = await apiClient.request(`/api/admin/artworks/${artwork.id}/verify-image`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        verificationResult = data.result;
        if (data.result.isValid) {
          toast.success("Image validée par l'IA");
        } else {
          toast.warning("Incohérence détectée sur l'image");
        }
      } else {
        toast.error("Erreur lors de la vérification : " + (data.error || 'Erreur inconnue'));
      }
    } catch {
      toast.error('Erreur réseau lors de la vérification');
    } finally {
      verifyingImage = false;
    }
  }
  
  async function saveImageEdit() {
    if (!newImageUrl && !newImageFile) {
      toast.warning("Veuillez fournir une URL ou sélectionner un fichier.");
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

      const res = await apiClient.request(`/api/admin/artworks/${artwork.id}/edit-image`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        await invalidateAll();
        editingImage = false;
        newImageFile = null;
        newImageUrl = '';
        toast.success("Image mise à jour avec succès");
      } else {
        const json = await res.json().catch(() => ({}));
        toast.error('Erreur lors de la sauvegarde : ' + (json.error || 'Erreur inconnue'));
      }
    } catch {
      toast.error('Erreur réseau lors de la sauvegarde');
    } finally {
      savingImage = false;
    }
  }

  function handleCancelEdit() {
    editingImage = false;
    newImageFile = null;
    newImageUrl = '';
  }

  function handleStartEdit() {
    editingImage = true;
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      newImageFile = target.files[0];
      newImageUrl = '';
    } else {
      newImageFile = null;
    }
  }

  function handleUrlInput() {
    if (newImageUrl) {
      newImageFile = null;
    }
  }
</script>

<section class="panel">
  <div class="panel-header">
    <h2 class="panel-title">IMAGE DE L'ŒUVRE</h2>
    <div class="action-buttons">
      {#if editingImage}
        <Button variant="ghost" size="sm" onclick={handleCancelEdit}>Annuler</Button>
        <Button variant="primary" size="sm" onclick={saveImageEdit} loading={savingImage}>
          <Check size={14} weight="bold" />
          Sauvegarder
        </Button>
      {:else}
        {#if artwork.image_url_full}
          <Button variant="secondary" size="sm" onclick={verifyImage} loading={verifyingImage}>
            <Sparkle size={14} weight="fill" />
            Vérifier IA
          </Button>
        {/if}
        <Button variant="outline" size="sm" onclick={handleStartEdit}>Modifier</Button>
      {/if}
    </div>
  </div>
  
  <div class="image-section">
    <div class="current-image">
      {#if artwork.image_url_full}
        <img 
          src={artwork.image_url_full} 
          alt={artwork.artwork_translations?.[0]?.title || 'Artwork preview'} 
          class="preview-image" 
        />
      {:else}
        <div class="no-image-placeholder">
          <ImageIcon size={36} weight="duotone" />
          <p>Aucune image disponible</p>
        </div>
      {/if}
    </div>
    
    {#if verificationResult}
      <div class="verification-result {verificationResult.isValid ? 'valid' : 'invalid'}">
        <div class="result-header">
          {#if verificationResult.isValid}
            <Check size={18} weight="bold" />
            <span>Image validée par Gemini</span>
          {:else}
            <X size={18} weight="bold" />
            <span>Incohérence détectée</span>
          {/if}
        </div>
        <p>{verificationResult.explanation}</p>
      </div>
    {/if}

    {#if editingImage}
      <div class="edit-image-form-container">
        <div class="form-field">
          <label for="image-upload" class="form-label">
            <UploadSimple size={16} weight="bold" />
            Uploader un fichier image :
          </label>
          <input 
            id="image-upload" 
            type="file" 
            accept="image/*" 
            class="edit-input file-input" 
            onchange={handleFileChange} 
          />
        </div>
        
        <div class="form-separator"><span>OU</span></div>
        
        <div class="form-field">
          <label for="image-url" class="form-label">
            <LinkSimple size={16} weight="bold" />
            Utiliser une URL externe :
          </label>
          <input 
            id="image-url" 
            type="url" 
            class="edit-input" 
            placeholder="https://exemple.com/image.jpg"
            bind:value={newImageUrl} 
            oninput={handleUrlInput}
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

  .current-image {
    display: flex;
    justify-content: center;
    align-items: center;
    background: color-mix(in srgb, var(--color-surface) 60%, black);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-subtle);
    overflow: hidden;
    min-height: 220px;
    padding: 0.5rem;
  }

  .preview-image {
    max-height: 260px;
    max-width: 100%;
    object-fit: contain;
    border-radius: var(--radius-md);
  }

  .no-image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: var(--color-text-muted);
    padding: 2rem;
    font-size: 0.9rem;
  }

  .edit-image-form-container {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    background: var(--color-surface);
    padding: 1.25rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-subtle);
    margin-top: 0.75rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-label {
    display: flex;
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
    font-size: 0.9rem;
  }
  .edit-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .file-input {
    padding: 0.5rem;
  }

  .form-separator {
    display: flex;
    align-items: center;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .form-separator::before,
  .form-separator::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--color-border-subtle);
  }
  .form-separator span {
    padding: 0 0.75rem;
  }
  
  .verification-result {
    margin-top: 0.75rem;
    padding: 0.85rem 1rem;
    border-radius: var(--radius-md);
    font-size: 0.85rem;
    line-height: 1.5;
  }
  .result-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 700;
    margin-bottom: 0.35rem;
  }
  .verification-result.valid {
    background-color: color-mix(in oklch, var(--color-success) 12%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-success) 35%, transparent);
    color: var(--color-success);
  }
  .verification-result.valid p {
    color: var(--color-text-secondary);
  }
  .verification-result.invalid {
    background-color: color-mix(in oklch, var(--color-error) 12%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-error) 35%, transparent);
    color: var(--color-error);
  }
  .verification-result.invalid p {
    color: var(--color-text-secondary);
  }
</style>

