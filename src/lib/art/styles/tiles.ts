import { add, catmullRom, fromAngle, lerp, normalize, perpendicular, scale, sub, vec, type Vec } from '../../geometry'
import { between, intBetween, pick, type Rng } from '../../random'
import { HEIGHT, WIDTH, type ArtContext } from '../context'
import { fill, ink, polyD, type Art } from '../draw'
import type { Hand } from '../hand'
import { luminance } from '../../theme'
import { motifShapes } from '../shapes'

const TAU = Math.PI * 2
const LINE = 3

type Cell = { i: number; j: number; center: Vec; size: number; even: boolean }

type Painter = { hand: Hand; line: string; outlined: boolean }

function grid(rng: Rng): Cell[] {
  const size = between(rng, 54, 72)
  const ox = -between(rng, 0, size)
  const oy = -between(rng, 0, size)
  const cells: Cell[] = []
  for (let j = 0; oy + j * size < HEIGHT; j++) {
    for (let i = 0; ox + i * size < WIDTH; i++) {
      cells.push({ i, j, center: vec(ox + (i + 0.5) * size, oy + (j + 0.5) * size), size, even: (i + j) % 2 === 0 })
    }
  }
  return cells
}

function square({ center, size }: Cell): Vec[] {
  const h = size / 2
  const corners = [vec(-h, -h), vec(h, -h), vec(h, h), vec(-h, h)].map((c) => add(center, c))
  return corners.flatMap((a, k) => {
    const b = corners[(k + 1) % 4]
    return [0, 0.25, 0.5, 0.75].map((t) => lerp(a, b, t))
  })
}

function circle(center: Vec, r: number, samples = 48): Vec[] {
  return Array.from({ length: samples }, (_, k) => add(center, fromAngle((k / samples) * TAU, r)))
}

function roundFlower(center: Vec, r: number, petals: number, tilt: number): Vec[] {
  return Array.from({ length: 150 }, (_, k) => {
    const t = (k / 150) * TAU
    return add(center, fromAngle(t, r * (0.68 + 0.32 * Math.abs(Math.cos((petals / 2) * (t - tilt))))))
  })
}

function leaf(base: Vec, tip: Vec, width: number): Vec[] {
  const axis = sub(tip, base)
  const side = scale(normalize(perpendicular(axis)), width)
  const steps = 14
  const upper = Array.from({ length: steps + 1 }, (_, k) => {
    const t = k / steps
    return add(lerp(base, tip, t), scale(side, Math.sin(Math.PI * t) ** 0.8))
  })
  const lower = Array.from({ length: steps - 1 }, (_, k) => {
    const t = 1 - (k + 1) / steps
    return add(lerp(base, tip, t), scale(side, -0.55 * Math.sin(Math.PI * t) ** 0.8))
  })
  return [...upper, ...lower]
}

function stem(from: Vec, to: Vec, width: number): Vec[] {
  const side = scale(normalize(perpendicular(sub(to, from))), width / 2)
  return [add(from, side), add(to, side), sub(to, side), sub(from, side)]
}

function tulip(center: Vec, s: number): Vec[] {
  const w = s * 0.3
  const top = center.y - s * 0.3
  const middle = center.y - s * 0.08
  const bowl = Array.from({ length: 25 }, (_, k) => {
    const t = Math.PI + (k / 24) * Math.PI
    return vec(center.x + w * Math.cos(t), middle - s * 0.2 * Math.sin(t))
  })
  return [
    vec(center.x - w * 0.95, top),
    ...bowl,
    vec(center.x + w * 0.95, top),
    vec(center.x + w * 0.4, top + s * 0.14),
    vec(center.x, top - s * 0.04),
    vec(center.x - w * 0.4, top + s * 0.14),
  ]
}

function shape(painter: Painter, points: Vec[], color: string): string {
  const d = polyD(painter.hand.points(points))
  return fill(d, color) + (painter.outlined ? ink(d, painter.line, LINE) : '')
}

function sprig(painter: Painter, center: Vec, s: number, color: string): string {
  const pairs = [0.16, -0.18].flatMap((dy) => {
    const base = vec(center.x, center.y + dy * s)
    return [-1, 1].map((side) => leaf(base, vec(center.x + side * 0.42 * s, base.y - 0.13 * s), side * -0.12 * s))
  })
  const body = stem(vec(center.x, center.y + 0.46 * s), vec(center.x, center.y - 0.42 * s), s * 0.05)
  return shape(painter, body, color) + pairs.map((p) => shape(painter, p, color)).join('')
}

function daisy(painter: Painter, center: Vec, s: number, petals: string, core: string, tilt: number): string {
  return shape(painter, roundFlower(center, s * 0.43, 5, tilt), petals) + shape(painter, circle(center, s * 0.15), core)
}

