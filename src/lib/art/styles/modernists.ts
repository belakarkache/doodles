import { add, catmullRom, ellipse, fromAngle, polylinePath, pt, TAU, vec, type Vec } from '../../geometry'
import { between, intBetween, pick, shuffle, type Rng } from '../../random'
import { HEIGHT, WIDTH, type ArtContext } from '../context'
import { circleD, clipPath, clipped, fill, ink, polyD, rect, type Art } from '../draw'
import { luminance } from '../../theme'
import { inksOf, square } from './brazilian'

type Vortex = { center: Vec; radius: number; spin: number }

export function vangogh(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const ranked = [...inksOf(ctx)].sort((a, b) => luminance(a) - luminance(b))
  const pick3 = (k: number) => ranked[Math.min(k, ranked.length - 1)]
  const sky = [pick3(0), pick3(1), pick3(2)]
  const glow = ranked[ranked.length - 1]
  const halo = ranked[ranked.length - 2] ?? glow
  const land = [pick3(1), pick3(3)]
  const phase = between(rng, 0, TAU)
  const horizon = (x: number) => HEIGHT * 0.7 + 16 * Math.sin(x * 0.018 + phase) + 8 * Math.sin(x * 0.047 + phase * 2)
  const swirls: Vortex[] = [
    { center: vec(between(rng, 110, 190), between(rng, 130, 170)), radius: between(rng, 60, 80), spin: pick(rng, [1, -1]) },
    { center: vec(between(rng, 40, 260), between(rng, 220, 240)), radius: between(rng, 34, 46), spin: pick(rng, [1, -1]) },
  ]
  const stars: Vortex[] = []
  for (let attempt = 0; attempt < 80 && stars.length < 7; attempt++) {
    const center = vec(between(rng, 20, WIDTH - 20), between(rng, 24, HEIGHT * 0.56))
    const radius = between(rng, 9, 15)
    if ([...swirls, ...stars].every((v) => Math.hypot(v.center.x - center.x, v.center.y - center.y) > v.radius + radius * 2.4)) stars.push({ center, radius, spin: 1 })
  }
  if (stars[0]) stars[0].radius = 20
  const cypressX = pick(rng, [between(rng, 30, 70), between(rng, 230, 270)])
  const cypressTop = between(rng, 70, 130)
  const cypress = rng() < 0.6 ? ctx.hand.softer(0.4).points(cypressShape(rng, cypressX, cypressTop)) : null
  const flow = (x: number, y: number): Vec => {
    if (y > horizon(x) - 4) {
      const slope = (horizon(x + 2) - horizon(x - 2)) / 4
      return vec(1, slope + 0.25 * Math.sin(y * 0.08))
    }
    let dir = vec(1, 0.35 * Math.sin(x * 0.016 + y * 0.022))
    for (const v of [...swirls, ...stars]) {
      const dx = x - v.center.x
      const dy = y - v.center.y
      const reach = Math.exp(-((Math.hypot(dx, dy) / (v.radius * 1.6)) ** 2)) * 3
      dir = add(dir, vec(-dy * v.spin * reach / (Math.hypot(dx, dy) || 1), dx * v.spin * reach / (Math.hypot(dx, dy) || 1)))
    }
    return dir
  }
  const tintAt = (x: number, y: number): string => {
    if (y > horizon(x) - 4) return land[Math.floor((y - horizon(x)) / 13 + 0.5 * Math.sin(x * 0.05)) % 2]
    for (const v of [...stars, ...swirls]) {
      const d = Math.hypot(x - v.center.x, y - v.center.y)
      if (v.radius < 30 && d < v.radius * 1.9) return Math.floor(d / 6) % 2 ? halo : glow
      if (d < v.radius * 1.25) return Math.floor(d / 9) % 2 ? sky[1] : sky[2]
    }
    return sky[Math.abs(Math.floor((y + 14 * Math.sin(x * 0.03 + phase)) / 20)) % 2 ? 1 : 0]
  }
  const groups = new Map<string, string[]>()
  const spacing = 6.5
  for (let gy = -4; gy < HEIGHT + 8; gy += spacing) {
    for (let gx = -4; gx < WIDTH + 8; gx += spacing) {
      const start = vec(gx + between(rng, -2.5, 2.5), gy + between(rng, -2.5, 2.5))
      const points = [start]
      let p = start
      for (let s = 0; s < 4; s++) {
        const dir = flow(p.x, p.y)
        const k = 3.2 / (Math.hypot(dir.x, dir.y) || 1)
        p = vec(p.x + dir.x * k, p.y + dir.y * k)
        points.push(p)
      }
      const tint = tintAt(start.x, start.y)
      const group = groups.get(tint)
      if (group) group.push(polylinePath(points))
      else groups.set(tint, [polylinePath(points)])
    }
  }
  const ground = polyD([...Array.from({ length: 40 }, (_, k) => vec(-10 + k * 9, horizon(-10 + k * 9))), vec(WIDTH + 20, HEIGHT + 20), vec(-20, HEIGHT + 20)])
  const cores = stars.map((v) => circleD(v.center.x, v.center.y, v.radius * 0.55)).join(' ')
  const strokes = [...groups].map(([tint, paths]) => ink(paths.join(' '), tint, 3.6)).join('')
  const tree = cypress ? cypressStrokes(ctx, cypress, ranked[0], pick3(2)) : ''
  return {
    background: sky[0],
    body: rect(sky[0]) + fill(ground, land[0]) + strokes + fill(cores, glow) + ink(cores, pens.line, 2.4) + tree,
    defs: cypress ? clipPath(`${ctx.uid}-cy`, polyD(cypress)) : '',
  }
}

