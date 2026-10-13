<script lang="ts">
  import { fade } from 'svelte/transition'
  import Icon from './components/Icon.svelte'
  import WhyTip from './components/WhyTip.svelte'
  import Logo from './components/Logo.svelte'
  import Markers from './components/Markers.svelte'
  import Pad from './components/Pad.svelte'
  import Picker from './components/Picker.svelte'
  import RecipeRow from './components/RecipeRow.svelte'
  import Reel from './components/Reel.svelte'
  import { inkedIn, pensFor, renderArt } from './lib/art'
  import { styles, type StyleId } from './lib/data/catalog'
  import { paletteThemes, type PaletteTheme } from './lib/data/palettes'
  import { combine } from './lib/generator'
  import { paletteFrom } from './lib/palette'
  import { rngFor } from './lib/random'
  import { locale, setLang, tr } from './lib/i18n.svelte'
  import { app, choosePalette, chooseStyle, roll, setOutlines, toggleLock } from './lib/store.svelte'
  import { MediaQuery } from 'svelte/reactivity'
  import { resolveColor, themeFor } from './lib/theme'
  import { categoryLabels, ui } from './lib/ui'

  setLang(locale.lang)

  const combo = $derived(combine(app.seeds, app.style, app.palette))
  const pens = $derived(pensFor(combo, app.outlines))
  const outlineModes = [
    { mode: 'ink', label: ui.outlineInk },
    { mode: 'color', label: ui.outlineColor },
    { mode: 'none', label: ui.outlineNone },
  ] as const
  const outlineIndex = $derived(outlineModes.findIndex((option) => option.mode === app.outlines))
  const styleNames = $derived(styles.map((style) => tr(style.name)))
  const paletteNames = $derived(paletteThemes.map((theme) => tr(theme.name)))
  const theme = $derived(themeFor(pens.colors))

  const art = $derived(renderArt(combo, app.outlines))
  const separateLine = $derived(!pens.blackPen && !pens.colors.includes(pens.line))
  const inked = $derived(inkedIn(art))
  const markers = $derived((separateLine ? [pens.line, ...pens.colors, pens.background] : [...pens.colors, pens.background]).filter(inked))
  const blackPen = $derived(pens.blackPen && inked(pens.line))
  const artLabel = $derived(combo.motif ? `${tr(combo.style.name)}, ${tr(combo.motif.name)}` : tr(combo.style.name))

  $effect(() => {
    const root = document.documentElement.style
    root.setProperty('--accent', theme.accent)
    root.setProperty('--second', theme.second)
    const background = getComputedStyle(document.documentElement).getPropertyValue('--bg')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolveColor(background, '#fffbf6'))
  })

  let previews = new Map<StyleId, string>()
  let previewsKey = ''

  function preview(style: StyleId): string {
    const key = `${combo.palette.theme.id}|${combo.seeds.colors}|${app.outlines}`
    if (key !== previewsKey) {
      previews = new Map()
      previewsKey = key
    }
    const cached = previews.get(style)
    if (cached) return cached
    const svg = renderArt(combine({ ...combo.seeds, layout: 424242, motif: 7 }, style, combo.palette.theme.id), app.outlines)
    previews.set(style, svg)
    return svg
  }

  const swatchesById = new Map(
    paletteThemes.map((theme) => {
      const sample = paletteFrom(theme, rngFor(0, 5))
      return [theme.id, [sample.line, ...sample.colors, sample.background]]
    }),
  )

  const swatchesOf = (theme: PaletteTheme) => swatchesById.get(theme.id) ?? []

  let squeezing = $state(false)
  let spins = $state(0)

  function doRoll() {
    roll()
    spins++
    squeezing = true
  }

  const compact = new MediaQuery('max-width: 899px')
  let drawerOpen = $state(false)
  const drawerHidden = $derived(compact.current && !drawerOpen)
  let drawerSettled = $state(false)

  $effect.pre(() => {
    drawerOpen
    drawerSettled = false
  })

  function onDrawerTransitionEnd(event: TransitionEvent) {
    if (event.target === event.currentTarget && event.propertyName === 'grid-template-rows') drawerSettled = drawerOpen
  }

  $effect(() => {
    if (!compact.current) drawerOpen = false
  })

  let swipeStart: number | null = null
  let swiped = false

  function onHandleDown(event: PointerEvent) {
    swipeStart = event.clientY
    swiped = false
  }

  function onHandleUp(event: PointerEvent) {
    if (swipeStart === null) return
    const delta = event.clientY - swipeStart
    swipeStart = null
    if (Math.abs(delta) < 24) return
    swiped = true
    drawerOpen = delta < 0
  }

  function onHandleClick() {
    if (swiped) {
      swiped = false
      return
    }
    drawerOpen = !drawerOpen
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && drawerOpen && !event.defaultPrevented) {
      drawerOpen = false
      return
    }
    const target = event.target as HTMLElement
    if (event.code !== 'Space' || target.closest('button, input, a, textarea, [role="listbox"]')) return
    event.preventDefault()
    doRoll()
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="app">
  <header>
    <h1><Logo colors={pens.colors} hop={spins} /></h1>
    <div class="lang" role="group" aria-label="Idioma / Language" class:en={locale.lang === 'en'}>
      <span class="lang-thumb" aria-hidden="true"></span>
      <button type="button" aria-pressed={locale.lang === 'pt'} onclick={() => setLang('pt')}>PT</button>
      <button type="button" aria-pressed={locale.lang === 'en'} onclick={() => setLang('en')}>EN</button>
    </div>
  </header>

  <main>
    <div class="side">
      <section class="recipe" class:open={drawerOpen} class:settled={drawerSettled} aria-label={tr(ui.recipe)}>
        <button
          class="handle"
          type="button"
          aria-expanded={drawerOpen}
          aria-controls="recipe-options"
          onpointerdown={onHandleDown}
          onpointerup={onHandleUp}
          onpointercancel={() => (swipeStart = null)}
          onclick={onHandleClick}
        >
          <span class="grabber" aria-hidden="true"></span>
          <span class="handle-text">
            <span class="handle-label">{tr(ui.options)}</span>
            <span class="handle-summary">{tr(combo.style.name)} · {tr(combo.palette.theme.name)}</span>
          </span>
          <span class="handle-chevron" aria-hidden="true"><Icon name="chevron" /></span>
        </button>

        <div class="drawer" id="recipe-options" inert={drawerHidden} ontransitionend={onDrawerTransitionEnd}>
          <div class="drawer-inner">
            <ul class="rows">
              <RecipeRow label={tr(categoryLabels.style)} locked={app.locked.has('style')} onToggle={() => toggleLock('style')}>
                {#snippet slot()}
                  <Picker label={tr(ui.chooseStyle)} items={styles} selected={app.style} randomLabel={tr(ui.randomStyle)} columns={3} active={!drawerHidden} onPick={(id) => chooseStyle(id as StyleId | null)}>
                    {#snippet current()}
                      <Reel value={tr(combo.style.name)} pool={styleNames} spin={spins} locked={app.locked.has('style')} />
                    {/snippet}
                    {#snippet option(style, visible)}
                      <span class="thumb">
                        {#if visible}{@html preview(style.id)}{/if}
                      </span>
                      <span class="option-name">{tr(style.name)}</span>
                    {/snippet}
                  </Picker>
                {/snippet}
              </RecipeRow>
              <RecipeRow label={tr(categoryLabels.palette)} locked={app.locked.has('palette')} onToggle={() => toggleLock('palette')}>
                {#snippet slot()}
                  <Picker label={tr(ui.choosePalette)} items={paletteThemes} selected={app.palette} randomLabel={tr(ui.randomPalette)} columns={2} active={!drawerHidden} onPick={choosePalette}>
                    {#snippet current()}
                      <Reel value={tr(combo.palette.theme.name)} pool={paletteNames} spin={spins} delay={220} locked={app.locked.has('palette')} />
                    {/snippet}
                    {#snippet option(palette)}
                      <span class="option-name">{tr(palette.name)}</span>
                      <span class="mini-swatches">
                        {#each swatchesOf(palette) as color, i (i)}
                          <span style:background={color}></span>
                        {/each}
                      </span>
                    {/snippet}
                  </Picker>
                {/snippet}
              </RecipeRow>
            </ul>

            <div class="outline-switch">
              <span class="outline-label" id="outline-label">{tr(ui.outlines)}</span>
              <div class="toggle" role="group" aria-labelledby="outline-label" style:--choice={outlineIndex}>
                <span class="toggle-thumb" aria-hidden="true"></span>
                {#each outlineModes as option (option.mode)}
                  <button type="button" aria-pressed={app.outlines === option.mode} onclick={() => setOutlines(option.mode)}>{tr(option.label)}</button>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <div class="roll-bar">
          <button class="roll" class:squeezing type="button" onclick={doRoll} onanimationend={() => (squeezing = false)}>
            <span class="die"><Icon name="die" /></span>
            <span>{tr(app.locked.size > 0 ? ui.rollRest : ui.roll)}</span>
          </button>
          <p class="roll-hint">
            {tr(ui.pressKey)} <kbd>{tr(ui.spaceKey)}</kbd>
          </p>
        </div>
      </section>

      <div class="pens">
        <Markers colors={markers} {blackPen} />
      </div>
    </div>

    {#if drawerOpen}
      <button class="backdrop" type="button" aria-label={tr(ui.closeOptions)} tabindex="-1" onclick={() => (drawerOpen = false)} transition:fade={{ duration: 200 }}></button>
    {/if}

    <section class="stage" aria-label={tr(ui.sketchNote)}>
      <Pad svg={art} label={artLabel} />
    </section>
  </main>

  <footer class="credit">
    {tr(ui.developedBy)} <a href="https://icka.dev" target="_blank" rel="noopener">icka.dev</a>
    <WhyTip />
  </footer>
</div>

<style>
  .app {
    --pad-w: clamp(320px, min(46vw, (100svh - 210px) * 0.72), 540px);
    display: grid;
    place-content: center;
    min-height: 100svh;
    padding: clamp(1rem, 3vh, 2rem) clamp(16px, 3vw, 2.4rem);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin: 0 0 clamp(0.8rem, 2.5vw, 1.6rem);
  }

  h1 {
    margin: 0;
    line-height: 1;
  }

  .lang {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 4px;
    border-radius: 999px;
    background: var(--tint);
  }

  .lang-thumb {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 4px;
    width: calc(50% - 4px);
    border-radius: 999px;
    background: var(--paper);
    box-shadow: 0 2px 0 var(--line-edge);
    transition: transform 0.35s cubic-bezier(0.3, 1.4, 0.5, 1);
  }

  .lang.en .lang-thumb {
    transform: translateX(100%);
  }

  .lang button {
    position: relative;
    padding: 0.2rem 0.9rem;
    border: none;
    background: none;
    font-weight: 600;
    color: var(--muted);
    transition: color 0.3s ease;
  }

  .lang button[aria-pressed='true'] {
    color: var(--deep);
  }

  main {
    display: grid;
    grid-template-columns: minmax(0, 380px) var(--pad-w);
    justify-content: center;
    align-items: start;
    gap: clamp(2rem, 5vw, 4.5rem);
  }

  .side {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    align-self: stretch;
  }

  .recipe {
    display: flex;
    flex-direction: column;
    gap: 1.3rem;
    padding: 1.6rem;
    border: 2px solid var(--line);
    border-radius: 28px;
    background: var(--paper);
    box-shadow: 0 4px 0 var(--line);
  }

  .handle,
  .backdrop {
    display: none;
  }

  .drawer,
  .drawer-inner {
    display: contents;
  }

  .stage {
    padding-top: 14px;
  }

  .pens {
    flex: 1;
    min-height: 0;
    display: grid;
    align-items: center;
    container-type: size;
    --marker-w: min(36px, 2.7vw, 16cqh);
  }

  .rows {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.1rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .thumb {
    display: block;
    overflow: hidden;
    border-radius: 10px;
    aspect-ratio: 3 / 4;
    background: #fff;
  }

  .thumb :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .option-name {
    font-size: var(--step--1);
    line-height: 1.15;
  }

  .mini-swatches {
    display: flex;
    gap: 4px;
  }

  .mini-swatches span {
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1.5px rgb(0 0 0 / 0.08);
  }

  .outline-switch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .outline-label {
    padding-left: 0.25rem;
    font-size: var(--step--1);
    font-weight: 600;
    color: var(--muted);
  }

  .toggle {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 4px;
    border-radius: 999px;
    background: var(--tint);
  }

  .toggle-thumb {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 4px;
    width: calc((100% - 8px) / 3);
    border-radius: 999px;
    background: var(--paper);
    box-shadow: 0 2px 0 var(--line-edge);
    transform: translateX(calc(var(--choice) * 100%));
    transition: transform 0.35s cubic-bezier(0.3, 1.4, 0.5, 1);
  }

  .toggle button {
    position: relative;
    min-width: 4rem;
    padding: 0.25rem 0.6rem;
    border: none;
    background: none;
    font-weight: 600;
    color: var(--muted);
    transition: color 0.3s ease;
  }

  .toggle button[aria-pressed='true'] {
    color: var(--deep);
  }

  .roll-bar {
    display: grid;
    justify-items: center;
    gap: 0.6rem;
    padding-top: 0.3rem;
  }

  .roll {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    width: 100%;
    padding: 0.85rem 1.4rem;
    border: none;
    border-radius: 18px;
    background: var(--pastel);
    color: var(--deep);
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    box-shadow: 0 5px 0 var(--pastel-edge);
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease,
      background-color 0.5s ease,
      filter 0.2s ease;
  }

  .roll:hover {
    filter: brightness(1.04) saturate(1.08);
  }

  .roll:active {
    transform: translateY(5px);
    box-shadow: 0 0 0 var(--pastel-edge);
  }

  .roll.squeezing {
    animation: squeeze 0.5s cubic-bezier(0.3, 1.4, 0.5, 1);
  }

  .roll.squeezing .die {
    animation: tumble 0.55s cubic-bezier(0.3, 1.4, 0.5, 1);
  }

  .die {
    display: inline-grid;
    --icon-fill: var(--paper);
  }

  .die :global(svg) {
    width: 1.7rem;
    height: 1.7rem;
  }

  .roll-hint {
    margin: 0;
    font-size: var(--step--1);
    color: var(--muted);
    text-align: center;
  }

  kbd {
    display: inline-block;
    padding: 0 0.5rem;
    border: 2px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    box-shadow: 0 2px 0 var(--line);
    font: inherit;
    font-weight: 600;
    color: var(--text);
  }

  @keyframes squeeze {
    25% {
      transform: translateY(3px) scale(1.03, 0.94);
    }
    55% {
      transform: scale(0.99, 1.03);
    }
  }

  @keyframes tumble {
    from {
      transform: rotate(-260deg) scale(0.6);
    }
  }

  .credit {
    position: relative;
    margin-top: clamp(2.5rem, 6vh, 4rem);
    text-align: center;
    font-size: var(--step--1);
    color: var(--muted);
  }

  .credit a {
    font-weight: 600;
    color: var(--deep);
    text-decoration-line: underline;
    text-decoration-style: wavy;
    text-decoration-color: var(--pastel-edge);
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
    transition: text-decoration-color 0.2s ease;
  }

  .credit a:hover {
    text-decoration-color: var(--deep);
  }

  @media (max-width: 899px) {
    .app {
      display: block;
      min-height: 0;
      max-width: 520px;
      margin: 0 auto;
      padding-top: max(clamp(1rem, 3vh, 2rem), env(safe-area-inset-top));
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
      padding-bottom: calc(11rem + env(safe-area-inset-bottom));
    }

    main {
      grid-template-columns: minmax(0, 1fr);
      gap: 2rem;
    }

    .stage {
      order: -1;
      padding: 14px 4px 0;
    }

    .side {
      gap: 2rem;
    }

    .pens {
      order: -1;
      flex: none;
      container-type: normal;
      --marker-w: clamp(24px, 6vw, 32px);
    }

    .recipe {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 30;
      gap: 0;
      max-width: 520px;
      margin: 0 auto;
      padding: 0 max(16px, env(safe-area-inset-right)) calc(14px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
      border-bottom: none;
      border-radius: 28px 28px 0 0;
      box-shadow: 0 -12px 32px -18px color-mix(in srgb, var(--shadow) 45%, transparent);
    }

    .handle {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.7rem;
      width: 100%;
      padding: 1.1rem 0.25rem 0.75rem;
      border: none;
      background: none;
      text-align: left;
      touch-action: none;
    }

    .grabber {
      position: absolute;
      top: 0.45rem;
      left: 50%;
      width: 2.6rem;
      height: 5px;
      border-radius: 999px;
      background: var(--line-edge);
      transform: translateX(-50%);
    }

    .handle-text {
      display: grid;
      flex: 1;
      min-width: 0;
      line-height: 1.2;
    }

    .handle-label {
      font-size: var(--step--1);
      font-weight: 600;
      color: var(--muted);
    }

    .handle-summary {
      overflow: hidden;
      font-weight: 600;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .handle-chevron {
      display: grid;
      flex: none;
      width: 2rem;
      height: 2rem;
      place-items: center;
      border-radius: 50%;
      background: var(--tint);
      color: var(--deep);
      transform: rotate(180deg);
      transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
    }

    .handle-chevron :global(svg) {
      width: 1rem;
      height: 1rem;
    }

    .open .handle-chevron {
      transform: none;
    }

    .drawer {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.35s cubic-bezier(0.3, 1, 0.4, 1);
    }

    .open .drawer {
      grid-template-rows: 1fr;
    }

    .drawer-inner {
      display: flex;
      flex-direction: column;
      gap: 1.3rem;
      min-height: 0;
      max-height: calc(100dvh - 15rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
      margin: 0 -6px;
      padding: 0 6px;
      overflow: hidden;
      overscroll-behavior: contain;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .open .drawer-inner {
      padding: 0.3rem 6px 1.3rem;
      opacity: 1;
    }

    .open.settled .drawer-inner {
      overflow-y: auto;
    }

    .roll-bar {
      padding: 0;
    }

    .option-name {
      overflow-wrap: break-word;
      hyphens: auto;
    }

    .mini-swatches {
      flex-wrap: wrap;
    }

    .thumb {
      aspect-ratio: 1;
    }

    .thumb + .option-name {
      overflow: hidden;
      font-size: 0.8rem;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 25;
      display: block;
      padding: 0;
      border: none;
      background: color-mix(in srgb, var(--shadow) 28%, transparent);
      cursor: default;
      touch-action: none;
    }

    .roll-hint {
      display: none;
    }
  }
</style>
