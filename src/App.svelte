<script lang="ts">
  import Icon from './components/Icon.svelte'
  import WhyTip from './components/WhyTip.svelte'
  import Logo from './components/Logo.svelte'
  import Markers from './components/Markers.svelte'
  import Pad from './components/Pad.svelte'
  import Picker from './components/Picker.svelte'
  import RecipeRow from './components/RecipeRow.svelte'
  import Reel from './components/Reel.svelte'
  import { pensFor, renderArt } from './lib/art'
  import { styles, type StyleId } from './lib/data/catalog'
  import { paletteThemes, type PaletteTheme } from './lib/data/palettes'
  import { combine } from './lib/generator'
  import { paletteFrom } from './lib/palette'
  import { rngFor } from './lib/random'
  import { locale, setLang, tr } from './lib/i18n.svelte'
  import { app, choosePalette, chooseStyle, roll, setOutlines, toggleLock } from './lib/store.svelte'
  import { resolveColor, themeFor } from './lib/theme'
  import { categoryLabels, ui } from './lib/ui'

  setLang(locale.lang)

  const combo = $derived(combine(app.seeds, app.style, app.palette))
  const pens = $derived(pensFor(combo, app.outlines))
  const separateLine = $derived(!pens.blackPen && !pens.colors.includes(pens.line))
  const markers = $derived(separateLine ? [pens.line, ...pens.colors, pens.background] : [...pens.colors, pens.background])
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
  const artLabel = $derived(combo.motif ? `${tr(combo.style.name)}, ${tr(combo.motif.name)}` : tr(combo.style.name))

  $effect(() => {
    const root = document.documentElement.style
    root.setProperty('--accent', theme.accent)
    root.setProperty('--second', theme.second)
    const background = getComputedStyle(document.documentElement).getPropertyValue('--bg')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolveColor(background, '#fffbf6'))
  })

  const previews = new Map<string, string>()

  function preview(style: StyleId): string {
    const key = `${style}|${combo.palette.theme.id}|${combo.seeds.colors}|${app.outlines}`
    const cached = previews.get(key)
    if (cached) return cached
    const svg = renderArt(combine({ ...combo.seeds, layout: 424242, motif: 7 }, style, combo.palette.theme.id), app.outlines)
    previews.set(key, svg)
    return svg
  }

  const swatchesOf = (theme: PaletteTheme) => {
    const sample = paletteFrom(theme, rngFor(0, 5))
    return [sample.line, ...sample.colors, sample.background]
  }

  let squeezing = $state(false)
  let spins = $state(0)

  function doRoll() {
    roll()
    spins++
    squeezing = true
  }

  function onKeydown(event: KeyboardEvent) {
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
      <section class="recipe" aria-label={tr(ui.recipe)}>
        <ul class="rows">
          <RecipeRow label={tr(categoryLabels.style)} locked={app.locked.has('style')} onToggle={() => toggleLock('style')}>
            {#snippet slot()}
              <Picker label={tr(ui.chooseStyle)} items={styles} selected={app.style} randomLabel={tr(ui.randomStyle)} columns={3} onPick={(id) => chooseStyle(id as StyleId | null)}>
                {#snippet current()}
                  <Reel value={tr(combo.style.name)} pool={styleNames} spin={spins} locked={app.locked.has('style')} />
                {/snippet}
                {#snippet option(style)}
                  <span class="thumb">{@html preview(style.id)}</span>
                  <span class="option-name">{tr(style.name)}</span>
                {/snippet}
              </Picker>
            {/snippet}
          </RecipeRow>
          <RecipeRow label={tr(categoryLabels.palette)} locked={app.locked.has('palette')} onToggle={() => toggleLock('palette')}>
            {#snippet slot()}
              <Picker label={tr(ui.choosePalette)} items={paletteThemes} selected={app.palette} randomLabel={tr(ui.randomPalette)} columns={2} onPick={choosePalette}>
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
        <Markers colors={markers} blackPen={pens.blackPen} />
      </div>
    </div>

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
      padding-bottom: calc(7.5rem + env(safe-area-inset-bottom));
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
      padding: 1.2rem;
    }

    .roll-bar {
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: calc(14px + env(safe-area-inset-bottom));
      z-index: 30;
      max-width: 488px;
      margin: 0 auto;
      padding: 0;
    }

    .roll-bar::before {
      content: '';
      position: absolute;
      inset: -18px -16px calc(-14px - env(safe-area-inset-bottom));
      z-index: -1;
      background: linear-gradient(transparent, var(--bg) 40%);
      pointer-events: none;
    }

    .roll-hint {
      display: none;
    }
  }
</style>
