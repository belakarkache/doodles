import type { PaletteTheme } from './data/palettes'
import { intBetween, pick, shuffle, type Rng } from './random'
import { contrastRatio, distance, nudge, type Spread } from './theme'

export type Palette = { theme: PaletteTheme; background: string; line: string; colors: string[] }

const PAPER: Spread = { hue: 6, saturation: 0.04, lightness: 0.015 }
const INK: Spread = { hue: 6, saturation: 0.05, lightness: 0.04 }
const PAINT: Spread = { hue: 9, saturation: 0.07, lightness: 0.05 }

const LEGIBLE_LINE = 4
const APART_FROM_PAPER = 0.1
const APART_FROM_EACH_OTHER = [0.11, 0.08, 0.05, 0]

function lineFor(paper: string, lines: string[], rng: Rng): string {
  const legible = lines.filter((line) => contrastRatio(line, paper) >= LEGIBLE_LINE)
  if (legible.length > 0) return pick(rng, legible)
  return lines.reduce((a, b) => (contrastRatio(b, paper) > contrastRatio(a, paper) ? b : a))
}

function distinctColors(pool: string[], paper: string, count: number, rng: Rng): string[] {
  const visible = pool.filter((color) => distance(color, paper) >= APART_FROM_PAPER)
  const candidates = shuffle(rng, visible.length >= count ? visible : pool)
  for (const gap of APART_FROM_EACH_OTHER) {
    const chosen: string[] = []
    for (const color of candidates) {
      if (chosen.length === count) break
      if (chosen.every((other) => distance(color, other) >= gap)) chosen.push(color)
    }
    if (chosen.length === Math.min(count, candidates.length)) return chosen
  }
  return candidates.slice(0, count)
}

export function paletteFrom(theme: PaletteTheme, rng: Rng): Palette {
  const background = pick(rng, theme.backgrounds)
  const line = lineFor(background, theme.lines, rng)
  const colors = distinctColors(theme.colors, background, intBetween(rng, 4, 5), rng)
  return {
    theme,
    background: nudge(background, rng, PAPER),
    line: nudge(line, rng, INK),
    colors: colors.map((color) => nudge(color, rng, PAINT)),
  }
}
