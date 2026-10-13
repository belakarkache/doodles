import { add, ellipse, fromAngle, polylinePath, pt, splitPolygon, vec, type Vec } from '../../geometry'
import { between, intBetween, pick, shuffle, type Rng } from '../../random'
import { HEIGHT, WIDTH, type ArtContext } from '../context'
import { circleD, clipPath, clipped, fill, ink, polyD, range, rect, type Art } from '../draw'
import { motifShapes } from '../shapes'

const QUARTER = Math.PI / 2

export const inksOf = (ctx: ArtContext) => {
  const inks = ctx.pens.colors.filter((c) => c !== ctx.pens.line && c !== ctx.pens.background)
  return inks.length > 1 ? inks : ctx.pens.colors
}

const square = (x: number, y: number, w: number, h = w): Vec[] => [vec(x, y), vec(x + w, y), vec(x + w, y + h), vec(x, y + h)]

function bounds(points: Vec[]): [number, number, number, number] {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

function turnAround(points: Vec[], center: Vec, turn: number): Vec[] {
  const c = Math.cos(turn)
  const s = Math.sin(turn)
  return points.map(({ x, y }) => vec(center.x + (x - center.x) * c - (y - center.y) * s, center.y + (x - center.x) * s + (y - center.y) * c))
}

function hillLine(rng: Rng, base: number, swell: number): Vec[] {
  const bumps = Array.from({ length: intBetween(rng, 2, 3) }, () => ({ x: between(rng, -30, WIDTH + 30), w: between(rng, 70, 130), h: swell * between(rng, 0.5, 1) }))
  return range(-30, WIDTH + 40, 8).map((x) => vec(x, base - bumps.reduce((y, b) => y + b.h * Math.exp(-(((x - b.x) / b.w) ** 2)), 0)))
}

const heightAt = (line: Vec[], x: number) => line[Math.max(0, Math.min(line.length - 1, Math.round((x + 30) / 8)))].y

function cactus(ctx: ArtContext, base: Vec, h: number, body: string): string {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.3)
  const width = h * between(rng, 0.2, 0.24)
  const top = vec(base.x + between(rng, -6, 6), base.y - h)
  const limbs = [polylinePath(hand.points([base, vec(base.x, base.y - h * 0.5), top]))]
  const arms = intBetween(rng, 1, 2)
  for (let k = 0; k < 2; k++) {
    if (k >= arms) break
    const side = (k === 0 ? 1 : -1) * (rng() < 0.5 ? 1 : -1) * (k === 0 ? 1 : -1)
    const y = base.y - h * between(rng, 0.38, 0.6)
    const out = base.x + side * width * between(rng, 1.1, 1.35)
    const rise = h * between(rng, 0.18, 0.3)
    limbs.push(`M${pt(vec(base.x, y))} L${pt(vec(out - side * width * 0.4, y))} Q${pt(vec(out, y))} ${pt(vec(out, y - width * 0.4))} L${pt(vec(out, y - rise))}`)
  }
  const d = limbs.join(' ')
  const ribs = [-0.22, 0.22].map((dx) => polylinePath(hand.points([vec(base.x + dx * width, base.y - h * 0.1), vec(top.x + dx * width, top.y + width * 0.6)]))).join(' ')
  return ink(d, pens.line, width + 7) + ink(d, body, width) + ink(ribs, pens.line, 2.2)
}

function lollipop(ctx: ArtContext, foot: Vec, h: number, crown: string, wood: string): string {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.3)
  const top = vec(foot.x + between(rng, -4, 4), foot.y - h)
  const trunk = [vec(foot.x - 3.5, foot.y + 6), vec(top.x - 2.5, top.y), vec(top.x + 2.5, top.y), vec(foot.x + 3.5, foot.y + 6)]
  const head = ellipse(vec(top.x, top.y - h * 0.18), h * between(rng, 0.26, 0.34), h * between(rng, 0.3, 0.38), 40)
  return ink(polyD(hand.points(trunk)), pens.line, 3, wood) + ink(polyD(hand.points(head)), pens.line, 3.6, crown)
}

