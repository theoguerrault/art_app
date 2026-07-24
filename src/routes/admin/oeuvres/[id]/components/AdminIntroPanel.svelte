<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { parseMarkdown } from '$lib/utils/markdown';
  import Button from '$lib/components/ui/Button.svelte';

  let { oeuvre, content }: { oeuvre: any; content: any } = $props();

  let editingIntro = $state(false);
  let editIntroText = $state('');
  let savingIntro = $state(false);
  let regeneratingIntro = $state(false);
  let verifyingIntro = $state(false);
  let validatingIntro = $state(false);

  async function saveEditIntro() {
    if (!editIntroText.trim()) return;
    savingIntro = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/edit-intro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ introduction: editIntroText })
      });
      if (res.ok) {
        await invalidateAll();
        editingIntro = false;
      } else {
        alert("Erreur lors de la modification de l'introduction");
      }
    } finally {
      savingIntro = false;
    }
  }

  async function regenerateIntro() {
    if (content?.introduction && !confirm("Voulez-vous vraiment regénérer l'introduction ?")) return;
    regeneratingIntro = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/regenerate-intro`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (editingIntro && json.content) {
          editIntroText = json.content.introduction || '';
        }
        await invalidateAll();
      } else {
        alert("Erreur lors de la regénération de l'introduction");
      }
    } finally {
      regeneratingIntro = false;
    }
  }

  async function factcheckIntro() {
    verifyingIntro = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/factcheck-intro`, { method: 'POST' });
      if (res.ok) {
        await invalidateAll();
      } else {
        alert("Erreur lors de la vérification de l'introduction");
      }
    } finally {
      verifyingIntro = false;
    }
  }

  let unvalidatingIntro = $state(false);

  async function unvalidateIntro() {
    unvalidatingIntro = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/unvalidate-intro`, { method: 'POST' });
      if (res.ok) {
        await invalidateAll();
      } else {
        alert("Erreur lors de l'invalidation de l'introduction");
      }
    } finally {
      unvalidatingIntro = false;
    }
  }

  async function validateIntro() {
    validatingIntro = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/validate-intro`, { method: 'POST' });
      if (res.ok) {
        await invalidateAll();
      } else {
        alert("Erreur lors de la validation de l'introduction");
      }
    } finally {
      validatingIntro = false;
    }
  }
</script>

<div class="introduction-section">
  <div class="section-header">
    <h3 class="section-subtitle mb-0">INTRODUCTION</h3>
    {#if content?.verification_report?.introduction?.status}
      <span class="status-pill {content.verification_report.introduction.status.toLowerCase()}">
        {content.verification_report.introduction.status}
      </span>
    {/if}
  </div>
  
  <div class="intro-actions">
    {#if editingIntro}
      <Button variant="primary" size="sm" onclick={saveEditIntro} loading={savingIntro}>
        Sauvegarder
      </Button>
      <Button variant="outline" size="sm" onclick={regenerateIntro} loading={regeneratingIntro}>
        Générer
      </Button>
      <Button variant="outline" size="sm" onclick={() => editingIntro = false}>
        Annuler
      </Button>
    {:else}
      <Button variant="outline" size="sm" onclick={() => { editingIntro = true; editIntroText = content?.introduction || ''; }}>
        Modifier
      </Button>
      {#if content?.introduction}
        <Button variant="outline" size="sm" onclick={factcheckIntro} loading={verifyingIntro} disabled={content?.verification_report?.introduction?.status?.toUpperCase() === 'VERIFIED'}>
          Vérifier
        </Button>
        {#if content?.verification_report?.introduction?.status?.toUpperCase() === 'VERIFIED'}
          <Button variant="outline" size="sm" onclick={unvalidateIntro} loading={unvalidatingIntro}>
            Invalider
          </Button>
        {:else}
          <Button variant="outline" size="sm" onclick={validateIntro} loading={validatingIntro}>
            Valider
          </Button>
        {/if}
      {/if}
    {/if}
  </div>
  
  {#if editingIntro}
    <textarea bind:value={editIntroText} class="edit-textarea" rows="5"></textarea>
  {:else if content?.introduction}
    <div class="rich-text">
      {@html parseMarkdown(content.introduction)}
    </div>
    {#if content?.verification_report?.introduction?.explanation}
      <div class="statement-feedback">
        <p class="statement-explanation">{content.verification_report.introduction.explanation}</p>
        {#if content.verification_report.introduction.source_quote}
          <div class="statement-source">
            <span class="source-label">Source Wikipédia</span>
            <p>"{content.verification_report.introduction.source_quote}"</p>
          </div>
        {/if}
      </div>
    {/if}
  {:else}
    <div class="empty-intro">
      <Button variant="outline" onclick={regenerateIntro} loading={regeneratingIntro} title="Générer l'introduction">
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
    flex-wrap: wrap;
  }
  @media (max-width: 600px) {
    .intro-actions :global(> *) {
      flex: 1 1 calc(50% - 0.25rem);
    }
  }
  .mb-0 {
    margin-bottom: 0;
  }
  .status-pill, .statement-status {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.85rem;
    border-radius: var(--radius-pill);
    font-size: 0.75rem;
    font-weight: 700;
    font-family: var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border: 1px solid transparent;
  }
  .status-pill.verified, .statement-status.verified {
    background: color-mix(in oklch, var(--color-success) 15%, transparent);
    color: var(--color-success);
    border-color: color-mix(in oklch, var(--color-success) 30%, transparent);
  }
  .status-pill.pending, .statement-status.pending {
    background: color-mix(in oklch, var(--color-text-secondary) 15%, transparent);
    color: var(--color-text-secondary);
    border-color: color-mix(in oklch, var(--color-text-secondary) 30%, transparent);
  }
  .status-pill.pending_validation, .statement-status.pending_validation {
    background: color-mix(in oklch, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
    border-color: color-mix(in oklch, var(--color-warning) 30%, transparent);
  }
  .status-pill.false, .statement-status.false {
    background: color-mix(in oklch, var(--color-error) 15%, transparent);
    color: var(--color-error);
    border-color: color-mix(in oklch, var(--color-error) 30%, transparent);
  }
  
  .edit-textarea {
    width: 100%;
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.75rem;
    font-family: var(--font-body);
    font-size: 0.9rem;
    resize: vertical;
  }
  
  .statement-feedback {
    background: transparent;
    padding: 0.75rem 0 0 0;
  }
  .statement-explanation {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
  .statement-source {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg);
    border-radius: 8px;
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
    color: var(--color-text-secondary);
    margin-bottom: 0.25rem;
    font-style: normal;
  }

  .empty-intro {
    padding: 1rem 0;
    text-align: center;
  }
</style>
