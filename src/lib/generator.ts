import { styles, type Style, type StyleId } from './data/catalog'
import { motifs, type Motif } from './data/motifs'
import { paletteThemes } from './data/palettes'
import { paletteFrom, type Palette } from './palette'
import { pick, rngFor } from './random'

const categories = ['style', 'palette'] as const

export type Category = (typeof categories)[number]

type Seeds = Record<Category | 'motif' | 'layout' | 'colors', number>

export type Combination = {
  seeds: Seeds
  style: Style
  palette: Palette
  motif: Motif | null
}

const SEED_SPACE = 2 ** 31

export function randomSeed(): number {
  return Math.floor(Math.random() * SEED_SPACE)
}

export function randomSeeds(): Seeds {
  return { style: randomSeed(), palette: randomSeed(), motif: randomSeed(), layout: randomSeed(), colors: randomSeed() }
}

export function reroll(seeds: Seeds, locked: Set<Category>): Seeds {
  const next = randomSeeds()
  for (const category of locked) next[category] = seeds[category]
  return next
}

function motifsFor(style: Style): Motif[] {
  return motifs.filter((m) => style.motifs?.includes(m.id))
}

function motifFor(style: Style, seed: number): Motif | null {
  const allowed = motifsFor(style)
  if (allowed.length === 0) return null
  return pick(rngFor(seed, 2), allowed)
}

export function combine(
  seeds: Seeds,
  chosenStyle: StyleId | null = null,
  chosenPalette: string | null = null,
): Combination {
  const style = styles.find((s) => s.id === chosenStyle) ?? pick(rngFor(seeds.style, 0), styles)
  const theme = paletteThemes.find((t) => t.id === chosenPalette) ?? pick(rngFor(seeds.palette, 1), paletteThemes)
  return {
    seeds,
    style,
    palette: paletteFrom(theme, rngFor(seeds.colors, 3)),
    motif: motifFor(style, seeds.motif),
  }
}
