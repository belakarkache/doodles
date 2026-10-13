import { add, fromAngle, TAU, vec, type Vec } from '../../geometry'
import { between, intBetween, pick, shuffle, type Rng } from '../../random'
import { HEIGHT, WIDTH, type ArtContext, type Rhythm } from '../context'
import { fill, ink, polyD, type Art } from '../draw'
import type { Hand } from '../hand'

const LINE = 3
const QUARTER = Math.PI / 2
const LENS = Math.asin(0.45)

type Painter = { hand: Hand; line: string; outlined: boolean; rhythm: Rhythm }

type Maker = (center: Vec, r: number, turn: number) => Vec[][]

type Cell = { i: number; j: number; center: Vec; size: number }

function shape(painter: Painter, loops: Vec[][], color: string): string {
  const d = loops.map((loop) => polyD(painter.hand.points(loop))).join(' ')
  return fill(d, color) + (painter.outlined ? ink(d, painter.line, LINE) : '')
}

function regular(center: Vec, r: number, sides: number, turn = 0): Vec[] {
  return Array.from({ length: sides }, (_, k) => add(center, fromAngle(turn + (k / sides) * TAU, r)))
}

function wedge(center: Vec, r: number, start: number, sweep: number): Vec[] {
  const samples = Math.ceil((sweep / TAU) * 48)
  return [center, ...Array.from({ length: samples + 1 }, (_, k) => add(center, fromAngle(start + (k / samples) * sweep, r)))]
}

function rotated(points: Vec[], center: Vec, turn: number): Vec[] {
  const c = Math.cos(turn)
  const s = Math.sin(turn)
  return points.map(({ x, y }) => vec(center.x + x * c - y * s, center.y + x * s + y * c))
}

const box = (w: number, h: number, dx = 0, dy = 0): Vec[] => [vec(dx - w / 2, dy - h / 2), vec(dx + w / 2, dy - h / 2), vec(dx + w / 2, dy + h / 2), vec(dx - w / 2, dy + h / 2)]

const cross = (a: number, b: number): Vec[] =>
  [vec(-a, -b), vec(a, -b), vec(a, -a), vec(b, -a), vec(b, a), vec(a, a), vec(a, b), vec(-a, b), vec(-a, a), vec(-b, a), vec(-b, -a), vec(-a, -a)]

const makers: Record<string, Maker> = {
  circle: (c, r) => [regular(c, r * 0.8, 48)],
  ring: (c, r) => [regular(c, r * 0.82, 48), regular(c, r * 0.42, 36)],
  half: (c, r, t) => [wedge(add(c, fromAngle(t + QUARTER, r * 0.3)), r * 0.85, t, Math.PI)],
  quarter: (c, r, t) => [wedge(add(c, fromAngle(t + Math.PI * 1.25, r * Math.SQRT2)), r * 2, t, QUARTER)],
  triangle: (c, r, t) => [regular(c, r * 0.9, 3, t - QUARTER)],
  corner: (c, r, t) => [rotated([vec(-r, -r), vec(r, -r), vec(-r, r)], c, t)],
  diamond: (c, r) => [regular(c, r * 0.9, 4)],
  square: (c, r, t) => [rotated(box(r * 1.1, r * 1.1), c, t / 4)],
  plus: (c, r, t) => [rotated(cross(r * 0.25, r * 0.8), c, t)],
  bars: (c, r, t) => [-0.55, 0, 0.55].map((dy) => rotated(box(r * 1.5, r * 0.28, 0, dy * r), c, t)),
  hexagon: (c, r, t) => [regular(c, r * 0.85, 6, t)],
  lens: (c, r, t) => [rotated([...wedge(vec(0, r * 0.45), r, LENS - Math.PI, Math.PI - LENS * 2).slice(1), ...wedge(vec(0, -r * 0.45), r, LENS, Math.PI - LENS * 2).slice(1)], c, t)],
  dots: (c, r) => [vec(-1, -1), vec(1, -1), vec(1, 1), vec(-1, 1)].map((o) => regular(add(c, vec(o.x * r * 0.45, o.y * r * 0.45)), r * 0.26, 24)),
  star: (c, r, t) => [Array.from({ length: 10 }, (_, k) => add(c, fromAngle(t - QUARTER + (k / 10) * TAU, k % 2 ? r * 0.4 : r * 0.92)))],
}

