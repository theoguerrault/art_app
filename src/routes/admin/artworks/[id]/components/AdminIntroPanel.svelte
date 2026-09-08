<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { parseMarkdown } from '$lib/utils/markdown';
  import { html } from '$lib/actions/html';
  import { autosize } from '$lib/actions/autosize';
  import Button from '$lib/components/ui/Button.svelte';
  import { apiClient } from '$lib/utils/api';
  import { toast } from '$lib/utils/toast.svelte';
  import { Sparkle, Check, X, PencilSimple, ArrowClockwise } from 'phosphor-svelte';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { artwork, content }: { artwork: any; content: any } = $props();

  let editingIntro = $state(false);
  let editIntroText = $state('');
  let savingIntro = $state(false);
  let regeneratingIntro = $state(false);
  let verifyingIntro = $state(false);
  let validatingIntro = $state(false);
  let unvalidatingIntro = $state(false);

  async function saveEditIntro() {
    if (!editIntroText.trim()) return;
    savingIntro = true;
    try {
      const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/edit-intro`, { introduction: editIntroText });
      if (res.ok) {
        await invalidateAll();
        editingIntro = false;
        toast.success("Introduction enregistrée");
      } else {
        toast.error("Erreur lors de la modification de l'introduction");
      }
    } catch {
      toast.error("Erreur réseau lors de la sauvegarde");
    } finally {
      savingIntro = false;
    }
  }

  async function regenerateIntro() {
    if (content?.introduction && !confirm("Voulez-vous vraiment regénérer l'introduction ?")) return;
    regeneratingIntro = true;
    try {
      const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/regenerate-intro`);
      if (res.ok) {
        const json = await res.json();
        if (editingIntro && json.content) {
          editIntroText = json.content.introduction || '';
        }
        await invalidateAll();
        toast.success("Introduction regénérée par l'IA");
      } else {
        toast.error("Erreur lors de la regénération de l'introduction");
      }
    } catch {
      toast.error("Erreur réseau lors de la regénération");
    } finally {
      regeneratingIntro = false;
    }
  }

  async function factcheckIntro() {
    verifyingIntro = true;
    try {
      const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/factcheck-intro`);
      if (res.ok) {
        await invalidateAll();
        toast.success("Vérification de l'introduction terminée");
      } else {
        toast.error("Erreur lors de la vérification de l'introduction");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      verifyingIntro = false;
    }
  }

  async function unvalidateIntro() {
    unvalidatingIntro = true;
    try {
      const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/unvalidate-intro`);
      if (res.ok) {
        await invalidateAll();
        toast.info("Introduction invalidée");
      } else {
        toast.error("Erreur lors de l'invalidation de l'introduction");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      unvalidatingIntro = false;
    }
  }

  async function validateIntro() {
    validatingIntro = true;
    try {
      const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/validate-intro`);
      if (res.ok) {
        await invalidateAll();
        toast.success("Introduction validée");
      } else {
        toast.error("Erreur lors de la validation de l'introduction");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      validatingIntro = false;
    }
  }

  function handleCancelEdit() {
    editingIntro = false;
  }

  function handleStartEdit() {
    editingIntro = true;
    editIntroText = content?.introduction || '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveEditIntro();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }
</script>

<div class="introduction-section">
  <div class="section-header">
    <div class="title-with-badge">
      <h3 class="section-subtitle">INTRODUCTION</h3>
      {#if content?.verification_report?.introduction?.status}
        <span class="status-pill {content.verification_report.introduction.status.toLowerCase()}">
          {content.verification_report.introduction.status}
        </span>
      {/if}
    </div>
    
    {#if !editingIntro && content?.introduction}
      <div class="intro-actions">
        {#if content?.verification_report?.introduction?.status?.toUpperCase() === 'VERIFIED'}
          <Button variant="outline" size="sm" onclick={handleStartEdit}>
            <PencilSimple size={14} weight="bold" />
            Modifier
          </Button>
          <Button variant="ghost" size="sm" onclick={unvalidateIntro} loading={unvalidatingIntro}>
            <X size={14} weight="bold" />
            Invalider
          </Button>
        {:else}
          <Button variant="primary" size="sm" onclick={validateIntro} loading={validatingIntro}>
            <Check size={14} weight="bold" />
            Valider
          </Button>
          <Button variant="outline" size="sm" onclick={factcheckIntro} loading={verifyingIntro}>
            <ArrowClockwise size={14} weight="bold" />
            Vérifier
          </Button>
          <Button variant="outline" size="sm" onclick={handleStartEdit}>
            <PencilSimple size={14} weight="bold" />
            Modifier
          </Button>
        {/if}
      </div>
    {/if}
  </div>
  
  {#if editingIntro}
    <div class="edit-box">
      <textarea 
        bind:value={editIntroText} 
        use:autosize 
        onkeydown={handleKeydown}
        class="edit-textarea" 
        rows="4" 
        placeholder="Introduction de l'œuvre..."
      ></textarea>
      
      <div class="edit-footer">
        <span class="shortcut-hint">
          <kbd>⌘</kbd>+<kbd>Entrée</kbd> pour sauvegarder • <kbd>Échap</kbd> pour annuler
        </span>
        <div class="edit-actions">
          <Button variant="ghost" size="sm" onclick={handleCancelEdit}>
            Annuler
          </Button>
          <Button variant="outline" size="sm" onclick={regenerateIntro} loading={regeneratingIntro}>
            <Sparkle size={14} weight="fill" />
            Régénérer par IA
          </Button>
          <Button variant="primary" size="sm" onclick={saveEditIntro} loading={savingIntro}>
            <Check size={14} weight="bold" />
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  {:else if content?.introduction}
    <div class="rich-text" use:html={parseMarkdown(content.introduction)}></div>
    {#if content?.verification_report?.introduction?.explanation}
      <div class="statement-feedback">
        <p class="statement-explanation">{content.verification_report.introduction.explanation}</p>
        {#if content.verification_report.introduction.source_quote}
          <div class="statement-source">
            <span class="source-label">Extrait Wikipédia</span>
            <p>"{content.verification_report.introduction.source_quote}"</p>
          </div>
        {/if}
      </div>
    {/if}
  {:else}
    <div class="empty-intro">
      <Button variant="outline" onclick={regenerateIntro} loading={regeneratingIntro} title="Générer l'introduction">
        <Sparkle size={16} weight="fill" />
        Générer l'introduction
      </Button>
    </div>
  {/if}
</div>

<style>
  .introduction-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--color-border-subtle);
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .title-with-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .section-subtitle {
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
    margin: 0;
  }
  .intro-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .status-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.65rem;
    border-radius: var(--radius-pill);
    font-size: 0.7rem;
    font-weight: 700;
    font-family: var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
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
  
  .edit-box {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .edit-textarea {
    width: 100%;
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 0.85rem 1rem;
    font-family: var(--font-body);
    font-size: 0.95rem;
    line-height: 1.6;
    transition: border-color 0.2s ease;
  }
  .edit-textarea:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .edit-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
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
  
  .rich-text {
    line-height: 1.7;
    color: var(--color-text-primary);
    font-size: 0.95rem;
  }

  .statement-feedback {
    background: transparent;
    padding: 0.75rem 0 0 0;
  }
  .statement-explanation {
    font-size: 0.88rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
  .statement-source {
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    background: color-mix(in srgb, var(--color-surface) 60%, black);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-subtle);
    font-size: 0.85rem;
    color: var(--color-text-muted);
    font-style: italic;
  }
  .source-label {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-primary);
    margin-bottom: 0.25rem;
    font-style: normal;
  }

  .empty-intro {
    padding: 1.5rem 0;
    text-align: center;
  }
</style>
