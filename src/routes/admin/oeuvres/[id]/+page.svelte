<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { parseMarkdown } from '$lib/utils/markdown';
  import { Sparkle, ShieldCheck, ArrowLeft, Warning } from 'phosphor-svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let { data } = $props();
  let oeuvre = $derived(data.oeuvre);
  let content = $state(untrack(() => data.oeuvre.contenus_oeuvres));
  
  $effect(() => {
    content = data.oeuvre.contenus_oeuvres;
  });
  
  let generating = $state(false);
  let checking = $state(false);
  let validating = $state(false);
  let correcting = $state(false);
  let validatingPortions: Record<string, boolean> = $state({});
  let correctingPortions: Record<string, boolean> = $state({});
  let deletingPortions: Record<string, boolean> = $state({});

  async function deletePortion(portionId: string) {
    if (!confirm('Supprimer définitivement ce paragraphe ?')) return;
    deletingPortions[portionId] = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/delete-portion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portionId })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.content) content = json.content;
        await invalidateAll();
      } else {
        alert('Erreur lors de la suppression');
      }
    } finally {
      deletingPortions[portionId] = false;
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

  async function validateManual(portionId?: string) {
    if (portionId) validatingPortions[portionId] = true;
    else validating = true;
    
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portionId })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.content) content = json.content;
        await invalidateAll();
      } else {
        alert('Erreur lors de la validation');
      }
    } finally {
      if (portionId) validatingPortions[portionId] = false;
      else validating = false;
    }
  }

  async function correctManual(portionId: string) {
    correctingPortions[portionId] = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portionId })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.content) content = json.content;
        await invalidateAll();
      } else {
        alert('Erreur lors de la correction');
      }
    } finally {
      correctingPortions[portionId] = false;
    }
  }

  let report = $derived(content?.verification_report as any);
  let portions = $derived((content?.article_portions || []) as any[]);
</script>

