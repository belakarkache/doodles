import { catmullRom, ellipse, fmt, pt, TAU, vec, type Vec } from '../../geometry'
import { between, intBetween, pick, shuffle } from '../../random'
import { color, HEIGHT, spectrum, tone, WIDTH, type ArtContext } from '../context'
import { bulge, circleD, clipPath, clipped, fill, ink, loopsD, paint, polyD, range, rect, regions, sunburst, type Art } from '../draw'
import { eye as eyeShape, lips as lipsShape, motifShapes } from '../shapes'

function sparkleAt(ctx: ArtContext, x: number, y: number, r: number, fillColor: string): string {
  return ink(polyD(motifShapes.sparkle(ctx.rng, x, y, r)), ctx.pens.line, 3, fillColor)
}

function backdrop(ctx: ArtContext, focusY: number): string {
  const { rng } = ctx
  const kind = pick(rng, ['rays', 'arches', 'stripes'])
  if (kind === 'rays') return sunburst(WIDTH / 2, focusY, pick(rng, [18, 22, 26]), spectrum(ctx, 3))
  if (kind === 'arches') {
    return [4, 3, 2, 1]
      .map((i) => ink(circleD(WIDTH / 2, HEIGHT + 20, 90 + i * 60), ctx.pens.line, 4, color(ctx, i + 1)))
      .join('')
  }
  const period = between(rng, 24, 30)
  const amp = between(rng, 6, 12)
  const band = (x: number, y: number) => (y + amp * Math.sin(x * 0.03)) / period
  const field = ctx.hand.field((x, y) => Math.sin(band(x, y) * Math.PI))
  const colors = spectrum(ctx, 3)
  return paint(regions(field), ({ x, y }) => tone(ctx, colors, Math.floor(band(x, y) / 2)))
}

function capPattern(ctx: ArtContext, cx: number, top: number, brim: number, w: number, base: string, accent: string): string {
  const { rng, hand } = ctx
  const kind = pick(rng, ['dots', 'dots', 'stripes', 'checker'])
  const h = brim - top
  if (kind === 'dots') {
    const centers: Vec[] = []
    const gap = w * between(rng, 0.34, 0.42)
    for (let attempt = 0; attempt < 300 && centers.length < 9; attempt++) {
      const p = vec(cx + between(rng, -1.05, 1.05) * w, top + between(rng, 0.05, 0.95) * h)
      if (centers.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > gap)) centers.push(p)
    }
    const dots = centers.map((p) => polyD(hand.points(ellipse(p, w * between(rng, 0.09, 0.15), undefined, 24))))
    return rect(base) + ink(dots.join(' '), ctx.pens.line, 3, accent)
  }
  const size = w * between(rng, 0.2, 0.26)
  const warp = bulge(cx, top + h * 0.55, w * 0.9, 0.4)
  const field = hand.field((x, y) => {
    const [u, v] = warp(x, y)
    const across = Math.sin(((u - cx) / size) * Math.PI)
    return kind === 'stripes' ? across : across * Math.sin(((v - brim) / size) * Math.PI)
  })
  return rect(base) + fill(loopsD(regions(field)), accent)
}

type Mushroom = { cap: Vec[]; stem: Vec[]; top: number; brim: number; w: number; skirt: string }

function mushroomAt(ctx: ArtContext, cx: number, foot: number, r: number): Mushroom {
  const { rng } = ctx
  const hand = ctx.hand.softer(0.45)
  const w = r * between(rng, 0.92, 1.04)
  const height = r * between(rng, 0.78, 0.96)
  const lean = r * between(rng, -0.06, 0.06)
  const stemHeight = r * between(rng, 0.85, 1.05)
  const brim = foot - stemHeight
  const top = brim - height
  const under = r * between(rng, 0.1, 0.16)
  const cap = catmullRom(
    [
      vec(cx - w, brim),
      vec(cx - w * 0.94 + lean * 0.3, brim - height * 0.42),
      vec(cx - w * 0.64 + lean * 0.7, brim - height * 0.86),
      vec(cx + lean, top),
      vec(cx + w * 0.64 + lean * 0.7, brim - height * 0.86),
      vec(cx + w * 0.94 + lean * 0.3, brim - height * 0.42),
      vec(cx + w, brim),
      vec(cx + w * 0.62, brim + under * 0.8),
      vec(cx, brim + under),
      vec(cx - w * 0.62, brim + under * 0.8),
    ],
    10,
    true,
  )
  const neck = r * between(rng, 0.24, 0.32)
  const belly = neck * between(rng, 1.06, 1.18)
  const base = neck * between(rng, 1.12, 1.3)
  const stem = catmullRom(
    [
      vec(cx - neck, brim),
      vec(cx + neck, brim),
      vec(cx + belly, brim + stemHeight * 0.5),
      vec(cx + base, foot - 4),
      vec(cx + base * 0.6, foot + 2),
      vec(cx - base * 0.6, foot + 2),
      vec(cx - base, foot - 4),
      vec(cx - belly, brim + stemHeight * 0.5),
    ],
    8,
    true,
  )
  const ringY = brim + under + stemHeight * between(rng, 0.12, 0.2)
  const skirt = rng() < 0.5 ? `M${pt(vec(cx - belly * 1.2, ringY))} Q${pt(vec(cx, ringY + r * 0.12))} ${pt(vec(cx + belly * 1.2, ringY))}` : ''
  return { cap: hand.points(cap), stem: hand.points(stem), top, brim: brim + under, w, skirt }
}

