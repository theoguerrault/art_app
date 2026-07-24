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
    background: var(--color-primary, #FA47FF);
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .variant-primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-primary, #FA47FF) 85%, black);
  }

  .variant-secondary,
  .variant-outline {
    background: #27272A;
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .variant-secondary:hover:not(:disabled),
  .variant-outline:hover:not(:disabled) {
    background: #3F3F46;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .variant-danger {
    background: #EF4444;
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .variant-danger:hover:not(:disabled) {
    background: #DC2626;
  }

  .variant-ghost {
    background: transparent;
    color: #FFFFFF;
  }
  .variant-ghost:hover:not(:disabled) {
    background: #27272A;
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
