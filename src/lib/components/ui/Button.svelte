<script lang="ts">
  import type { Snippet } from 'svelte';
  
  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    class: className = '',
    onclick,
    children,
    ...rest
  }: {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'full';
    loading?: boolean;
    disabled?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    [key: string]: any;
  } = $props();
</script>

<button
  class="ui-btn variant-{variant} size-{size} {className}"
  disabled={disabled || loading}
  {onclick}
  {...rest}
>
  {#if loading}
    <span class="loader"></span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>

<style>
  .ui-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    text-decoration: none;
  }
  
  .ui-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Sizes */
  .size-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
  .size-md {
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
  }
  .size-lg {
    padding: 1rem 1.5rem;
    font-size: 1.05rem;
  }
  .size-full {
    width: 100%;
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
  }

  /* Variants */
  .variant-primary {
    background: var(--color-primary, #007bff);
    color: white;
  }
  .variant-primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .variant-secondary {
    background: var(--color-surface-elevated, #f0f0f0);
    color: var(--color-text-primary, #333);
  }
  .variant-secondary:hover:not(:disabled) {
    background: var(--color-border, #e0e0e0);
  }

  .variant-danger {
    background: var(--color-danger, #ef4444);
    color: white;
  }
  .variant-danger:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .variant-outline {
    background: transparent;
    border: 1px solid var(--color-border, #ccc);
    color: var(--color-text-primary, #333);
  }
  .variant-outline:hover:not(:disabled) {
    background: var(--color-surface-elevated, #f9f9f9);
  }

  .variant-ghost {
    background: transparent;
    color: var(--color-text-primary, #333);
  }
  .variant-ghost:hover:not(:disabled) {
    background: var(--color-surface-elevated, #f0f0f0);
  }

  /* Loader */
  .loader {
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