function cypressShape(rng: Rng, x: number, top: number): Vec[] {
  const lean = between(rng, -10, 10)
  const bottom = HEIGHT + 20
  const w = between(rng, 24, 32)
  return catmullRom(
    [
      vec(x - w, bottom),
      vec(x - w * 1.05, bottom - (bottom - top) * 0.35),
      vec(x - w * 0.6 + lean * 0.5, top + (bottom - top) * 0.3),
      vec(x + lean, top),
      vec(x + w * 0.55 + lean * 0.5, top + (bottom - top) * 0.32),
      vec(x + w * 1.05, bottom - (bottom - top) * 0.4),
      vec(x + w, bottom),
    ],
    10,
    true,
  )
}

function cypressStrokes(ctx: ArtContext, shape: Vec[], dark: string, light: string): string {
  const { rng, pens } = ctx
  const xs = shape.map((p) => p.x)
  const ys = shape.map((p) => p.y)
  const [x0, x1, y0] = [Math.min(...xs), Math.max(...xs), Math.min(...ys)]
  const middle = (x0 + x1) / 2
  const strokes: string[] = []
  for (let y = y0 + 10; y < HEIGHT + 10; y += 7) {
    for (let x = x0 + 4; x < x1 - 4; x += 7) {
      const t = (x - middle) / ((x1 - x0) / 2)
      const length = between(rng, 8, 13)
      const bend = Math.sin(y * 0.06 + x * 0.1) * 4
      strokes.push(`M${pt(vec(x, y + length / 2))} Q${pt(vec(x + bend, y))} ${pt(vec(x + t * 3, y - length / 2))}`)
    }
  }
  const d = polyD(shape)
  return fill(d, dark) + clipped(`${ctx.uid}-cy`, ink(strokes.join(' '), light, 3)) + ink(d, pens.line, 3)
}

type Box = [number, number, number, number]

export function mondrian(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const rects: Box[] = [[0, 0, WIDTH, HEIGHT]]
  const lines: Vec[][] = []
  const cuts = intBetween(rng, 5, 8)
  for (let c = 0; c < cuts; c++) {
    rects.sort((a, b) => b[2] * b[3] * between(rng, 0.5, 1) - a[2] * a[3] * between(rng, 0.5, 1))
    const [x, y, w, h] = rects.shift()!
    const ratio = pick(rng, [0.25, 0.33, 0.5, 0.62, 0.7]) + between(rng, -0.04, 0.04)
    if (w > h * between(rng, 0.7, 1.3)) {
      rects.push([x, y, w * ratio, h], [x + w * ratio, y, w * (1 - ratio), h])
      lines.push([vec(x + w * ratio, y), vec(x + w * ratio, y + h)])
    } else {
      rects.push([x, y, w, h * ratio], [x, y + h * ratio, w, h * (1 - ratio)])
      lines.push([vec(x, y + h * ratio), vec(x + w, y + h * ratio)])
    }
  }
  const colors = shuffle(rng, inksOf(ctx)).slice(0, 3)
  const painted = shuffle(rng, rects.map((_, k) => k)).slice(0, intBetween(rng, 3, 5))
  const hand = ctx.hand.softer(0.15)
  const blocks = rects.map(([x, y, w, h], k) => {
    const slot = painted.indexOf(k)
    return fill(polyD(hand.points(square(x, y, w, h))), slot === -1 ? pens.background : colors[slot % colors.length])
  })
  return { background: pens.background, body: blocks.join('') + ink(lines.map((l) => polylinePath(hand.points(l))).join(' '), pens.line, between(rng, 7, 10)) }
}