function shine(ctx: ArtContext, m: Mushroom, cx: number): string {
  const h = m.brim - m.top
  const from = vec(cx - m.w * 0.62, m.top + h * 0.5)
  const bend = vec(cx - m.w * 0.5, m.top + h * 0.12)
  const to = vec(cx - m.w * 0.18, m.top + h * 0.02)
  return `<path class="ink" pathLength="1" d="M${pt(from)} Q${pt(bend)} ${pt(to)}" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="${fmt(Math.max(4, m.w * 0.07))}"/>`
}

export function mushrooms(ctx: ArtContext): Art {
  const { rng, pens, uid } = ctx
  const groundY = HEIGHT - 58
  const roll = between(rng, 0, TAU)
  const ground = (x: number) => groundY + 7 * Math.sin(x * 0.018 + roll)
  const count = pick(rng, [1, 2, 2, 3])
  const layout =
    count === 1
      ? [{ x: WIDTH / 2, r: between(rng, 112, 122) }]
      : count === 2
        ? [
            { x: WIDTH * 0.42, r: between(rng, 96, 106) },
            { x: WIDTH * 0.79, r: between(rng, 54, 62) },
          ]
        : [
            { x: WIDTH * 0.52, r: between(rng, 88, 96) },
            { x: WIDTH * 0.18, r: between(rng, 46, 52) },
            { x: WIDTH * 0.82, r: between(rng, 56, 64) },
          ]
  const defs: string[] = []
  const bodies = layout
    .slice()
    .sort((a, b) => a.r - b.r)
    .map(({ x, r }, i) => {
      const m = mushroomAt(ctx, x, ground(x) + r * 0.04, r)
      const stemId = `${uid}-s${i}`
      const capId = `${uid}-c${i}`
      const stemD = polyD(m.stem)
      const capD = polyD(m.cap)
      defs.push(clipPath(stemId, stemD), clipPath(capId, capD))
      const stemColor = color(ctx, i * 3 + 2)
      const stem = ink(stemD, pens.line, 4.2, stemColor) + (m.skirt ? clipped(stemId, ink(m.skirt, pens.line, 3.4)) : '')
      const cap = clipped(capId, capPattern(ctx, x, m.top, m.brim, m.w, color(ctx, i * 3), color(ctx, i * 3 + 1)) + shine(ctx, m, x))
      return stem + cap + ink(capD, pens.line, 4.6)
    })
  const hill = polyD([...range(-20, WIDTH + 30, 10).map((x) => vec(x, ground(x))), vec(WIDTH + 20, HEIGHT + 20), vec(-20, HEIGHT + 20)])
  const tufts = range(14, WIDTH - 8, between(rng, 30, 42)).map((x) => {
    const y = ground(x) + 2
    const h = between(rng, 9, 15)
    return ink(`M${fmt(x - 6)} ${fmt(y)} q1 ${fmt(-h * 0.7)} -2 ${fmt(-h)} M${fmt(x)} ${fmt(y)} q1 ${fmt(-h)} 0 ${fmt(-h * 1.35)} M${fmt(x + 6)} ${fmt(y)} q-1 ${fmt(-h * 0.7)} 2 ${fmt(-h)}`, pens.line, 3)
  })
  const sparkles = shuffle(rng, [
    [40, 50],
    [250, 60],
    [150, 34],
    [34, 150],
    [266, 160],
  ])
    .slice(0, intBetween(rng, 2, 4))
    .map(([x, y], i) => sparkleAt(ctx, x, y, between(rng, 15, 22), color(ctx, i + 2)))
  return {
    background: pens.background,
    body: backdrop(ctx, groundY - 120) + ink(hill, pens.line, 4.4, color(ctx, 1)) + tufts.join('') + bodies.join('') + sparkles.join(''),
    defs: defs.join(''),
  }
}

function lashes(ctx: ArtContext, outline: Vec[], cx: number, cy: number, r: number): string {
  const { rng, pens } = ctx
  const count = intBetween(rng, 7, 9)
  const strokes = Array.from({ length: count }, (_, i) => {
    const t = 0.12 + (i / (count - 1)) * 0.76
    const p = outline[Math.round(t * 59)]
    const dir = Math.atan2(p.y - (cy + r * 0.5), p.x - cx)
    const length = r * between(rng, 0.2, 0.28) * (1 - Math.abs(t - 0.5) * 0.6)
    const tip = vec(p.x + Math.cos(dir) * length, p.y + Math.sin(dir) * length)
    const bend = vec((p.x + tip.x) / 2 + Math.cos(dir + 1.4) * length * 0.25, (p.y + tip.y) / 2 + Math.sin(dir + 1.4) * length * 0.25)
    return `M${pt(p)} Q${pt(bend)} ${pt(tip)}`
  })
  return ink(strokes.join(' '), pens.line, 6)
}

