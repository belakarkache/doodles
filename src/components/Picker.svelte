<script lang="ts" generics="T extends { id: string }">
  import type { Snippet } from 'svelte'
  import { scale } from 'svelte/transition'
  import { backOut } from 'svelte/easing'
  import { MediaQuery, SvelteSet } from 'svelte/reactivity'
  import Icon from './Icon.svelte'

  let {
    label,
    items,
    selected,
    randomLabel,
    columns = 1,
    active = true,
    railCount = columns + 0.5,
    current,
    option,
    onPick,
  }: {
    label: string
    items: T[]
    selected: string | null
    randomLabel: string
    columns?: number
    active?: boolean
    railCount?: number
    current: Snippet
    option: Snippet<[T, boolean]>
    onPick: (id: string | null) => void
  } = $props()

  let open = $state(false)
  let root: HTMLDivElement | undefined = $state()
  let list: HTMLDivElement | undefined = $state()

  const compact = new MediaQuery('max-width: 899px')
  const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce')
  const inView = new SvelteSet<string>()

  $effect(() => {
    if (!list || !compact.current) return
    const rail = list
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.id
          if (!id) continue
          if (entry.isIntersecting) inView.add(id)
          else inView.delete(id)
        }
      },
      { root: rail, rootMargin: '0px 50%' },
    )
    for (const element of rail.querySelectorAll('[data-id]')) observer.observe(element)
    return () => {
      observer.disconnect()
      inView.clear()
    }
  })

  $effect(() => {
    if (!list || !compact.current || !active) return
    selected
    const target = list.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!target) return
    const start = target.offsetLeft
    const end = start + target.offsetWidth
    const visible = start >= list.scrollLeft && end <= list.scrollLeft + list.clientWidth
    if (!visible) list.scrollTo({ left: start - (list.clientWidth - target.offsetWidth) / 2, behavior: reducedMotion.current ? 'instant' : 'smooth' })
  })

  function toggle() {
    open = !open
    if (open) requestAnimationFrame(focusSelected)
  }

  function focusSelected() {
    const selectedOption = list?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? list?.querySelector<HTMLButtonElement>('button')
    selectedOption?.focus()
  }

  function pick(id: string | null) {
    onPick(id)
    open = false
    root?.querySelector<HTMLButtonElement>('.trigger')?.focus()
  }

  function onWindowPointer(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) open = false
  }

  function onKeydown(event: KeyboardEvent) {
    if (!open && !compact.current) return
    if (event.key === 'Escape') {
      event.preventDefault()
      open = false
      root?.querySelector<HTMLButtonElement>('.trigger')?.focus()
      return
    }
    const options = [...(list?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    const index = options.indexOf(document.activeElement as HTMLButtonElement)
    const row = compact.current ? 1 : columns
    const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: row, ArrowUp: -row }
    const step = steps[event.key]
    if (step === undefined || index < 0) return
    event.preventDefault()
    options[Math.max(0, Math.min(options.length - 1, index + step))]?.focus()
  }
</script>

<svelte:window onpointerdown={onWindowPointer} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="picker" bind:this={root} onkeydown={onKeydown}>
  {#if compact.current}
    <div class="rail" role="listbox" aria-label={label} bind:this={list} style:--rail-count={railCount}>
      <button class="option random" type="button" role="option" aria-selected={selected === null} style:--i={0} onclick={() => onPick(null)}>
        <span class="random-badge"><Icon name="shuffle" /></span>
        <span class="option-label">{randomLabel}</span>
      </button>
      {#each items as item, i (item.id)}
        <button class="option" type="button" role="option" data-id={item.id} aria-selected={selected === item.id} style:--i={i + 1} onclick={() => onPick(item.id)}>
          {@render option(item, active && inView.has(item.id))}
          {#if selected === item.id}
            <span class="tick"><Icon name="check" /></span>
          {/if}
        </button>
      {/each}
    </div>
  {:else}
    <button class="trigger slot" type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onclick={toggle}>
      <span class="current">{@render current()}</span>
      <span class="chevron" class:flipped={open}><Icon name="chevron" /></span>
    </button>

    {#if open}
      <div class="panel" role="listbox" aria-label={label} bind:this={list} style:--columns={columns} transition:scale={{ start: 0.9, duration: 220, easing: backOut }}>
        <button class="option random" type="button" role="option" aria-selected={selected === null} style:--i={0} onclick={() => pick(null)}>
          <span class="random-badge"><Icon name="shuffle" /></span>
          <span>{randomLabel}</span>
        </button>
        {#each items as item, i (item.id)}
          <button class="option" type="button" role="option" aria-selected={selected === item.id} style:--i={i + 1} onclick={() => pick(item.id)}>
            {@render option(item, true)}
            {#if selected === item.id}
              <span class="tick"><Icon name="check" /></span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .picker {
    position: relative;
  }

  .trigger {
    width: 100%;
    text-align: left;
  }

  .trigger:hover,
  .trigger[aria-expanded='true'] {
    border-color: var(--pastel);
  }

  .trigger:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 var(--line);
  }

  .current {
    display: flex;
    flex: 1;
    min-width: 0;
  }

  .chevron {
    display: grid;
    flex: none;
    width: 1.7rem;
    height: 1.7rem;
    place-items: center;
    border-radius: 50%;
    background: var(--tint);
    color: var(--deep);
    transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  .chevron :global(svg) {
    width: 0.95rem;
    height: 0.95rem;
  }

  .chevron.flipped {
    transform: rotate(180deg);
  }

  .panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    z-index: 20;
    display: grid;
    grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
    gap: 0.6rem;
    width: min(30rem, calc(100vw - 2.5rem));
    max-height: min(26rem, 60vh);
    overflow-y: auto;
    padding: 0.75rem;
    border: 2px solid var(--line);
    border-radius: 24px;
    background: var(--paper);
    box-shadow: 0 20px 44px -18px color-mix(in srgb, var(--shadow) 45%, transparent);
    transform-origin: 2rem top;
    overscroll-behavior: contain;
  }

  .rail {
    position: relative;
    display: flex;
    align-items: stretch;
    gap: 0.6rem;
    margin: 0 -0.25rem;
    padding: 0.7rem 0.25rem 0.8rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    scroll-padding-inline: 0.25rem;
    scrollbar-width: none;
    mask-image: linear-gradient(to right, #000 calc(100% - 1.5rem), transparent);
    --card: calc((100% - 0.5rem - (var(--rail-count) - 0.5) * 0.6rem) / var(--rail-count));
  }

  .rail::-webkit-scrollbar {
    display: none;
  }

  .rail .option {
    flex: 0 0 var(--card);
    min-width: 0;
    scroll-snap-align: start;
  }

  .rail .random {
    flex-direction: column;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.45rem;
    text-align: center;
  }

  .rail .random-badge {
    width: 2.2rem;
    height: 2.2rem;
  }

  .option-label {
    font-size: var(--step--1);
    line-height: 1.15;
  }

  .option {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.35rem;
    padding: 0.45rem;
    border: 2px solid var(--line);
    box-shadow: 0 3px 0 var(--line);
    border-radius: 16px;
    background: var(--paper);
    text-align: left;
    font-weight: 500;
    color: var(--text);
    animation: option-in 0.32s calc(var(--i) * 18ms) cubic-bezier(0.3, 1.4, 0.5, 1) backwards;
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease,
      border-color 0.2s ease,
      background-color 0.2s ease;
  }

  .option:hover,
  .option:focus-visible {
    border-color: var(--pastel);
    background: color-mix(in oklch, var(--tint) 50%, white);
  }

  .option:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 var(--line);
  }

  .option[aria-selected='true'] {
    border-color: var(--pastel-edge);
    box-shadow: 0 3px 0 var(--pastel-edge);
    background: var(--tint);
  }

  .random {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.7rem;
    font-weight: 600;
  }

  .random-badge {
    display: grid;
    width: 2.1rem;
    height: 2.1rem;
    place-items: center;
    border-radius: 12px;
    background: var(--second-pastel);
    color: var(--deep);
  }

  .random-badge :global(svg) {
    width: 1.15rem;
    height: 1.15rem;
  }

  .random:hover .random-badge {
    animation: spin 0.6s cubic-bezier(0.3, 1.4, 0.5, 1);
  }

  .tick {
    position: absolute;
    top: -0.55rem;
    right: -0.55rem;
    display: grid;
    width: 1.6rem;
    height: 1.6rem;
    place-items: center;
    border: 2px solid var(--paper);
    border-radius: 50%;
    background: var(--pastel-edge);
    color: var(--paper);
    animation: pop 0.35s cubic-bezier(0.3, 1.8, 0.5, 1);
  }

  .tick :global(svg) {
    width: 0.9rem;
    height: 0.9rem;
  }

  @keyframes option-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.94);
    }
  }

  @keyframes pop {
    from {
      transform: scale(0);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
