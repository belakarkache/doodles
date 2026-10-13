import type { Combination } from '../generator'
import { pick, rngFor, shuffle, type Rng } from '../random'
import type { MotifId } from '../data/motifs'
import { distance, isDark } from '../theme'
import { handDrawn, type Hand } from './hand'

export const WIDTH = 300
export const HEIGHT = 400
const BLACK = '#1d1c1f'
export const LINE = 4.4

export type OutlineMode = 'ink' | 'color' | 'none'

export type Pens = { background: string; line: string; colors: string[]; blackPen: boolean }

export type Rhythm = (count: number, i: number, j?: number) => number

export type ArtContext = {
  rng: Rng
  pens: Pens
  rhythm: Rhythm
  motif: MotifId
  hand: Hand
  uid: string
  outlines: OutlineMode
}

const wrap = (k: number, n: number) => ((k % n) + n) % n

const sequences: ((k: number, n: number) => number)[] = [
  (k) => wrap(k, 2),
  (k, n) => wrap(k, n),
  (k, n) => {
    const t = wrap(k, 2 * (n - 1))
    return t < n ? t : 2 * (n - 1) - t
  },
  (k, n) => wrap(Math.floor(k / 2), n),
  (k, n) => (wrap(k, 2) === 0 ? 0 : 1 + wrap(Math.floor(k / 2), n - 1)),
]

const lattices: ((i: number, j: number) => number)[] = [(i, j) => i + j, (i, j) => i - j, (i) => i, (_, j) => j]

export function rhythmFor(combo: Combination): Rhythm {
  const rng = rngFor(combo.seeds.colors, 59)
  const sequence = pick(rng, sequences)
  const lattice = pick(rng, lattices)
  return (count, i, j) => (count < 2 ? 0 : sequence(Math.floor(j === undefined ? i : lattice(i, j)), count))
}

const rotate = (items: string[], by: number) => [...items.slice(by), ...items.slice(0, by)]

const boldest = (colors: string[], paper: string) =>
  colors.reduce((a, b) => (distance(b, paper) > distance(a, paper) ? b : a))

export function pensFor(combo: Combination, outlines: OutlineMode): Pens {
  const rng = rngFor(combo.seeds.colors, 41)
  const { background, line, colors } = combo.palette
  const blackPen = rng() < 0.15 && outlines !== 'color' && !isDark(background)
  const shuffled = combo.palette.theme.spectrum ? rotate(colors, Math.floor(rng() * colors.length)) : shuffle(rng, colors)
  if (outlines === 'color') return { background, line: boldest(colors, background), colors: shuffled, blackPen }
  return { background, line: blackPen ? BLACK : line, colors: shuffled, blackPen }
}

export function createContext(combo: Combination, uid: string, outlines: OutlineMode): ArtContext {
  const rng = rngFor(combo.seeds.layout, 77)
  return {
    rng,
    pens: pensFor(combo, outlines),
    rhythm: rhythmFor(combo),
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

export function tone(ctx: ArtContext, colors: string[], i: number, j?: number): string {
  return colors[ctx.rhythm(colors.length, i, j)]
}

export function spectrum(ctx: ArtContext, from: number): string[] {
  return ctx.pens.colors.map((_, i) => color(ctx, from + i))
}

export function except(ctx: ArtContext, ...skip: number[]): string[] {
  const taken = skip.map((index) => color(ctx, index))
  const rest = ctx.pens.colors.filter((c) => !taken.includes(c))
  return rest.length > 0 ? rest : [color(ctx, 0)]
}