const names = Object.keys(makers)

function squareCells(rng: Rng, size: number, pad: number, brick: boolean): Cell[] {
  const ox = -pad - between(rng, 0, size)
  const oy = -pad - between(rng, 0, size)
  const cells: Cell[] = []
  for (let j = 0; oy + j * size < HEIGHT + pad; j++) {
    const shift = brick && j % 2 ? size / 2 : 0
    for (let i = 0; ox + i * size - shift < WIDTH + pad; i++) {
      cells.push({ i, j, size, center: vec(ox + (i + 0.5) * size - shift, oy + (j + 0.5) * size) })
    }
  }
  return cells
}

function tilted(rng: Rng, body: (pad: number) => string): string {
  const angle = pick(rng, [0, 0, 45, 30, -15])
  if (angle === 0) return body(0)
  return `<g transform="rotate(${angle} ${WIDTH / 2} ${HEIGHT / 2})">${body(110)}</g>`
}

function bauhaus(rng: Rng, painter: Painter, inks: string[], paper: string): string {
  const pool = shuffle(rng, names).slice(0, intBetween(rng, 1, 3))
  const size = between(rng, 52, 78)
  const pinwheel = rng() < 0.5
  return tilted(rng, (pad) =>
    squareCells(rng, size, pad, false)
      .map(({ center, size, i, j }) => {
        const backs = [...inks, paper]
        const back = backs[painter.rhythm(backs.length, i, j)]
        const fronts = inks.filter((c) => c !== back)
        const front = fronts[painter.rhythm(fronts.length, i, j)]
        const turn = (pinwheel ? [0, 1, 3, 2][(i % 2) + 2 * (j % 2)] : (i + j) % 4) * QUARTER
        const tile = shape(painter, [box(size, size, center.x, center.y)], back)
        return tile + shape(painter, makers[pool[(i + j) % pool.length]](center, size * 0.42, turn), front)
      })
      .join(''),
  )
}

function targets(rng: Rng, painter: Painter, inks: string[], paper: string): string {
  const sides = pick(rng, [48, 4, 4, 6, 3, 8])
  const turn = sides === 4 ? pick(rng, [Math.PI / 4, 0]) : sides === 3 ? -QUARTER : 0
  const rings = intBetween(rng, 3, 5)
  const size = between(rng, 56, 84)
  const brick = rng() < 0.5
  const order = shuffle(rng, [...inks, paper])
  const shifting = rng() < 0.5
  return tilted(rng, (pad) =>
    squareCells(rng, size, pad, brick)
      .map(({ center, size, i, j }) => {
        const offset = shifting ? i + j : 0
        return Array.from({ length: rings }, (_, k) => {
          const r = (size / 2) * (sides === 4 && turn !== 0 ? Math.SQRT2 : sides === 3 ? 1.2 : 0.98) * (1 - k / rings)
          return shape(painter, [regular(center, r, sides, turn)], order[(k + offset) % order.length])
        }).join('')
      })
      .join(''),
  )
}

