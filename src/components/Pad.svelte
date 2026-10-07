<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import PageFlip from './PageFlip.svelte'
  import Sketch from './Sketch.svelte'

  const REVEAL_DELAY = 310

  let { svg, label }: { svg: string; label: string } = $props()

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches

  let flips = $state<{ id: number; svg: string }[]>([])
  let mounted = $state(false)
  let shown = untrack(() => svg)
  let nextId = 0

  onMount(() => {
    mounted = true
  })

  $effect.pre(() => {
    const current = svg
    untrack(() => {
      if (current === shown) return
      if (!calm) flips = [...flips, { id: nextId++, svg: shown }]
      shown = current
    })
  })

  function finish(id: number) {
    flips = flips.filter((flip) => flip.id !== id)
  }
</script>

<div class="pad">
  <div class="sheet under deepest" aria-hidden="true"></div>
  <div class="sheet under deeper" aria-hidden="true"></div>
  <div class="sheet under" aria-hidden="true"></div>
  <div class="sheet top paper">
    {#key svg}
      <Sketch {svg} {label} delay={mounted && !calm ? REVEAL_DELAY : 0} />
    {/key}
  </div>
  {#each flips as flip (flip.id)}
    <PageFlip svg={flip.svg} onDone={() => finish(flip.id)} />
  {/each}
  <div class="coils" aria-hidden="true"></div>
</div>

<style>
  .pad {
    position: relative;
    isolation: isolate;
  }

  .sheet {
    border-radius: 4px 4px 10px 10px;
    box-shadow:
      0 1px 2px color-mix(in srgb, var(--shadow) 10%, transparent),
      0 14px 30px -16px color-mix(in srgb, var(--shadow) 40%, transparent);
  }

  .top {
    z-index: 5;
  }

  .under {
    position: absolute;
    inset: 0;
    z-index: 3;
    background: #fdfcfa;
    transform-origin: 50% 22px;
    transform: rotate(-1.1deg) translateY(3px);
  }

  .under.deeper {
    z-index: 2;
    background: #f9f7f4;
    transform: rotate(1.5deg) translateY(6px);
  }

  .under.deepest {
    z-index: 1;
    background: #f4f2ee;
    transform: rotate(-2.3deg) translate(-2px, 9px);
  }

  .coils {
    position: absolute;
    top: -12px;
    left: 22px;
    right: 22px;
    z-index: 10;
    height: 40px;
    background: linear-gradient(to bottom, color-mix(in oklch, var(--coil) 80%, white) 30%, var(--coil) 55%, var(--pastel-edge));
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='40'%3E%3Crect x='10.5' y='1' width='9' height='33' rx='4.5'/%3E%3C/svg%3E");
    mask-size: 30px 40px;
    mask-repeat: space no-repeat;
    pointer-events: none;
    transition: background 0.5s ease;
  }

  .coils::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgb(255 255 255 / 0.75);
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='40'%3E%3Crect x='12.6' y='4' width='2.6' height='13' rx='1.3'/%3E%3C/svg%3E");
    mask-size: 30px 40px;
    mask-repeat: space no-repeat;
  }
</style>