export function tarsila(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.5)
  const inks = inksOf(ctx)
  const tint = (k: number) => inks[k % inks.length]
  const sun = vec(pick(rng, [between(rng, 60, 110), between(rng, 190, 240)]), between(rng, 64, 92))
  const sunR = between(rng, 30, 42)
  const parts: string[] = []
  if (rng() < 0.6) parts.push(ink(circleD(sun.x, sun.y, sunR * 1.55), pens.line, 3.4, tint(1)))
  parts.push(ink(circleD(sun.x, sun.y, sunR), pens.line, 3.8, tint(0)))
  const layers = intBetween(rng, 3, 4)
  let front: Vec[] = []
  for (let k = 0; k < layers; k++) {
    const raw = hillLine(rng, 210 + k * (150 / layers), between(rng, 45, 85) - k * 8)
    front = raw
    parts.push(ink(polyD([...hand.points(raw), vec(WIDTH + 40, HEIGHT + 30), vec(-30, HEIGHT + 30)]), pens.line, 4, tint(k + 2)))
    if (k < layers - 1) {
      const trees = intBetween(rng, k === 0 ? 1 : 0, 2)
      for (let t = 0; t < trees; t++) {
        const x = sun.x < WIDTH / 2 ? between(rng, sun.x + 70, WIDTH - 20) : between(rng, 20, sun.x - 70)
        parts.push(lollipop(ctx, vec(x, heightAt(raw, x) + 4), between(rng, 56, 80), tint(k + 3 + t), tint(k + 5)))
      }
    }
  }
  const x = between(rng, 80, 220)
  parts.push(cactus(ctx, vec(x, heightAt(front, x) + 30), between(rng, 120, 150), tint(layers + 3)))
  return { background: pens.background, body: parts.join('') }
}

function flag(x: number, y: number, w: number, h: number, notch: number, down: boolean): Vec[] {
  const points = [vec(x, y), vec(x + w, y), vec(x + w, y + h), vec(x + w / 2, y + h - notch), vec(x, y + h)]
  return down ? points.map((p) => vec(p.x, y * 2 + h - p.y)) : points
}

export function volpi(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.3)
  const w = between(rng, 30, 40)
  const h = w * between(rng, 1.2, 1.5)
  const notch = h * between(rng, 0.28, 0.4)
  const gapX = w * between(rng, 0.25, 0.55)
  const gapY = h * between(rng, 0.3, 0.5)
  const shuffled = shuffle(rng, inksOf(ctx))
  const colors = shuffled.slice(0, intBetween(rng, 2, Math.min(4, shuffled.length - 1)))
  const background = rng() < 0.5 ? pens.background : shuffled[colors.length]
  const flipping = rng() < 0.35
  const strings = rng() < 0.7
  const ox = -between(rng, 0, w)
  const parts: string[] = []
  for (let j = 0, y = between(rng, 6, 20); y < HEIGHT; j++, y += h + gapY) {
    const down = flipping && j % 2 === 1
    if (strings && !down) parts.push(ink(polylinePath(hand.points(range(-10, WIDTH + 20, 20).map((x) => vec(x, y)))), pens.line, 2.4))
    const shift = j % 2 ? (w + gapX) / 2 : 0
    for (let i = 0, x = ox - shift; x < WIDTH; i++, x += w + gapX) {
      parts.push(ink(polyD(hand.points(flag(x, y, w, h, notch, down))), pens.line, 3, colors[ctx.rhythm(colors.length, i, j)]))
    }
  }
  return { background, body: parts.join('') }
}

function shatter(rng: Rng, polygon: Vec[], cuts: number, within: [number, number, number, number]): Vec[][] {
  let pieces = [polygon]
  const [x0, y0, x1, y1] = within
  for (let c = 0; c < cuts; c++) {
    const origin = vec(between(rng, x0, x1), between(rng, y0, y1))
    const normal = fromAngle(between(rng, 0, Math.PI))
    pieces = pieces.flatMap((piece) => splitPolygon(piece, origin, normal))
  }
  return pieces
}

function swatch(kind: string, box: [number, number, number, number], base: string, accent: string): string {
  const [x0, y0, x1, y1] = box
  if (kind === 'solid') return rect(base)
  const step = 14
  const shapes: string[] = []
  for (let y = Math.floor(y0 / step) * step; y < y1 + step; y += step) {
    for (let x = Math.floor(x0 / step) * step; x < x1 + step; x += step) {
      const row = Math.round(y / step)
      const column = Math.round(x / step)
      if (kind === 'dots') shapes.push(circleD(x + (row % 2) * (step / 2), y, 3.6))
      if (kind === 'checker' && (row + column) % 2 === 0) shapes.push(polyD(square(x, y, step)))
      if (kind === 'stripes' && column % 2 === 0 && row === Math.floor(y0 / step)) shapes.push(polyD(square(x, y0 - step, step / 2, y1 - y0 + step * 2)))
    }
  }
  return rect(base) + fill(shapes.join(' '), accent)
}

