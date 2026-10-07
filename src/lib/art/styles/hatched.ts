import { add, dot, fromAngle, lerp, normalize, perpendicular, polylinePath, sub, vec, type Vec } from '../../geometry'
import { between, intBetween, pick, type Rng } from '../../random'
import { HEIGHT, WIDTH, type ArtContext } from '../context'
import { fill, hatch, ink, polyD, type Art } from '../draw'
import type { Hand } from '../hand'
import { contrastRatio } from '../../theme'

const EDGE = 2.6
const STROKE = 1.5

type Cell = { i: number; j: number; corners: Vec[]; size: number }

type Piece = { points: Vec[]; kind: 'dark' | 'solid' | 'hatched' }

type Painter = { hand: Hand; line: string; outlined: boolean; gap: number }

type Tones = { hatched: string; solid: string }

function grid(rng: Rng): Cell[] {
  const size = between(rng, 48, 64)
  const ox = -between(rng, 0, size)
  const oy = -between(rng, 0, size)
  const cells: Cell[] = []
  for (let j = 0; oy + j * size < HEIGHT; j++) {
    for (let i = 0; ox + i * size < WIDTH; i++) {
      const x = ox + i * size
      const y = oy + j * size
      cells.push({ i, j, size, corners: [vec(x, y), vec(x + size, y), vec(x + size, y + size), vec(x, y + size)] })
    }
  }
  return cells
}

function turned(corners: Vec[], turn: number): Vec[] {
  const k = ((turn % 4) + 4) % 4
  return [...corners.slice(k), ...corners.slice(0, k)]
}

function turnRule(rng: Rng): (cell: Cell) => number {
  const base = intBetween(rng, 0, 3)
  if (rng() < 0.35) return () => intBetween(rng, 0, 3)
  return pick(rng, [
    ({ i, j }: Cell) => base + [0, 1, 3, 2][(i % 2) + 2 * (j % 2)],
    ({ i, j }: Cell) => base + 2 * ((i + j) % 2),
    ({ j }: Cell) => base + (j % 2),
    ({ i, j }: Cell) => base + i + j,
    () => base,
  ])
}

function stripes(polygon: Vec[], along: Vec, gap: number): Vec[][] {
  const normal = perpendicular(normalize(along))
  const offsets = polygon.map((p) => dot(p, normal))
  const low = Math.min(...offsets)
  const high = Math.max(...offsets)
  const lines: Vec[][] = []
  for (let t = low + gap / 2; t < high; t += gap) {
    const hits = polygon.flatMap((p, k) => {
      const q = polygon[(k + 1) % polygon.length]
      const a = offsets[k] - t
      const b = offsets[(k + 1) % polygon.length] - t
      return a * b < 0 ? [lerp(p, q, a / (a - b))] : []
    })
    if (hits.length === 2) lines.push(hits)
  }
  return lines
}

const linesD = (lines: Vec[][]) => lines.map((l) => polylinePath(l)).join(' ')

function trianglePieces(layout: 'halves' | 'split' | 'quarters', [a, b, c, d]: Vec[]): Piece[] {
  const m = lerp(a, c, 0.5)
  if (layout === 'halves') return [{ points: [a, b, c], kind: 'hatched' }, { points: [a, c, d], kind: 'dark' }]
  if (layout === 'split')
    return [
      { points: [a, b, c], kind: 'hatched' },
      { points: [a, m, d], kind: 'solid' },
      { points: [m, c, d], kind: 'dark' },
    ]
  return [
    { points: [a, b, m], kind: 'dark' },
    { points: [b, c, m], kind: 'hatched' },
    { points: [c, d, m], kind: 'solid' },
    { points: [d, a, m], kind: 'hatched' },
  ]
}

function triangles(rng: Rng, painter: Painter, cells: Cell[], turn: (cell: Cell) => number, tones: () => Tones): string {
  const layout = pick(rng, ['halves', 'split', 'quarters'] as const)
  const edge = intBetween(rng, 0, 2)
  return cells
    .map((cell) => {
      const tone = tones()
      const corners = painter.hand.points(turned(cell.corners, turn(cell)))
      return trianglePieces(layout, corners)
        .map(({ points, kind }) => {
          const d = polyD(points)
          if (kind === 'dark') return fill(d, painter.line)
          if (kind === 'solid') return fill(d, tone.solid) + outline(painter, d)
          const along = sub(points[(edge + 1) % 3], points[edge])
          return fill(d, tone.hatched) + hatch(linesD(stripes(points, along, painter.gap)), painter.line, STROKE) + outline(painter, d)
        })
        .join('')
    })
    .join('')
}

function arc(center: Vec, r: number, start: number, samples: number): Vec[] {
  return Array.from({ length: samples + 1 }, (_, k) => add(center, fromAngle(start + (k / samples) * (Math.PI / 2), r)))
}

function arcs(painter: Painter, cells: Cell[], turn: (cell: Cell) => number, tones: () => Tones): string {
  return cells
    .map((cell) => {
      const [a, b] = turned(cell.corners, turn(cell))
      const start = Math.atan2(b.y - a.y, b.x - a.x)
      const square = polyD(painter.hand.points(cell.corners))
      const disc = polyD(painter.hand.points([a, ...arc(a, cell.size, start, 24)]))
      const rings: Vec[][] = []
      for (let r = painter.gap; r < cell.size - painter.gap / 2; r += painter.gap) rings.push(painter.hand.points(arc(a, r, start, 16)))
      return fill(square, painter.line) + fill(disc, tones().hatched) + hatch(linesD(rings), painter.line, STROKE) + outline(painter, disc)
    })
    .join('')
}

function outline(painter: Painter, d: string): string {
  return painter.outlined ? ink(d, painter.line, EDGE) : ''
}

export function hatched(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const painter: Painter = { hand: ctx.hand.softer(0.25), line: pens.line, outlined: ctx.outlines !== 'none', gap: between(rng, 4.2, 5.4) }
  const paper = pens.background
  const contrast = (c: string) => contrastRatio(c, pens.line)
  const ranked = pens.colors.filter((c) => c !== pens.line && c !== paper).sort((a, b) => contrast(b) - contrast(a))
  const legible = ranked.filter((c) => contrast(c) >= 2.5)
  const colors = legible.length >= 2 ? legible : ranked.slice(0, 2)
  const mono = rng() < 0.3
  const tones = (): Tones => {
    if (mono) return { hatched: paper, solid: colors[colors.length - 1] }
    const hatchedTone = pick(rng, colors)
    return { hatched: hatchedTone, solid: pick(rng, colors.filter((c) => c !== hatchedTone).concat(paper)) }
  }
  const cells = grid(rng)
  const turn = turnRule(rng)
  const body = rng() < 0.55 ? triangles(rng, painter, cells, turn, tones) : arcs(painter, cells, turn, tones)
  return { background: paper, body }
}
