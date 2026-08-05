<script lang="ts">
  import { page } from '$app/stores';
  let { children } = $props();
</script>

<div class="admin-layout">
  <aside class="admin-sidebar">
    <nav class="sidebar-nav">
      <a data-sveltekit-preload-data="hover" href="/admin/artworks" data-sveltekit-prefetch class="nav-item" class:active={$page.url.pathname.startsWith('/admin/artworks')}>
        <span>Œuvres</span>
      </a>
      <a data-sveltekit-preload-data="hover" href="/admin/artists" data-sveltekit-prefetch class="nav-item" class:active={$page.url.pathname.startsWith('/admin/artists')}>
        <span>Artists</span>
      </a>
      <a data-sveltekit-preload-data="hover" href="/admin/movements" data-sveltekit-prefetch class="nav-item" class:active={$page.url.pathname.startsWith('/admin/movements')}>
        <span>Mouvements</span>
      </a>
    </nav>
  </aside>

  <main class="admin-content">
    {@render children()}
  </main>
</div>

<style>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background-color: var(--color-bg);
  }

  .admin-sidebar {
    width: 250px;
    background-color: var(--color-surface);
    border-right: 1px solid var(--color-border-subtle);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    padding: 1rem 0;
    gap: 0.5rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    color: #FFFFFF;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .nav-item:hover {
    background-color: var(--color-bg);
    color: #FFFFFF;
  }

  .nav-item.active {
    background-color: color-mix(in oklch, var(--color-primary) 15%, transparent);
    color: var(--color-primary);
    border-right: 3px solid var(--color-primary);
  }

  .admin-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem;
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
  }

  @media (max-width: 768px) {
    .admin-layout {
      flex-direction: column;
    }
    
    .admin-sidebar {
      width: 100%;
      height: auto;
      position: static;
      border-right: none;
      border-bottom: 1px solid var(--color-border-subtle);
    }
    
    .sidebar-nav {
      flex-direction: row;
      justify-content: space-around;
      padding: 0.5rem;
    }
    
    .nav-item {
      padding: 0.5rem;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8rem;
    }
    
    .nav-item.active {
      border-right: none;
      border-bottom: 3px solid var(--color-primary);
      background: none;
    }
    
    .admin-content {
      padding: 1rem 1.25rem;
    }
  }
</style>