export function britto(ctx: ArtContext): Art {
  const { rng, pens, uid, motif } = ctx
  const inks = inksOf(ctx)
  const kinds = ['solid', 'dots', 'solid', 'stripes', 'checker']
  const page = square(-20, -20, WIDTH + 40, HEIGHT + 40)
  const outline = ctx.hand.softer(0.4).points(motifShapes[motif](rng, WIDTH / 2, HEIGHT / 2, between(rng, 108, 122)))
  const motifBox = bounds(outline)
  const defs: string[] = [clipPath(`${uid}-m`, polyD(outline))]
  const paint = (pieces: Vec[][], prefix: string, offset: number) =>
    pieces
      .map((piece, k) => {
        const id = `${uid}-${prefix}${k}`
        defs.push(clipPath(id, polyD(piece)))
        const tint = (n: number) => inks[(k + offset + n) % inks.length]
        return clipped(id, swatch(kinds[(k + offset) % kinds.length], bounds(piece), tint(0), tint(2)))
      })
      .join('')
  const outside = shatter(rng, page, intBetween(rng, 3, 5), [0, 0, WIDTH, HEIGHT])
  const inside = shatter(rng, square(motifBox[0] - 4, motifBox[1] - 4, motifBox[2] - motifBox[0] + 8, motifBox[3] - motifBox[1] + 8), intBetween(rng, 3, 4), motifBox)
  const edges = (pieces: Vec[][]) => pieces.map(polyD).join(' ')
  return {
    background: pens.background,
    body:
      paint(outside, 'o', 0) +
      ink(edges(outside), pens.line, 5) +
      clipped(`${uid}-m`, rect(pens.background) + paint(inside, 'i', 1) + ink(edges(inside), pens.line, 5)) +
      ink(polyD(outline), pens.line, 6.5),
    defs: defs.join(''),
  }
}

type Module = (s: number) => Vec[][]

const modules: Record<string, Module> = {
  arch: (s) => [[vec(s * 0.15, 0), ...Array.from({ length: 25 }, (_, k) => add(vec(s / 2, 0), fromAngle((k / 24) * Math.PI, s * 0.35))), vec(s * 0.85, 0)]],
  quarter: (s) => [[vec(0, 0), ...Array.from({ length: 19 }, (_, k) => fromAngle((k / 18) * QUARTER, s * 0.72))]],
  bar: (s) => [square(0, 0, s, s * 0.24), ellipse(vec(s * 0.5, s * 0.62), s * 0.16, s * 0.16, 28)],
  diagonal: (s) => [[vec(0, 0), vec(s, 0), vec(0, s)]],
  band: (s) => [
    [...Array.from({ length: 19 }, (_, k) => fromAngle((k / 18) * QUARTER, s * 0.82)), ...Array.from({ length: 19 }, (_, k) => fromAngle(((18 - k) / 18) * QUARTER, s * 0.48))],
  ],
  eye: (s) => [ellipse(vec(s / 2, s / 2), s * 0.32, s * 0.32, 32), square(0, s * 0.42, s * 0.18, s * 0.16)],
}

export function athos(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.2)
  const size = between(rng, 48, 66)
  const grout = 2
  const names = shuffle(rng, Object.keys(modules)).slice(0, intBetween(rng, 1, 2))
  const shuffled = shuffle(rng, inksOf(ctx))
  const tile = rng() < 0.5 ? pens.background : shuffled[2] ?? pens.background
  const [ink1, ink2] = shuffled
  const inverse = rng() < 0.4
  const base = intBetween(rng, 0, 3)
  const rule = pick(rng, [
    (i: number, j: number) => [0, 1, 3, 2][(i % 2) + 2 * (j % 2)],
    (i: number, j: number) => 2 * ((i + j) % 2),
    (i: number, j: number) => i + j,
    (_: number, j: number) => j % 2,
    () => intBetween(rng, 0, 3),
  ])
  const parts: string[] = []
  const ox = -between(rng, 0, size)
  const oy = -between(rng, 0, size)
  for (let j = 0; oy + j * size < HEIGHT; j++) {
    for (let i = 0; ox + i * size < WIDTH; i++) {
      const x = ox + i * size
      const y = oy + j * size
      const flipped = inverse && (i + j) % 2 === 1
      const ground = flipped ? ink1 : tile
      const front = flipped ? tile : ink1
      const turn = base + rule(i, j)
      const center = vec(x + size / 2, y + size / 2)
      const shapes = modules[names[(i + j) % names.length]](size - grout * 2).map((points) =>
        polyD(hand.points(turnAround(points.map((p) => vec(p.x + x + grout, p.y + y + grout)), center, turn * QUARTER))),
      )
      parts.push(ink(polyD(hand.points(square(x + grout, y + grout, size - grout * 2))), pens.line, 2.4, ground))
      parts.push(fill(shapes[0], front))
      if (shapes[1]) parts.push(fill(shapes[1], ink2 ?? front))
    }
  }
  return { background: pens.background, body: parts.join('') }
}

export { bounds, square, turnAround }