function triangles(rng: Rng, painter: Painter, inks: string[], paper: string): string {
  const side = between(rng, 48, 72)
  const h = (side * Math.sqrt(3)) / 2
  const rule = pick(rng, ['rhythm', 'rows', 'diagonal', 'stars', 'pairs'] as const)
  const colors = [...inks, ...(rng() < 0.5 ? [paper] : [])]
  const inner = rng() < 0.4
  return tilted(rng, (pad) => {
    const parts: string[] = []
    const rows = Math.ceil((HEIGHT + pad * 2) / h) + 1
    const cols = Math.ceil((WIDTH + pad * 2) / side) * 2 + 3
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = -pad - side + (i * side) / 2 + (j % 2 ? side / 2 : 0)
        const y = -pad + j * h
        const up = i % 2 === 0
        const points = up ? [vec(x, y + h), vec(x + side / 2, y), vec(x + side, y + h)] : [vec(x, y), vec(x + side, y), vec(x + side / 2, y + h)]
        const index = {
          rhythm: () => painter.rhythm(colors.length, i, j),
          rows: () => j + (up ? 0 : 1),
          diagonal: () => Math.floor((i + j * 2) / 2),
          stars: () => (up ? 0 : 1 + ((Math.floor(i / 2) + j) % (colors.length - 1))),
          pairs: () => Math.floor(i / 2) + j,
        }[rule]()
        const color = colors[index % colors.length]
        parts.push(shape(painter, [points], color))
        if (inner && (i + j) % 3 === 0) {
          const c = vec(x + side / 2, up ? y + h * (2 / 3) : y + h / 3)
          parts.push(shape(painter, [regular(c, side * 0.12, 24)], colors[(index + 1) % colors.length]))
        }
      }
    }
    return parts.join('')
  })
}

function cubes(rng: Rng, painter: Painter, inks: string[]): string {
  const r = between(rng, 26, 40)
  const w = r * Math.sqrt(3)
  const fixed = rng() < 0.6
  const tones = shuffle(rng, inks).slice(0, 3)
  const parts: string[] = []
  for (let j = 0; j * r * 1.5 < HEIGHT + r * 2; j++) {
    for (let i = -1; i * w < WIDTH + w; i++) {
      const c = vec(i * w + (j % 2 ? w / 2 : 0), j * r * 1.5)
      const turn = fixed ? 0 : painter.rhythm(tones.length, i, j)
      const [top, left, right] = [0, 1, 2].map((k) => tones[(k + turn) % tones.length])
      const at = (k: number) => add(c, fromAngle(-QUARTER + (k * TAU) / 6, r))
      parts.push(
        shape(painter, [[c, at(5), at(0), at(1)]], top),
        shape(painter, [[c, at(3), at(4), at(5)]], left),
        shape(painter, [[c, at(1), at(2), at(3)]], right),
      )
    }
  }
  return parts.join('')
}

function stepped(center: Vec, a: number, b: number, steps: number): Vec[] {
  const quarter: Vec[] = []
  for (let k = 0; k < steps; k++) {
    const y = -b + (k / steps) * b
    quarter.push(vec((k / steps) * a, y), vec(((k + 1) / steps) * a, y))
  }
  const flip = (sx: number, sy: number, points: Vec[]) => points.map((p) => vec(p.x * sx, p.y * sy))
  const right = [...quarter, vec(a, 0)]
  const loop = [...right, ...flip(1, -1, right).reverse(), ...flip(-1, -1, right), ...flip(-1, 1, right).reverse()]
  return loop.map((p) => add(center, p))
}

function kilim(rng: Rng, painter: Painter, inks: string[], paper: string): string {
  const a = between(rng, 34, 46)
  const b = a * between(rng, 1.2, 1.45)
  const layers = intBetween(rng, 3, 4)
  const steps = intBetween(rng, 4, 6)
  const colors = shuffle(rng, inks).slice(0, Math.min(inks.length, layers + 1))
  const ground = colors[colors.length - 1]
  const parts = [shape(painter, [box(WIDTH + 600, HEIGHT + 600, WIDTH / 2, HEIGHT / 2)], ground)]
  for (let j = -1; (j - 1) * b < HEIGHT; j++) {
    for (let i = -1; (i - 1) * a * 2 < WIDTH; i++) {
      const center = vec(i * a * 2 + (j % 2 ? a : 0), j * b)
      const shift = j % 2 ? 1 : 0
      for (let k = 0; k < layers; k++) {
        const t = 1 - k / layers
        const fillColor = k % 2 === 0 ? colors[(k / 2 + shift) % (colors.length - 1)] : paper
        parts.push(shape(painter, [stepped(center, a * t * 0.96, b * t * 0.96, Math.max(1, Math.round(steps * t)))], fillColor))
      }
    }
  }
  return parts.join('')
}

