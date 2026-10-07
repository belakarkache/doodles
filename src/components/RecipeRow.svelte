<script lang="ts">
  import type { Snippet } from 'svelte'
  import { tr } from '../lib/i18n.svelte'
  import { ui } from '../lib/ui'
  import Icon from './Icon.svelte'

  let { label, locked, onToggle, slot, children }: { label: string; locked: boolean; onToggle: () => void; slot: Snippet; children?: Snippet } = $props()

  const action = $derived(`${tr(locked ? ui.unlock : ui.lock)}: ${label.toLowerCase()}`)

  let bumping = $state(false)

  function toggle() {
    bumping = true
    onToggle()
  }
</script>

<li class:locked>
  <h2>{label}</h2>
  <div class="line">
    <div class="slot-area">
      {@render slot()}
    </div>
    <button type="button" class="lock" class:bumping aria-pressed={locked} aria-label={action} title={action} onclick={toggle} onanimationend={() => (bumping = false)}>
      <Icon name="lock" open={!locked} />
    </button>
  </div>
  {@render children?.()}
</li>

<style>
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.4rem;
  }

  h2 {
    margin: 0;
    padding-left: 0.25rem;
    font-size: var(--step--1);
    font-weight: 600;
    color: var(--muted);
  }

  .line {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .slot-area {
    flex: 1;
    min-width: 0;
  }

  .lock {
    flex: none;
    display: grid;
    place-items: center;
    width: 3.3rem;
    height: 3.3rem;
    border: 2px solid var(--line);
    box-shadow: 0 3px 0 var(--line);
    border-radius: 16px;
    background: var(--paper);
    color: var(--muted);
    --icon-hole: var(--paper);
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease,
      border-color 0.3s ease,
      background-color 0.3s ease,
      color 0.3s ease;
  }

  .lock:hover {
    background: var(--tint);
  }

  .lock:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 var(--line);
  }

  .lock.bumping {
    animation: bump 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  .lock :global(svg) {
    width: 1.35rem;
    height: 1.35rem;
  }

  .locked .lock {
    border-color: var(--pastel-edge);
    box-shadow: 0 3px 0 var(--pastel-edge);
    background: var(--pastel);
    color: var(--deep);
    --icon-hole: var(--pastel);
  }

  .locked :global(.slot) {
    border-color: var(--pastel);
    box-shadow: 0 3px 0 var(--pastel);
    background-color: var(--tint);
  }

  @keyframes bump {
    35% {
      transform: scale(1.12) rotate(-8deg);
    }
    65% {
      transform: scale(0.95) rotate(4deg);
    }
  }
</style>
