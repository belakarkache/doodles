import type { OutlineMode } from './art'
import type { StyleId } from './data/catalog'
import { randomSeed, randomSeeds, reroll, type Category } from './generator'

const OUTLINES_KEY = 'doodles:outlines'
const OUTLINE_MODES: OutlineMode[] = ['ink', 'color', 'none']

function initialOutlines(): OutlineMode {
  try {
    const saved = localStorage.getItem(OUTLINES_KEY)
    return OUTLINE_MODES.find((mode) => mode === saved) ?? 'ink'
  } catch {
    return 'ink'
  }
}

export const app = $state({
  seeds: randomSeeds(),
  locked: new Set<Category>(),
  style: null as StyleId | null,
  palette: null as string | null,
  outlines: initialOutlines(),
})

export function setOutlines(outlines: OutlineMode) {
  app.outlines = outlines
  try {
    localStorage.setItem(OUTLINES_KEY, outlines)
  } catch {}
}

export function roll() {
  app.seeds = reroll(app.seeds, app.locked)
}

function setLocked(category: Category, locked: boolean) {
  const next = new Set(app.locked)
  if (locked) next.add(category)
  else next.delete(category)
  app.locked = next
}

export function toggleLock(category: Category) {
  const locking = !app.locked.has(category)
  setLocked(category, locking)
  if (!locking && category === 'style') app.style = null
  if (!locking && category === 'palette') app.palette = null
}

export function chooseStyle(style: StyleId | null) {
  app.style = style
  setLocked('style', style !== null)
  app.seeds = { ...app.seeds, style: style === null ? randomSeed() : app.seeds.style, layout: randomSeed() }
}

export function choosePalette(palette: string | null) {
  app.palette = palette
  setLocked('palette', palette !== null)
  app.seeds = { ...app.seeds, palette: randomSeed(), colors: randomSeed() }
}
