<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { parseMarkdown } from '$lib/utils/markdown';
  import { Sparkle, ShieldCheck, ArrowLeft, Warning, PencilSimple, ArrowsClockwise, Trash, Check, X } from 'phosphor-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import AdminImagePanel from './components/AdminImagePanel.svelte';
  import AdminIntroPanel from './components/AdminIntroPanel.svelte';
  import AdminPortionsPanel from './components/AdminPortionsPanel.svelte';

  let { data } = $props();
  let oeuvre = $derived(data.oeuvre);
  let content = $state(untrack(() => data.oeuvre.oeuvre_translations[0]));
  let report = $derived(content?.verification_report as any);
  
  $effect(() => {
    content = data.oeuvre.oeuvre_translations[0];
  });
  
  let generating = $state(false);
  let checking = $state(false);
  let unvalidatingContent = $state(false);

  async function unvalidateContent() {
    unvalidatingContent = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/unvalidate`, { method: 'POST' });
      if (res.ok) {
        await invalidateAll();
      } else {
        alert("Erreur lors de l'invalidation du contenu");
      }
    } finally {
      unvalidatingContent = false;
    }
  }

  async function generateContent() {
    if (content?.article_principal && !confirm('Du contenu existe déjà. Voulez-vous vraiment le regénérer ?')) return;
    generating = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/generate`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.content) content = json.content;
        await invalidateAll();
        // Lancer automatiquement le fact-check après la génération
        factCheck().catch(console.error);
      } else {
        alert('Erreur lors de la génération');
      }
    } finally {
      generating = false;
    }
  }

  async function factCheck() {
    checking = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/factcheck`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.content) content = json.content;
        await invalidateAll();
      } else {
        alert('Erreur lors du fact-checking');
      }
    } finally {
      checking = false;
    }
  }
</script>

<div class="admin-detail-view">
  <div class="header-section sticky-header">
    <a href="/admin/oeuvres" class="back-link">
      <ArrowLeft size={18} weight="bold" />
      Retour
    </a>
    
    <div class="title-row">
      <div class="title-info">
        <h1 class="page-title">{(oeuvre.oeuvre_translations?.[0]?.titre || '')}</h1>
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

  <div class="content-container">
    <AdminImagePanel {oeuvre} />

    <section class="panel">
      <div class="panel-header">
        <h2 class="panel-title mb-0">CONTENU & FACT-CHECKING</h2>
        <div class="header-badges">
          {#if report?.global_score !== undefined && report?.global_score !== null}
            {@const score = report.global_score}
            <div class="score-pill {score >= 80 ? 'good' : score >= 50 ? 'average' : 'bad'}" title="Score global de fiabilité">
              <ShieldCheck size={16} weight="regular" />
              <span>Fiabilité : <strong>{score}%</strong></span>
            </div>
          {/if}
          {#if content?.verification_status}
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="status-pill {content.verification_status.toLowerCase()}">
                {content.verification_status}
              </div>
              {#if content.verification_status === 'VERIFIED'}
                <Button variant="outline" size="sm" onclick={unvalidateContent} loading={unvalidatingContent}>
                  Invalider
                </Button>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <AdminIntroPanel {oeuvre} {content} />

      <AdminPortionsPanel {oeuvre} {content} {checking} />
    </section>
  </div>
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
  .admin-detail-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 4rem;
  }

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

  .content-container {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    padding: 0;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  .panel {
    background: transparent;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  @media (max-width: 600px) {
    .content-container {
      gap: 1.5rem;
    }
  }

  .panel-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 0.5rem;
    gap: 0.75rem;
  }

  .header-badges {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 0.75rem;
  }

  .score-pill, .status-pill, .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.85rem;
    border-radius: var(--radius-pill);
    font-size: 0.75rem;
    font-weight: 700;
    font-family: var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .score-pill.good, .status-pill.verified, .status-badge.verified {
    background: color-mix(in oklch, var(--color-success) 15%, transparent);
    color: var(--color-success);
    border: 1px solid color-mix(in oklch, var(--color-success) 30%, transparent);
  }
  .score-pill.average, .status-pill.pending_validation, .status-badge.pending_validation {
    background: color-mix(in oklch, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
    border: 1px solid color-mix(in oklch, var(--color-warning) 30%, transparent);
  }
  .score-pill.bad, .status-pill.false, .status-badge.false {
    background: color-mix(in oklch, var(--color-error) 15%, transparent);
    color: var(--color-error);
    border: 1px solid color-mix(in oklch, var(--color-error) 30%, transparent);
  }
  .status-pill.pending, .status-badge.pending {
    background: color-mix(in oklch, var(--color-text-secondary) 15%, transparent);
    color: var(--color-text-secondary);
    border: 1px solid color-mix(in oklch, var(--color-text-secondary) 30%, transparent);
  }

  .panel-title {
    font-family: var(--font-body);
    font-size: 1.15rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
  }

  .mb-0 {
    margin-bottom: 0 !important;
  }

  /* Typography for injected markdown */
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

  .anecdotes-section {
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border-subtle);
  }

  .section-subtitle {
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
  }

  .anecdotes-list {
    padding-left: 1.25rem;
    color: var(--color-text-secondary);
    font-size: 0.95rem;
  }


  .status-badge {
    padding: 0.35rem 0.85rem;
    border-radius: var(--radius-pill);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .status-badge.verified { background: color-mix(in oklch, var(--color-success) 15%, transparent); color: var(--color-success); }
  .status-badge.pending { background: color-mix(in oklch, var(--color-text-secondary) 15%, transparent); color: var(--color-text-secondary); }
  .status-badge.pending_validation { background: color-mix(in oklch, var(--color-warning) 15%, transparent); color: var(--color-warning); }
  .status-badge.false { background: color-mix(in oklch, var(--color-danger) 15%, transparent); color: var(--color-danger); }



  .validate-btn {
    background: var(--color-warning);
    color: var(--color-bg);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: transform 0.2s ease, opacity 0.2s ease;
    white-space: nowrap;
  }

  .validate-btn.error-btn {
    background: var(--color-danger);
  }

  .validate-btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .validate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .score-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border-subtle);
  }

  .score-label {
    font-weight: 600;
    color: var(--color-text-secondary);
    font-size: 0.95rem;
  }

  .score-value {
    font-size: 1.75rem;
    font-weight: 800;
  }


  .statements-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .statement-card {
    padding: 1.5rem;
    border-radius: 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    transition: all 0.2s ease;
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

  .statement-feedback {
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--color-border-subtle);
  }

  .statement-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 1rem;
  }

  .statement-status {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .statement-status.verified { background: color-mix(in oklch, var(--color-success) 20%, transparent); color: var(--color-success); }
  .statement-status.false { background: color-mix(in oklch, var(--color-danger) 20%, transparent); color: var(--color-danger); }
  .statement-status.unverified { background: color-mix(in oklch, var(--color-warning) 20%, transparent); color: var(--color-warning); }

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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-muted);
  }

  .empty-icon {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .loader {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .portion-index {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .action-inline {
    margin-top: 1rem;
    width: 100%;
    display: flex;
    justify-content: center;
  }
</style>
