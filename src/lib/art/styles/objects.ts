import { fmt, pt, vec, type Vec } from '../../geometry'
import { between, intBetween, pick, shuffle } from '../../random'
import { color, HEIGHT, WIDTH, type ArtContext } from '../context'
import { bulge, circleD, clipPath, clipped, fill, ink, loopsD, polyD, range, rect, regions, sunburst, type Art } from '../draw'
import { eye as eyeShape, lips as lipsShape, motifShapes, mushroom } from '../shapes'

const TAU = Math.PI * 2

function sparkleAt(ctx: ArtContext, x: number, y: number, r: number, fillColor: string): string {
  return ink(polyD(motifShapes.sparkle(ctx.rng, x, y, r)), ctx.pens.line, 3.4, fillColor)
}

function backdrop(ctx: ArtContext, focusY: number): string {
  const { rng } = ctx
  const kind = pick(rng, ['rays', 'arches', 'stripes'])
  if (kind === 'rays') return sunburst(WIDTH / 2, focusY, pick(rng, [18, 22, 26]), color(ctx, 3))
  if (kind === 'arches') {
    return [4, 3, 2, 1]
      .map((i) => ink(circleD(WIDTH / 2, HEIGHT + 20, 90 + i * 60), ctx.pens.line, 4, color(ctx, i + 1)))
      .join('')
  }
  const period = between(rng, 24, 30)
  const amp = between(rng, 6, 12)
  const field = ctx.hand.field((x, y) => Math.sin(((y + amp * Math.sin(x * 0.03)) / period) * Math.PI))
  return fill(loopsD(regions(field)), color(ctx, 3))
}

function capPattern(ctx: ArtContext, cx: number, cy: number, r: number, base: string, accent: string): string {
  const { rng, hand } = ctx
  const kind = pick(rng, ['dots', 'dots', 'stripes', 'checker'])
  if (kind === 'dots') {
    const centers: Vec[] = []
    for (let attempt = 0; attempt < 200 && centers.length < 7; attempt++) {
      const p = vec(cx + between(rng, -0.8, 0.8) * r, cy - between(rng, 0.15, 0.85) * r)
      if (centers.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > r * 0.36)) centers.push(p)
    }
    const dots = centers.map((p) => circleD(p.x, p.y, r * between(rng, 0.09, 0.14)))
    return rect(base) + ink(dots.join(' '), ctx.pens.line, 3.2, accent)
  }
  const size = r * between(rng, 0.22, 0.3)
  const warp = bulge(cx, cy - r * 0.4, r * 0.8, 0.45)
  const field = hand.field((x, y) => {
    const [u, v] = warp(x, y)
    return kind === 'stripes' ? Math.sin(((u - cx) / size) * Math.PI) : Math.sin(((u - cx) / size) * Math.PI) * Math.sin(((v - cy) / size) * Math.PI)
  })
  return rect(base) + fill(loopsD(regions(field)), accent)
}

export function mushrooms(ctx: ArtContext): Art {
  const { rng, pens, uid } = ctx
  const ground = HEIGHT - 46
  const count = pick(rng, [1, 2, 2, 3])
  const layout =
    count === 1
      ? [{ x: WIDTH / 2, r: between(rng, 110, 125) }]
      : count === 2
        ? [
            { x: WIDTH * 0.42, r: between(rng, 95, 108) },
            { x: WIDTH * 0.8, r: between(rng, 52, 62) },
          ]
        : [
            { x: WIDTH * 0.5, r: between(rng, 90, 100) },
            { x: WIDTH * 0.16, r: between(rng, 46, 54) },
            { x: WIDTH * 0.84, r: between(rng, 56, 66) },
          ]
  const hand = ctx.hand.softer(0.6)
  const defs: string[] = []
  const bodies = layout
    .slice()
    .sort((a, b) => a.r - b.r)
    .map(({ x, r }, i) => {
      const cy = ground - r * 0.85
      const outline = polyD(hand.points(mushroom(rng, x, cy, r)))
      const shapeId = `${uid}-m${i}`
      const capId = `${uid}-c${i}`
      defs.push(clipPath(shapeId, outline), `<clipPath id="${capId}"><rect x="-20" y="-20" width="${WIDTH + 40}" height="${fmt(cy + r * 0.1 + 20)}"/></clipPath>`)
      const stem = rect(pens.background)
      const cap = clipped(capId, capPattern(ctx, x, cy, r, color(ctx, i * 2), color(ctx, i * 2 + 1)))
      const gills = ink(`M${pt(vec(x - r * 0.55, cy + r * 0.1))} Q${pt(vec(x, cy + r * 0.24))} ${pt(vec(x + r * 0.55, cy + r * 0.1))}`, pens.line, 3.6)
      return clipped(shapeId, stem + cap) + gills + ink(outline, pens.line, 4.8)
    })
  const tufts = range(18, WIDTH - 10, between(rng, 34, 48)).map((x) => {
    const h = between(rng, 10, 18)
    return ink(`M${fmt(x - 6)} ${ground} q2 ${fmt(-h)} 4 ${fmt(-h)} M${fmt(x)} ${ground} q0 ${fmt(-h * 1.3)} 1 ${fmt(-h * 1.3)} M${fmt(x + 6)} ${ground} q-2 ${fmt(-h)} -4 ${fmt(-h)}`, pens.line, 3.4)
  })
  const sparkles = shuffle(rng, [
    [40, 50],
    [250, 60],
    [150, 34],
    [30, 170],
    [270, 190],
  ])
    .slice(0, intBetween(rng, 2, 4))
    .map(([x, y], i) => sparkleAt(ctx, x, y, between(rng, 12, 18), color(ctx, i + 2)))
  return {
    background: pens.background,
    body: backdrop(ctx, ground - 120) + fill(`M-20 ${ground} H${WIDTH + 20} V${HEIGHT + 20} H-20 Z`, color(ctx, 1)) + ink(`M-20 ${ground} H${WIDTH + 20}`, pens.line, 4.4) + tufts.join('') + bodies.join('') + sparkles.join(''),
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
  const background = rng() < 0.5 ? sunburst(cx, cy, 20, color(ctx, 2)) : ink(rays.join(' '), pens.line, 5)
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