function checkerboard(painter: Painter, cells: Cell[], tileColor: (cell: Cell) => string | null): string {
  return cells
    .map((cell) => {
      const color = tileColor(cell)
      return color ? shape(painter, square(cell), color) : ''
    })
    .join('')
}

function sprigs(painter: Painter, cells: Cell[], light: string, dark: string, tints: string[]): string {
  const tiles = checkerboard(painter, cells, (cell) => (cell.even ? dark : null))
  const motifs = cells.map(({ center, size, even, i }) => {
    const tint = tints[i % 2]
    return even ? daisy(painter, center, size, light, tint, -Math.PI / 2) : sprig(painter, center, size, tint)
  })
  return tiles + motifs.join('')
}

function inverted(rng: Rng, painter: Painter, cells: Cell[], light: string, dark: string): string {
  const petals = intBetween(rng, 5, 7)
  const tiles = checkerboard(painter, cells, (cell) => (cell.even ? dark : null))
  const flowers = cells.map(({ center, size, even }) => {
    const [bloom, ground] = even ? [light, dark] : [dark, light]
    return shape(painter, wonkyFlower(rng, center, size * 0.4, petals), bloom) + shape(painter, circle(center, size * 0.05, 16), ground)
  })
  return tiles + flowers.join('')
}

function wonkyFlower(rng: Rng, center: Vec, r: number, petals: number): Vec[] {
  const tilt = between(rng, 0, TAU)
  const step = TAU / petals
  const controls = Array.from({ length: petals }, (_, k) => {
    const middle = tilt + k * step + between(rng, -0.12, 0.12)
    const tip = r * between(rng, 0.82, 1.05)
    return [
      fromAngle(middle - step * 0.5, r * 0.34),
      fromAngle(middle - step * 0.24, tip * 0.82),
      fromAngle(middle, tip),
      fromAngle(middle + step * 0.24, tip * 0.82),
    ]
  })
  return catmullRom(controls.flat().map((p) => add(center, p)), 6, true)
}

function sparse(rng: Rng, painter: Painter, cells: Cell[], darks: string[], colors: string[]): string {
  const hearts = rng() < 0.5
  const tiles = checkerboard(painter, cells, (cell) => (cell.even ? null : darks[cell.j % darks.length]))
  const motifs = cells
    .filter((cell) => cell.even)
    .map(({ center, size, i }, k) => {
      if (hearts) return shape(painter, motifShapes.heart(rng, center.x, center.y + size * 0.03, size * 0.24), colors[0])
      const [petals, core] = (i + k) % 2 === 0 ? [colors[0], colors[1]] : [colors[1], colors[0]]
      return daisy(painter, center, size * 0.85, petals, core, between(rng, 0, TAU))
    })
  return tiles + motifs.join('')
}

function circles(painter: Painter, cells: Cell[], light: string, colors: string[]): string {
  return cells
    .map(({ center, size, even }) => {
      const disc = shape(painter, circle(center, size * 0.47), even ? colors[0] : colors[1])
      if (even) return disc + daisy(painter, center, size * 0.82, light, colors[2], -Math.PI / 2)
      const base = vec(center.x, center.y + size * 0.36)
      const leaves = [-1, 1].map((side) => leaf(base, vec(center.x + side * 0.3 * size, center.y + size * 0.18), side * 0.09 * size))
      return (
        disc +
        shape(painter, stem(vec(center.x, center.y + size * 0.42), vec(center.x, center.y - size * 0.05), size * 0.07), colors[3]) +
        leaves.map((l) => shape(painter, l, colors[3])).join('') +
        shape(painter, tulip(center, size), colors[2])
      )
    })
    .join('')
}

export function tiles(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const painter: Painter = { hand: ctx.hand.softer(0.3), line: pens.line, outlined: ctx.outlines !== 'none' }
  const light = pens.background
  const contrast = (c: string) => Math.abs(luminance(c) - luminance(light))
  const ranked = pens.colors.filter((c) => c !== pens.line && c !== light).sort((a, b) => contrast(b) - contrast(a))
  const tone = (k: number) => ranked[Math.min(k, ranked.length - 1)]
  const faintest = ranked[ranked.length - 1]
  const cells = grid(rng)
  const variant = pick(rng, ['sprigs', 'inverted', 'sparse', 'circles'] as const)
  const body = {
    sprigs: () => sprigs(painter, cells, light, tone(0), [tone(1), tone(2)]),
    inverted: () => inverted(rng, painter, cells, light, rng() < 0.5 ? pens.line : tone(0)),
    sparse: () => sparse(rng, painter, cells, rng() < 0.6 ? [tone(2), tone(3)] : [tone(2)], [tone(0), tone(1)]),
    circles: () => circles(painter, cells, light, [tone(0), faintest, tone(1), tone(2)]),
  }[variant]()
  return { background: light, body }
}
