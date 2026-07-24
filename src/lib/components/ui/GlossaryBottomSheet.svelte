<script lang="ts">
  import { parseMarkdown } from '$lib/utils/markdown';

  let {
    isOpen = $bindable(false),
    title = '',
    subtitle = '',
    content = ''
  } = $props();

  function close() {
    isOpen = false;
  }

  let sheetRef = $state<HTMLElement | null>(null);
  let isDragging = false;
  let startY = 0;
  let currentY = 0;

  function onPointerDown(e: PointerEvent) {
    isDragging = true;
    startY = e.clientY;
    currentY = 0;
    if (sheetRef) sheetRef.style.transition = 'none';
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    if (deltaY > 0) {
      currentY = deltaY;
      if (sheetRef) sheetRef.style.transform = `translateY(${currentY}px)`;
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    
    if (sheetRef) {
      sheetRef.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1)';
      if (currentY > 100) {
        close();
        setTimeout(() => {
          if (sheetRef) sheetRef.style.transform = '';
          currentY = 0;
        }, 300);
      } else {
        sheetRef.style.transform = 'translateY(0)';
        currentY = 0;
      }
    }
  }
</script>

{#if isOpen}
  <div class="backdrop" onclick={close} onkeydown={(e) => e.key === 'Escape' && close()} role="button" tabindex="0" aria-label="Fermer la définition"></div>
  <div class="bottom-sheet" role="dialog" aria-labelledby="glossary-title" bind:this={sheetRef}>
    <div 
      class="drag-handle" 
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerUp}
      role="button" 
      tabindex="0" 
      aria-label="Fermer"
    >
      <div class="drag-bar"></div>
    </div>
    
    <div class="sheet-header">
      <div class="title-area">
        <div>
          <h2 id="glossary-title">{title}</h2>
          {#if subtitle}
            <span class="subtitle">{subtitle}</span>
          {/if}
        </div>
      </div>
    </div>

    <div class="sheet-content rich-text">
      {#if content}
        {@html parseMarkdown(content)}
      {:else}
        <p class="empty-content">Définition non disponible.</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 2000;
    animation: fadeIn 0.3s ease;
  }

  .bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--color-surface);
    border-radius: 24px 24px 0 0;
    padding: 1rem 1.5rem 3rem;
    z-index: 2001;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.15);
    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
    max-height: 80vh;
    overflow-y: auto;
    max-width: 600px;
    margin: 0 auto;
  }

  .drag-handle {
    display: flex;
    justify-content: center;
    padding: 0.5rem 0 1.5rem;
    cursor: grab;
    touch-action: none;
  }
  
  .drag-handle:active {
    cursor: grabbing;
  }

  .drag-bar {
    width: 48px;
    height: 5px;
    background-color: var(--color-border);
    border-radius: 4px;
  }

  .sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .title-area {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .sheet-header h2 {
    font-family: 'Instrument Serif', serif;
    font-size: 2rem;
    font-weight: 400;
    margin: 0;
    color: var(--color-text-primary);
    line-height: 1.1;
  }

  .subtitle {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
  }


  .sheet-content {
    color: var(--color-text-secondary);
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .empty-content {
    font-style: italic;
    color: var(--color-text-muted);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  @media (min-width: 601px) {
    .bottom-sheet {
      bottom: 2rem;
      border-radius: 24px;
    }
  }
</style>