export function eye(ctx: ArtContext): Art {
  const { rng, pens, uid } = ctx
  const cx = WIDTH / 2
  const cy = HEIGHT / 2 + 10
  const r = between(rng, 118, 132)
  const outline = ctx.hand.softer(0.5).points(eyeShape(rng, cx, cy, r))
  const iris = vec(cx + between(rng, -14, 14), cy + between(rng, -4, 8))
  const irisR = r * between(rng, 0.4, 0.46)
  const rings = intBetween(rng, 3, 5)
  const target = Array.from({ length: rings }, (_, k) => {
    const ringR = irisR * (1 - k / rings)
    return ink(circleD(iris.x, iris.y, ringR), pens.line, 3.6, color(ctx, k))
  }).join('')
  const pupil = fill(circleD(iris.x, iris.y, irisR * 0.32), pens.line)
  const shine = fill(circleD(iris.x - irisR * 0.32, iris.y - irisR * 0.34, irisR * 0.17), '#ffffff')
  const brow = rng() < 0.5 ? ink(`M${pt(vec(cx - r * 0.85, cy - r * 0.78))} Q${pt(vec(cx, cy - r * 1.2))} ${pt(vec(cx + r * 0.85, cy - r * 0.82))}`, pens.line, 9) : ''
  const sparkles = [
    [44, 70],
    [256, 330],
    [262, 64],
  ].map(([x, y], i) => sparkleAt(ctx, x, y, between(rng, 14, 20), color(ctx, i + 1)))
  return {
    background: pens.background,
    body:
      backdrop(ctx, cy) +
      ink(polyD(outline), pens.line, 5.4, '#ffffff') +
      clipped(`${uid}-e`, target + pupil + shine) +
      ink(polyD(outline), pens.line, 5.4) +
      lashes(ctx, outline, cx, cy, r) +
      brow +
      sparkles.join(''),
    defs: clipPath(`${uid}-e`, polyD(outline)),
  }
}

export function lips(ctx: ArtContext): Art {
  const { rng, pens, uid } = ctx
  const cx = WIDTH / 2
  const cy = HEIGHT / 2
  const r = between(rng, 120, 132)
  const outline = ctx.hand.softer(0.5).points(lipsShape(rng, cx, cy, r))
  const shadow = outline.map((p) => vec(p.x + 12, p.y + 12))
  const dots: string[] = []
  for (let y = cy - r; y < cy + r; y += 13) {
    for (let x = cx - r - 10; x < cx + r + 10; x += 13) {
      const ox = x + ((Math.round((y - cy) / 13) % 2) * 13) / 2
      const t = Math.max(0, Math.min(1, (ox - cx + r) / (2 * r)))
      dots.push(circleD(ox, y, 1.8 + t * 3.4))
    }
  }
  const seam = `M${pt(vec(cx - r * 0.98, cy))} Q${pt(vec(cx - r * 0.5, cy + r * 0.14))} ${pt(vec(cx, cy + r * 0.06))} Q${pt(vec(cx + r * 0.5, cy + r * 0.14))} ${pt(vec(cx + r * 0.98, cy))}`
  const shines = [
    [cx - r * 0.38, cy + r * 0.32, r * 0.14, r * 0.06, -12],
    [cx + r * 0.22, cy + r * 0.36, r * 0.08, r * 0.045, 8],
    [cx - r * 0.4, cy - r * 0.24, r * 0.09, r * 0.04, -20],
  ]
    .map(([x, y, rx, ry, angle]) => `<ellipse class="fill" cx="${fmt(x)}" cy="${fmt(y)}" rx="${fmt(rx)}" ry="${fmt(ry)}" transform="rotate(${angle} ${fmt(x)} ${fmt(y)})" fill="#ffffff"/>`)
    .join('')
  const sparkles = shuffle(rng, [
    [46, 70],
    [254, 86],
    [60, 320],
    [244, 330],
    [150, 50],
  ])
    .slice(0, 3)
    .map(([x, y], i) => sparkleAt(ctx, x, y, between(rng, 14, 22), color(ctx, i + 1)))
  const rays = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * TAU
    return `M${pt(vec(cx + Math.cos(angle) * r * 1.25, cy + Math.sin(angle) * r * 1.05))} L${pt(vec(cx + Math.cos(angle) * r * 1.45, cy + Math.sin(angle) * r * 1.25))}`
  })
  const background = rng() < 0.5 ? sunburst(cx, cy, 20, spectrum(ctx, 2)) : ink(rays.join(' '), pens.line, 5)
  return {
    background: pens.background,
    body:
      background +
      fill(polyD(shadow), pens.line) +
      clipped(`${uid}-l`, rect(color(ctx, 0)) + fill(dots.join(' '), color(ctx, 3)) + shines) +
      ink(seam, pens.line, 5) +
      ink(polyD(outline), pens.line, 5.4) +
      sparkles.join(''),
    defs: clipPath(`${uid}-l`, polyD(outline)),
  }
}