function frond(ctx: ArtContext, center: Vec, h: number, tint: string): string {
  const { rng } = ctx
  const hand = ctx.hand.softer(0.6)
  const width = h * between(rng, 0.085, 0.11)
  const bottom = vec(center.x + between(rng, -4, 4), center.y + h / 2)
  const top = vec(center.x + between(rng, -h * 0.08, h * 0.08), center.y - h / 2)
  const sway = between(rng, -h * 0.1, h * 0.1)
  const along = (t: number) => vec(bottom.x + (top.x - bottom.x) * t + sway * Math.sin(Math.PI * t), bottom.y + (top.y - bottom.y) * t)
  const branches = intBetween(rng, 5, 7)
  const side = pick(rng, [1, -1])
  const paths = [polylinePath(hand.points(Array.from({ length: 13 }, (_, k) => along(k / 12))))]
  for (let k = 0; k < branches; k++) {
    const t = 0.18 + (k / branches) * 0.72
    const root = along(t)
    const dir = (k % 2 ? 1 : -1) * side
    const reach = h * (0.36 - t * 0.2) * between(rng, 0.85, 1.15)
    const tip = vec(root.x + dir * reach, root.y - reach * between(rng, 0.45, 0.8))
    const bend = vec(root.x + dir * reach * 0.6, root.y + reach * 0.05)
    paths.push(polylinePath(hand.points(catmullRom([root, bend, tip], 6))))
  }
  return ink(paths.join(' '), tint, width)
}

function burst(rng: Rng, center: Vec, r: number): Vec[] {
  const rays = intBetween(rng, 6, 9)
  const turn = between(rng, 0, TAU)
  return catmullRom(
    Array.from({ length: rays * 2 }, (_, k) => add(center, fromAngle(turn + (k / (rays * 2)) * TAU + between(rng, -0.08, 0.08), k % 2 ? r * between(rng, 0.52, 0.62) : r * between(rng, 0.88, 1.04)))),
    6,
    true,
  )
}

export function matisse(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.9)
  const columns = pick(rng, [2, 2, 3])
  const rows = columns === 2 ? 3 : 4
  const gap = 8
  const w = (WIDTH - gap) / columns
  const h = (HEIGHT - gap) / rows
  const inks = shuffle(rng, inksOf(ctx))
  const panels = inks.slice(0, Math.max(2, Math.min(3, inks.length - 1)))
  const cutouts = inks.filter((c) => !panels.includes(c))
  const kinds = shuffle(rng, ['frond', 'burst', 'frond']).slice(0, 2)
  const parts: string[] = []
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const x = gap + i * w
      const y = gap + j * h
      const k = i + j * columns
      const panel = panels[(i + j) % panels.length]
      const cutout = cutouts.length > 0 ? cutouts[k % cutouts.length] : pens.background
      const center = vec(x + (w - gap) / 2, y + (h - gap) / 2)
      const size = Math.min(w, h) - gap
      parts.push(ink(polyD(hand.softer(0.2).points(square(x, y, w - gap, h - gap))), pens.line, 2.6, panel))
      parts.push(kinds[(i + j) % kinds.length] === 'frond' ? frond(ctx, center, Math.min(h - gap, size * 1.15) * 0.8, cutout) : fill(polyD(hand.points(burst(rng, center, size * 0.4))), cutout))
    }
  }
  return { background: pens.background, body: parts.join('') }
}

export function kandinsky(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.35)
  const inks = inksOf(ctx)
  const n = inks.length
  const columns = pick(rng, [3, 3, 4])
  const size = WIDTH / columns
  const rows = Math.ceil(HEIGHT / size)
  const offset = intBetween(rng, 0, n - 1)
  const parts: string[] = []
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const base = offset + i * 2 + j * 3
      const x = i * size
      const y = j * size
      parts.push(ink(polyD(hand.points(square(x, y, size, size))), pens.line, 3, inks[(base + n - 1) % n]))
      const rings = Math.min(intBetween(rng, 3, 5), n - 1)
      let center = vec(x + size / 2 + between(rng, -4, 4), y + size / 2 + between(rng, -4, 4))
      for (let k = 0; k < rings; k++) {
        const r = size * 0.42 * (1 - k / (rings + 0.6))
        parts.push(ink(polyD(hand.points(ellipse(center, r, r * between(rng, 0.95, 1.05), 40))), pens.line, 2, inks[(base + k) % n]))
        center = vec(center.x + between(rng, -r * 0.08, r * 0.08), center.y + between(rng, -r * 0.08, r * 0.08))
      }
    }
  }
  return { background: pens.background, body: parts.join('') }
}
