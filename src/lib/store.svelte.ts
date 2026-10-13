import type { StyleId } from './data/catalog'
import { randomSeed, randomSeeds, reroll, type Category } from './generator'

const OUTLINES_KEY = 'doodles:outlined'

function initialOutlined(): boolean {
  try {
    return localStorage.getItem(OUTLINES_KEY) !== 'off'
  } catch {
    return true
  }
}

export const app = $state({
  seeds: randomSeeds(),
  locked: new Set<Category>(),
  style: null as StyleId | null,
  palette: null as string | null,
  outlined: initialOutlined(),
})

export function setOutlined(outlined: boolean) {
  app.outlined = outlined
  try {
    localStorage.setItem(OUTLINES_KEY, outlined ? 'on' : 'off')
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
