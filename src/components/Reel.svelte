<script lang="ts">
  import { untrack } from 'svelte'

  const BLUR_STEPS = 7

  let { value, pool, spin, delay = 0, locked }: { value: string; pool: string[]; spin: number; delay?: number; locked: boolean } = $props()

  let seen = untrack(() => spin)
  let strip = $state<string[]>([])
  let landed = $state(0)

  function blurStrip(final: string): string[] {
    const others = pool.filter((name) => name !== final)
    const picks = Array.from({ length: BLUR_STEPS }, () => others[Math.floor(Math.random() * others.length)])
    return [...picks, final]
  }

  $effect(() => {
    const current = spin
    untrack(() => {
      if (current === seen) return
      seen = current
      if (!locked && pool.length > 1) strip = blurStrip(value)
    })
  })

  function stop() {
    strip = []
    landed++
  }
</script>

<span class="reel" class:spinning={strip.length > 0}>
  {#if strip.length > 0}
    <span class="strip" aria-hidden="true" style:--steps={strip.length - 1} style:--delay={`${delay}ms`} onanimationend={stop}>
      {#each strip as name, i (i)}
        <span>{name}</span>
      {/each}
    </span>
    <span class="sr">{value}</span>
  {:else}
    {#key `${value}|${landed}`}
      <span class="value">{value}</span>
    {/key}
  {/if}
</span>

<style>
  .reel {
    position: relative;
    display: block;
    flex: 1;
    min-width: 0;
    height: var(--reel-h, 1.5em);
    overflow: hidden;
    line-height: var(--reel-h, 1.5em);
  }

  .strip,
  .value {
    display: block;
  }

  .strip span,
  .value {
    display: block;
    height: var(--reel-h, 1.5em);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .strip {
    animation: spin 0.75s var(--delay) cubic-bezier(0.25, 0.8, 0.3, 1.18) both;
  }

  .value {
    animation: land 0.32s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  @keyframes spin {
    0% {
      transform: translateY(0);
      filter: blur(0);
    }
    40% {
      filter: blur(1.4px);
    }
    85% {
      filter: blur(0);
    }
    100% {
      transform: translateY(calc(var(--steps) * var(--reel-h, 1.5em) * -1));
    }
  }

  @keyframes land {
    from {
      transform: translateY(-35%);
    }
  }
</style>