<div class="admin-detail-view">
  <div class="header-section sticky-header">
    <a href="/admin/oeuvres" class="back-link">
      <ArrowLeft size={18} weight="bold" />
      Retour
    </a>
    
    <div class="title-row">
      <div class="title-info">
        <h1 class="page-title">{oeuvre.titre}</h1>
        <p class="page-subtitle">{oeuvre.artiste}</p>
      </div>
      
      <div class="action-buttons">
        <Button 
          variant="primary" 
          onclick={generateContent} 
          loading={generating || checking}
        >
          {#if !(generating || checking)}<Sparkle size={18} weight="fill" />{/if}
          {generating ? 'Génération...' : checking ? 'Vérification...' : 'Générer'}
        </Button>
      </div>
    </div>
  </div>

  <div class="content-container">
    <section class="panel">
      <div class="panel-header">
        <h2 class="panel-title mb-0">Contenu & Fact-Checking</h2>
        {#if content?.verification_status}
          <div class="status-badge {content.verification_status.toLowerCase()}">
            {content.verification_status}
          </div>
        {/if}
      </div>

      {#if content?.introduction}
        <div class="introduction-section" style="margin-bottom: 2rem;">
          <h3 class="section-subtitle">Introduction</h3>
          <div class="rich-text">
            {@html parseMarkdown(content.introduction)}
          </div>
        </div>
      {/if}

      {#if portions.length > 0}
        {#if report}
          <div class="score-card {report.global_score >= 80 ? 'good' : report.global_score >= 50 ? 'average' : 'bad'}">
            <span class="score-label">Fiabilité globale</span>
            <span class="score-value">{report.global_score}%</span>
          </div>
        {/if}

        <div class="statements-list">
          <h3 class="section-subtitle" style="margin-top: 1.5rem;">Article</h3>
          {#each portions.filter((p: any) => p.type === 'article') as portion, index}
            <div class="statement-card {portion.status.toLowerCase()}">
              <div class="statement-header">
                <span class="portion-index">Partie {index + 1}</span>
                <span class="statement-status {portion.status.toLowerCase()}">{portion.status}</span>
              </div>
              
              {#if portion.title}
                <h4 class="statement-title">{portion.title}</h4>
              {/if}
              <div class="rich-text statement-text">
                {@html parseMarkdown(portion.text)}
              </div>
              
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
                    {#if portion.status?.toUpperCase() === 'FALSE'}
                      <Button variant="danger" size="sm" onclick={() => correctManual(portion.id)} loading={correctingPortions[portion.id]}>
                        Corriger via l'IA
                      </Button>
                    {:else if portion.status?.toUpperCase() === 'UNVERIFIED' || portion.status?.toUpperCase() === 'PENDING'}
                      <Button variant="primary" size="sm" onclick={() => validateManual(portion.id)} loading={validatingPortions[portion.id]} disabled={deletingPortions[portion.id]}>
                        Valider
                      </Button>
                      <Button variant="danger" size="sm" onclick={() => deletePortion(portion.id)} loading={deletingPortions[portion.id]} disabled={validatingPortions[portion.id]}>
                        Supprimer
                      </Button>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          {/each}

          {#if portions.some((p: any) => p.type === 'anecdote')}
            <div class="anecdotes-section" style="margin-top: 2rem;">
              <h3 class="section-subtitle">Anecdotes</h3>
              <div class="statements-list">
              {#each portions.filter((p: any) => p.type === 'anecdote') as portion, index}
                <div class="statement-card {portion.status.toLowerCase()}">
                  <div class="statement-header">
                    <span class="portion-index">Anecdote {index + 1}</span>
                    <span class="statement-status {portion.status.toLowerCase()}">{portion.status}</span>
                  </div>
                  
                  <div class="rich-text statement-text">
                    {@html parseMarkdown(portion.text)}
                  </div>
                  
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
                        {#if portion.status?.toUpperCase() === 'FALSE'}
                          <Button variant="danger" size="sm" onclick={() => correctManual(portion.id)} loading={correctingPortions[portion.id]}>
                            Corriger via l'IA
                          </Button>
                        {:else if portion.status?.toUpperCase() === 'UNVERIFIED' || portion.status?.toUpperCase() === 'PENDING'}
                          <Button variant="primary" size="sm" onclick={() => validateManual(portion.id)} loading={validatingPortions[portion.id]} disabled={deletingPortions[portion.id]}>
                            Valider
                          </Button>
                          <Button variant="danger" size="sm" onclick={() => deletePortion(portion.id)} loading={deletingPortions[portion.id]} disabled={validatingPortions[portion.id]}>
                            Supprimer
                          </Button>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
              </div>
            </div>
          {/if}
        </div>
      {:else if !content?.article_principal}
        <div class="empty-state">
          <Warning size={32} weight="duotone" class="empty-icon" />
          <p>Aucune description générée pour le moment.<br/>Cliquez sur "Générer".</p>
        </div>
      {:else}
        <div class="empty-state">
          <ShieldCheck size={32} weight="duotone" class="empty-icon" />
          <p>Aucun rapport disponible.<br/>{checking ? 'Fact-checking en cours...' : 'Veuillez regénérer le contenu.'}</p>
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
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
    padding: 1rem 1.25rem 1.5rem;
    margin: -1rem 0 0;
    border-bottom: 1px solid var(--color-border-subtle);
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
    font-size: 1.75rem;
    font-weight: 800;
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
    gap: 1.5rem;
    padding: 0 1.25rem;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  .panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.02);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .panel-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 1.25rem 0;
  }

  .mb-0 {
    margin-bottom: 0 !important;
  }

  /* Typography for injected markdown */
  .rich-text {
    line-height: 1.6;
    color: var(--color-text-primary);
    font-size: 0.95rem;
  }

  .rich-text :global(h2), .rich-text :global(h3) {
    color: var(--color-text-primary);
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-size: 1.15rem;
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
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 1rem;
  }

  .anecdotes-list {
    padding-left: 1.25rem;
    color: var(--color-text-secondary);
    font-size: 0.95rem;
  }

  .anecdotes-list li {
    margin-bottom: 0.75rem;
    line-height: 1.5;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
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

  .score-card.good .score-value { color: var(--color-success); }
  .score-card.average .score-value { color: var(--color-warning); }
  .score-card.bad .score-value { color: var(--color-danger); }

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

  .statement-source p {
    margin: 0;
    font-style: italic;
    line-height: 1.5;
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
