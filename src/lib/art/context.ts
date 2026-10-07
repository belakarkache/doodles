import type { Combination } from '../generator'
import { rngFor, shuffle, type Rng } from '../random'
import type { MotifId } from '../data/motifs'
import { distance, isDark } from '../theme'
import { handDrawn, type Hand } from './hand'

export const WIDTH = 300
export const HEIGHT = 400
const BLACK = '#1d1c1f'
export const LINE = 4.4

export type OutlineMode = 'ink' | 'color' | 'none'

export type Pens = { background: string; line: string; colors: string[]; blackPen: boolean }

export type ArtContext = {
  rng: Rng
  pens: Pens
  motif: MotifId
  hand: Hand
  uid: string
  outlines: OutlineMode
}

const boldest = (colors: string[], paper: string) =>
  colors.reduce((a, b) => (distance(b, paper) > distance(a, paper) ? b : a))

export function pensFor(combo: Combination, outlines: OutlineMode): Pens {
  const rng = rngFor(combo.seeds.colors, 41)
  const { background, line, colors } = combo.palette
  const blackPen = rng() < 0.15 && outlines !== 'color' && !isDark(background)
  const shuffled = shuffle(rng, colors)
  if (outlines === 'color') return { background, line: boldest(colors, background), colors: shuffled, blackPen }
  return { background, line: blackPen ? BLACK : line, colors: shuffled, blackPen }
}

export function createContext(combo: Combination, uid: string, outlines: OutlineMode): ArtContext {
  const rng = rngFor(combo.seeds.layout, 77)
  return {
    rng,
    pens: pensFor(combo, outlines),
    motif: combo.motif?.id ?? 'blob',
    hand: handDrawn(rngFor(combo.seeds.layout, 13)),
    uid,
    outlines,
  }
}

export function color(ctx: ArtContext, index: number): string {
  const { colors } = ctx.pens
  return colors[((index % colors.length) + colors.length) % colors.length]
}