function octagram(center: Vec, r: number, turn = 0): Vec[] {
  const inner = r * (Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8))
  return Array.from({ length: 16 }, (_, k) => add(center, fromAngle(turn + (k / 16) * TAU, k % 2 ? inner : r)))
}

function zellige(rng: Rng, painter: Painter, inks: string[], paper: string): string {
  const size = between(rng, 50, 70)
  const [first, second, third, fourth] = shuffle(rng, inks)
  const ground = rng() < 0.5 ? paper : fourth ?? paper
  const parts = [shape(painter, [box(WIDTH + 600, HEIGHT + 600, WIDTH / 2, HEIGHT / 2)], ground)]
  return tilted(rng, (pad) => {
    for (let j = -1; (j - 1) * size < HEIGHT + pad * 2; j++) {
      for (let i = -1; (i - 1) * size < WIDTH + pad * 2; i++) {
        const center = vec(i * size - pad, j * size - pad)
        const even = (i + j) % 2 === 0
        parts.push(shape(painter, [octagram(center, size * 0.5)], even ? first : second))
        parts.push(shape(painter, [regular(center, size * 0.2, 8, Math.PI / 8)], even ? second : third ?? paper))
        parts.push(shape(painter, [regular(add(center, vec(size / 2, size / 2)), size * 0.13, 4)], third ?? first))
      }
    }
    return parts.join('')
  })
}

function chevrons(rng: Rng, painter: Painter, inks: string[], paper: string): string {
  const band = between(rng, 26, 42)
  const period = between(rng, 50, 90)
  const amp = between(rng, 0.25, 0.6) * period
  const vertical = rng() < 0.3
  const colors = shuffle(rng, rng() < 0.5 ? [...inks, paper] : inks)
  const wave = (x: number) => amp * (Math.abs(((x / period) % 1 + 1) % 1 - 0.5) * 2)
  const span = vertical ? HEIGHT : WIDTH
  const depth = vertical ? WIDTH : HEIGHT
  const xs = Array.from({ length: Math.ceil(span / (period / 2)) + 3 }, (_, k) => (k - 1) * (period / 2))
  const flip = (p: Vec) => (vertical ? vec(p.y, p.x) : p)
  const parts: string[] = []
  for (let k = 0; -amp + k * band < depth; k++) {
    const y = -amp + k * band
    const upper = xs.map((x) => vec(x, y + wave(x)))
    const lower = xs.map((x) => vec(x, y + band + wave(x))).reverse()
    parts.push(shape(painter, [[...upper, ...lower].map(flip)], colors[painter.rhythm(colors.length, k)]))
  }
  return parts.join('')
}

export function geometric(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const painter: Painter = { hand: ctx.hand.softer(0.3), line: pens.line, outlined: ctx.outlined, rhythm: ctx.rhythm }
  const paper = pens.background
  const inks = pens.colors.filter((c) => c !== paper)
  const variant = pick(rng, ['bauhaus', 'targets', 'triangles', 'cubes', 'chevrons', 'kilim', 'zellige'] as const)
  const body = {
    bauhaus: () => bauhaus(rng, painter, inks, paper),
    targets: () => targets(rng, painter, inks, paper),
    triangles: () => triangles(rng, painter, inks, paper),
    cubes: () => cubes(rng, painter, inks),
    kilim: () => kilim(rng, painter, inks, paper),
    zellige: () => zellige(rng, painter, inks, paper),
    chevrons: () => chevrons(rng, painter, inks, paper),
  }[variant]()
  return { background: paper, body }
}
