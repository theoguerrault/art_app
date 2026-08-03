<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  import { ShieldCheck } from 'phosphor-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import AdminImagePanel from './components/AdminImagePanel.svelte';
  import AdminIntroPanel from './components/AdminIntroPanel.svelte';
  import AdminPortionsPanel from './components/AdminPortionsPanel.svelte';
  import AdminHeader from './components/AdminHeader.svelte';
  import { apiClient } from '$lib/utils/api';

  let { data } = $props();
  let oeuvre = $derived(data.oeuvre);
  let content = $derived(data.oeuvre.oeuvre_translations[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let report = $derived.by(() => content?.verification_report as any);
  
  let generating = $state(false);
  let checking = $state(false);
  let unvalidatingContent = $state(false);

  async function unvalidateContent() {
    unvalidatingContent = true;
    try {
      const res = await apiClient.post(`/api/admin/artworks/${oeuvre.id}/unvalidate`);
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
      const res = await apiClient.post(`/api/admin/artworks/${oeuvre.id}/generate`);
      if (res.ok) {
        const json = await res.json();
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
      let hasError = false;
      
      const resPortions = await apiClient.post(`/api/admin/artworks/${oeuvre.id}/factcheck`);
      if (resPortions.ok) {
        const json = await resPortions.json();
        await invalidateAll();
      } else {
        hasError = true;
      }

      const resIntro = await apiClient.post(`/api/admin/artworks/${oeuvre.id}/factcheck-intro`);
      if (resIntro.ok) {
        const json = await resIntro.json();
        await invalidateAll();
      } else {
        hasError = true;
      }

      if (hasError) {
        alert('Erreur partielle lors du fact-checking global');
      }

      await invalidateAll();
    } finally {
      checking = false;
    }
  }
</script>

<div class="admin-detail-view">
  <AdminHeader {oeuvre} {generating} {checking} {generateContent} />

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
            <div class="verification-status-wrapper">
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

  .admin-detail-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 4rem;
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
    margin-bottom: 0 ;
  }


</style>
