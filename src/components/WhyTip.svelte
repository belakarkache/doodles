<script lang="ts">
  import { tr } from '../lib/i18n.svelte'
  import { ui } from '../lib/ui'
  import Icon from './Icon.svelte'

  let open = $state(false)
  let root: HTMLSpanElement | undefined = $state()

  function onWindowPointer(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) open = false
  }

  function onKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') open = false
  }
</script>

<svelte:window onpointerdown={onWindowPointer} onkeydown={onKeydown} />

<span class="separator" aria-hidden="true">•</span>
<span class="why" class:open bind:this={root}>
  <button type="button" aria-label={tr(ui.whyTitle)} aria-describedby="why-tip" aria-expanded={open} onclick={() => (open = !open)}>
    <Icon name="heart" />
  </button>
  <span class="tip" id="why-tip" role="tooltip">
    <strong>{tr(ui.whyTitle)}</strong>
    <span>{tr(ui.whyText)}</span>
    <span>{tr(ui.whyHope)}</span>
    <span class="love"><Icon name="heart" /></span>
  </span>
</span>

<style>
  .separator {
    margin: 0 0.15rem;
  }

  .why {
    position: relative;
    display: inline-flex;
    vertical-align: middle;
  }

  button {
    display: grid;
    place-items: center;
    width: 1.3rem;
    height: 1.3rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--second);
    transition:
      transform 0.25s cubic-bezier(0.3, 1.6, 0.5, 1),
      color 0.2s ease;
  }

  button :global(svg) {
    width: 0.75rem;
    height: 0.75rem;
  }

  .open button,
  button:focus-visible {
    transform: scale(1.2);
    color: color-mix(in oklch, var(--second) 75%, #2c2838);
  }

  .tip {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    z-index: 40;
    display: grid;
    gap: 0.35rem;
    width: min(18rem, calc(100vw - 32px));
    padding: 0.9rem 1rem;
    border: 2px solid var(--line);
    border-radius: 18px;
    background: var(--paper);
    box-shadow: 0 4px 0 var(--line);
    color: var(--text);
    font-size: var(--step--1);
    line-height: 1.4;
    text-align: left;
    opacity: 0;
    visibility: hidden;
    transform: translate(-50%, 6px) scale(0.96);
    transform-origin: 50% 100%;
    transition:
      opacity 0.2s ease,
      transform 0.25s cubic-bezier(0.3, 1.4, 0.5, 1),
      visibility 0.2s;
  }

  .love {
    justify-self: center;
    color: #e5484d;
  }

  .love :global(svg) {
    width: 1rem;
    height: 1rem;
  }

  .tip strong {
    color: var(--deep);
  }

  .why:has(button:focus-visible) .tip,
  .open .tip {
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, 0) scale(1);
  }

  @media (hover: hover) {
    button:hover {
      transform: scale(1.2);
      color: color-mix(in oklch, var(--second) 75%, #2c2838);
    }

    .why:hover .tip {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, 0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    button,
    .tip {
      transition: opacity 0.2s ease;
    }
  }
</style>
