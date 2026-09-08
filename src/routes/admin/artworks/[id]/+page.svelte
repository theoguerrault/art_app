<script lang="ts">
  import { invalidateAll, goto } from '$app/navigation';
  import { ShieldCheck, CheckCircle, WarningCircle, XCircle } from 'phosphor-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import AdminImagePanel from './components/AdminImagePanel.svelte';
  import AdminMetadataPanel from './components/AdminMetadataPanel.svelte';
  import AdminIntroPanel from './components/AdminIntroPanel.svelte';
  import AdminPortionsPanel from './components/AdminPortionsPanel.svelte';
  import AdminHeader from './components/AdminHeader.svelte';
  import { apiClient } from '$lib/utils/api';
  import { toast } from '$lib/utils/toast.svelte';

  let { data } = $props();
  let artwork = $derived(data.artwork);
  let content = $derived(data.artwork.artwork_translations[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let report = $derived.by(() => content?.verification_report as any);
  
  const EMPTY_PORTIONS: any[] = [];
  let portions = $derived(Array.isArray(content?.article_portions) ? content.article_portions : EMPTY_PORTIONS);
  let verifiedCount = $derived.by(() => {
    let count = 0;
    for (const p of portions) {
      if (p?.status?.toUpperCase() === 'VERIFIED') count++;
    }
    return count;
  });
  let totalPortionsCount = $derived(portions.length);

  let generating = $state(false);
  let checking = $state(false);
  let unvalidatingContent = $state(false);
  let deleting = $state(false);

  async function deleteArtwork() {
    const title = artwork.artwork_translations?.[0]?.title || artwork.slug || 'cette œuvre';
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement "${title}" ?\nCette action est irréversible.`)) {
      return;
    }
    deleting = true;
    try {
      const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/delete`);
      if (res.ok) {
        toast.success(`"${title}" supprimée avec succès`);
        await goto('/admin/artworks', { invalidateAll: true });
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur réseau lors de la suppression');
    } finally {
      deleting = false;
    }
  }

  async function unvalidateContent() {
    unvalidatingContent = true;
    try {
      const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/unvalidate`);
      if (res.ok) {
        await invalidateAll();
        toast.info("Statut de l'œuvre invalidé");
      } else {
        toast.error("Erreur lors de l'invalidation du contenu");
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      unvalidatingContent = false;
    }
  }

  async function generateContent() {
    if (content?.main_article && !confirm('Du contenu existe déjà. Voulez-vous vraiment le regénérer par IA ?')) return;
    generating = true;
    toast.info("Génération du contenu en cours...");
    try {
      const res = await apiClient.post(`/api/admin/artworks/${artwork.id}/generate`);
      if (res.ok) {
        await invalidateAll();
        toast.success("Contenu généré, lancement de la vérification...");
        factCheck().catch(console.error);
      } else {
        toast.error('Erreur lors de la génération');
      }
    } catch {
      toast.error('Erreur réseau lors de la génération');
    } finally {
      generating = false;
    }
  }

  async function factCheck() {
    checking = true;
    try {
      let hasError = false;
      
      const resPortions = await apiClient.post(`/api/admin/artworks/${artwork.id}/factcheck`);
      if (resPortions.ok) {
        await invalidateAll();
      } else {
        hasError = true;
      }

      const resIntro = await apiClient.post(`/api/admin/artworks/${artwork.id}/factcheck-intro`);
      if (resIntro.ok) {
        await invalidateAll();
      } else {
        hasError = true;
      }

      if (hasError) {
        toast.warning('Vérification globale partiellement échouée');
      } else {
        toast.success('Fact-checking global terminé');
      }

      await invalidateAll();
    } catch {
      toast.error('Erreur réseau lors du fact-checking');
    } finally {
      checking = false;
    }
  }
</script>

<div class="admin-detail-view">
  <AdminHeader {artwork} {generating} {checking} {deleting} {generateContent} {deleteArtwork} />

  <div class="mobile-flow">
    <!-- Visuals & Image -->
    <AdminImagePanel {artwork} />

    <!-- Metadata & Location -->
    <AdminMetadataPanel {artwork} />

    <!-- Global Status & Reliability Summary -->
    <div class="summary-card">
      <div class="summary-header">
        <span class="summary-label">Statut de vérification</span>
        {#if content?.verification_status}
          <div class="status-pill {content.verification_status.toLowerCase()}">
            {content.verification_status}
          </div>
        {/if}
      </div>

      {#if report?.global_score !== undefined && report?.global_score !== null}
        {@const score = report.global_score}
        <div class="score-row">
          <div class="score-pill {score >= 80 ? 'good' : score >= 50 ? 'average' : 'bad'}">
            <ShieldCheck size={16} weight="regular" />
            <span>Fiabilité : <strong>{score}%</strong></span>
          </div>
          {#if totalPortionsCount > 0}
            <span class="portions-ratio">
              <strong>{verifiedCount}</strong> / {totalPortionsCount} validées
            </span>
          {/if}
        </div>
      {/if}

      {#if content?.verification_status === 'VERIFIED'}
        <Button variant="ghost" size="sm" onclick={unvalidateContent} loading={unvalidatingContent} class="unvalidate-btn">
          Invalider tout le contenu
        </Button>
      {/if}
    </div>

    <!-- Editorial Content Section -->
    <section class="editorial-section">
      <div class="panel-header">
        <h2 class="panel-title">CONTENU & FACT-CHECKING</h2>
      </div>

      <AdminIntroPanel {artwork} {content} />
      <AdminPortionsPanel {artwork} {content} {checking} />
    </section>
  </div>
</div>

<style>
  .admin-detail-view {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-bottom: 5rem;
    width: 100%;
  }

  .mobile-flow {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }

  .summary-card {
    padding: 1rem 1.25rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .summary-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .score-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .portions-ratio {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }

  :global(.unvalidate-btn) {
    width: 100%;
    margin-top: 0.25rem;
  }

  .editorial-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 0.5rem;
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
    font-size: 1.05rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-primary);
    margin: 0;
  }

  .score-pill, .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.75rem;
    border-radius: var(--radius-pill);
    font-size: 0.72rem;
    font-weight: 700;
    font-family: var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border: 1px solid transparent;
  }

  .score-pill.good, .status-pill.verified {
    background: color-mix(in oklch, var(--color-success) 15%, transparent);
    color: var(--color-success);
    border-color: color-mix(in oklch, var(--color-success) 30%, transparent);
  }
  .score-pill.average, .status-pill.pending_validation {
    background: color-mix(in oklch, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
    border-color: color-mix(in oklch, var(--color-warning) 30%, transparent);
  }
  .score-pill.bad, .status-pill.false {
    background: color-mix(in oklch, var(--color-error) 15%, transparent);
    color: var(--color-error);
    border-color: color-mix(in oklch, var(--color-error) 30%, transparent);
  }
  .status-pill.pending {
    background: color-mix(in oklch, var(--color-text-secondary) 15%, transparent);
    color: var(--color-text-secondary);
    border-color: color-mix(in oklch, var(--color-text-secondary) 30%, transparent);
  }
</style>

