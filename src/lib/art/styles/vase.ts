import { add, catmullRom, fmt, normalize, perpendicular, pt, scale, sub, vec, type Vec } from '../../geometry'
import { between, intBetween, pick, type Rng } from '../../random'
import { color, HEIGHT, WIDTH, type ArtContext } from '../context'
import { bulge, circleD, clipPath, clipped, fill, ink, loopsD, polyD, rect, regions, sunburst, type Art } from '../draw'
import { flower, leaf } from '../shapes'

type Vase = { outline: Vec[]; mouth: Vec; lip: number }

const RIM_SQUASH = 0.28

function vaseShape(rng: Rng, cx: number, bottom: number, height: number, width: number): Vase {
  const foot = width * between(rng, 0.24, 0.36)
  const belly = width * 0.5
  const neck = width * between(rng, 0.16, 0.26)
  const lip = neck * between(rng, 1.15, 1.5)
  const bellyAt = between(rng, 0.25, 0.5)
  const neckAt = between(rng, 0.72, 0.85)
  const profile = [
    [0, foot],
    [0.04, foot * 1.02],
    [bellyAt * 0.5, belly * 0.86],
    [bellyAt, belly],
    [(bellyAt + neckAt) / 2, (belly + neck) / 2 + width * 0.04],
    [neckAt, neck],
    [0.94, lip * 0.92],
    [1, lip],
  ].map(([t, r]) => vec(cx + r, bottom - t * height))
  const right = catmullRom(profile, 10)
  const left = [...right].reverse().map((p) => vec(cx * 2 - p.x, p.y))
  return { outline: [...right, ...left], mouth: vec(cx, bottom - height), lip }
}

function vasePattern(ctx: ArtContext, centerY: number): string {
  const { rng, hand } = ctx
  const size = between(rng, 22, 28)
  const warp = bulge(WIDTH / 2, centerY, 80, 0.4)
  const kind = pick(rng, ['checker', 'waves', 'zigzag'])
  const field = hand.field((x, y) => {
    if (kind === 'checker') {
      const [u, w] = warp(x, y)
      return Math.sin((u / size) * Math.PI) * Math.sin((w / size) * Math.PI)
    }
    if (kind === 'waves') return Math.sin(((y + 9 * Math.sin(x * 0.05)) / size) * Math.PI)
    return Math.sin(((y + Math.abs((((x - WIDTH / 2) % 36) + 36) % 36 - 18) * 0.96) / size) * Math.PI)
  })
  return loopsD(regions(field))
}

function axisFrame(base: Vec, tip: Vec) {
  const axis = sub(tip, base)
  const length = Math.hypot(axis.x, axis.y)
  const dir = normalize(axis)
  const side = perpendicular(dir)
  return (along: number, across: number) => add(add(base, scale(dir, along * length)), scale(side, across * length))
}

function monstera(ctx: ArtContext, base: Vec, tip: Vec, fillColor: string): string {
  const { rng, pens } = ctx
  const at = axisFrame(base, tip)
  const halfWidth = (t: number) => 0.48 * Math.sin(Math.PI * t) * (1 - 0.15 * t)
  const outline: Vec[] = []
  for (let i = 0; i <= 40; i++) outline.push(at(0.5 - 0.5 * Math.cos((Math.PI * i) / 40), halfWidth(i / 40)))
  for (let i = 40; i >= 0; i--) outline.push(at(0.5 - 0.5 * Math.cos((Math.PI * i) / 40), -halfWidth(i / 40)))
  const slits: string[] = []
  const count = intBetween(rng, 3, 4)
  for (let s = 1; s <= count; s++) {
    const along = 0.18 + (s / (count + 1)) * 0.7
    for (const sign of [1, -1]) {
      const edge = halfWidth(along)
      slits.push(`M${pt(at(along + 0.05, sign * edge * 1.05))} L${pt(at(along - 0.02, sign * edge * 0.35))}`)
    }
  }
  return ink(polyD(outline), pens.line, 3.8, fillColor) + ink(`M${pt(base)} L${pt(at(0.92, 0))}`, pens.line, 3.4) + ink(slits.join(' '), pens.background, 7) + ink(slits.join(' '), pens.line, 3)
}

function begonia(ctx: ArtContext, base: Vec, tip: Vec, fillColor: string): string {
  const at = axisFrame(base, tip)
  const outline = catmullRom([at(0, 0), at(0.25, 0.22), at(0.6, 0.2), at(1, 0), at(0.6, -0.14), at(0.25, -0.18)], 12, true)
  return ink(polyD(outline), ctx.pens.line, 3.8, fillColor)
}

function snakeLeaf(ctx: ArtContext, base: Vec, height: number, lean: number, width: number, fillColor: string): string {
  const tip = vec(base.x + lean, base.y - height)
  const d = `M${pt(vec(base.x - width / 2, base.y))} Q${pt(vec(base.x - width * 0.7 + lean * 0.4, base.y - height * 0.55))} ${pt(tip)} Q${pt(vec(base.x + width * 0.7 + lean * 0.4, base.y - height * 0.55))} ${pt(vec(base.x + width / 2, base.y))} Z`
  return ink(d, ctx.pens.line, 3.8, fillColor)
}

function petiole(ctx: ArtContext, root: Vec, base: Vec, spread: number): string {
  const bend = vec((root.x + base.x) / 2 - spread * 10, (root.y + base.y) / 2)
  return ink(`M${pt(root)} Q${pt(bend)} ${pt(base)}`, ctx.pens.line, 4.4)
}

function daisy(ctx: ArtContext, center: Vec, r: number, fillColor: string, middle: string): string {
  return ink(polyD(flower(ctx.rng, center.x, center.y, r)), ctx.pens.line, 3.8, fillColor) + ink(circleD(center.x, center.y, r * 0.3), ctx.pens.line, 3.8, middle)
}

function tulip(ctx: ArtContext, center: Vec, r: number, fillColor: string): string {
  const { x, y } = center
  const controls = [
    vec(x - r * 0.75, y - r * 0.55),
    vec(x - r * 0.35, y - r * 0.15),
    vec(x, y - r * 0.75),
    vec(x + r * 0.35, y - r * 0.15),
    vec(x + r * 0.75, y - r * 0.55),
    vec(x + r * 0.62, y + r * 0.35),
    vec(x, y + r * 0.62),
    vec(x - r * 0.62, y + r * 0.35),
  ]
  return ink(polyD(catmullRom(controls, 10, true)), ctx.pens.line, 3.8, fillColor)
}

const spreadOf = (i: number, count: number) => (count === 1 ? 0 : (i / (count - 1) - 0.5) * 2)

function plants(ctx: ArtContext, vase: Vase, kind: string): string {
  const { rng, pens } = ctx
  const { mouth, lip } = vase
  const parts: string[] = []
  const leafColor = (i: number) => (i % 2 ? color(ctx, 0) : color(ctx, 2))
  if (kind === 'flowers') {
    const count = intBetween(rng, 1, 3)
    for (let i = 0; i < count; i++) {
      const spread = spreadOf(i, count)
      const head = vec(WIDTH / 2 + spread * 72 + between(rng, -8, 8), mouth.y - between(rng, 100, 140) + Math.abs(spread) * 28)
      const bend = vec(WIDTH / 2 + spread * 12, mouth.y - 40)
      const stem = `M${pt(vec(WIDTH / 2 + spread * lip * 0.4, mouth.y + 10))} Q${pt(bend)} ${pt(head)}`
      const leafAt = vec((bend.x + head.x) / 2 + (spread >= 0 ? 16 : -16), (bend.y + head.y) / 2 + 14)
      const petals = color(ctx, i + 1)
      const bloom = rng() < 0.6 ? daisy(ctx, head, between(rng, 32, 42), petals, color(ctx, i + 2)) : tulip(ctx, head, between(rng, 30, 38), petals)
      parts.push(ink(stem, pens.line, 4.4) + ink(polyD(leaf(rng, leafAt.x, leafAt.y, 22)), pens.line, 3.8, color(ctx, 2)) + bloom)
    }
    return parts.join('')
  }
  if (kind === 'snake') {
    const count = intBetween(rng, 4, 6)
    for (let i = 0; i < count; i++) {
      const spread = spreadOf(i, count)
      parts.push(snakeLeaf(ctx, vec(WIDTH / 2 + spread * lip * 0.45, mouth.y + lip * RIM_SQUASH + 8), between(rng, 140, 210) - Math.abs(spread) * 40, spread * 50, between(rng, 18, 24), leafColor(i)))
    }
    return parts.join('')
  }
  const count = kind === 'monstera' ? intBetween(rng, 3, 4) : intBetween(rng, 4, 6)
  for (let i = 0; i < count; i++) {
    const spread = spreadOf(i, count)
    const root = vec(WIDTH / 2 + spread * lip * 0.3, mouth.y + 10)
    const reach = kind === 'monstera' ? between(rng, 150, 200) : between(rng, 110, 170)
    const tip = vec(WIDTH / 2 + spread * 128, mouth.y - reach + Math.abs(spread) * 50)
    const base = vec(root.x + (tip.x - root.x) * 0.3, root.y + (tip.y - root.y) * 0.36)
    const blade = kind === 'monstera' ? monstera(ctx, base, tip, leafColor(i)) : begonia(ctx, base, tip, leafColor(i))
    parts.push(petiole(ctx, root, base, spread) + blade)
  }
  return parts.join('')
}

function arches(ctx: ArtContext, cx: number, cy: number): string {
  return [3, 2, 1, 0]
    .map((i) => ink(circleD(cx, cy, 70 + i * 36), ctx.pens.line, 4, color(ctx, i)))
    .join('')
}

export function vase(ctx: ArtContext): Art {
  const { rng, pens, uid } = ctx
  const hand = ctx.hand.softer(0.7)
  const ground = HEIGHT - 30
  const kind = pick(rng, ['flowers', 'flowers', 'monstera', 'snake', 'begonia'])
  const shape = vaseShape(rng, WIDTH / 2, ground, kind === 'flowers' ? between(rng, 150, 180) : between(rng, 120, 145), between(rng, 130, 165))
  const outline = hand.points(shape.outline)
  const pattern = vasePattern(ctx, ground - 70)
  const back = rng() < 0.5 ? sunburst(WIDTH / 2, shape.mouth.y - 40, 24, color(ctx, 3)) : arches(ctx, WIDTH / 2, ground)
  const rx = shape.lip
  const ry = shape.lip * RIM_SQUASH
  const mouthY = shape.mouth.y
  const left = WIDTH / 2 - rx
  const opening = `M${fmt(left)} ${fmt(mouthY)} a${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(rx * 2)} 0 a${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(-rx * 2)} 0 Z`
  const rim = `M${fmt(left)} ${fmt(mouthY)} a${fmt(rx)} ${fmt(ry)} 0 0 0 ${fmt(rx * 2)} 0`
  const above = `M-20 -20 H${WIDTH + 20} V${fmt(mouthY)} H-20 Z`
  return {
    background: pens.background,
    body:
      back +
      ink(`M14 ${ground} L${WIDTH - 14} ${ground}`, pens.line, 4.4) +
      clipped(`${uid}-v`, rect(color(ctx, 1)) + fill(pattern, color(ctx, 0))) +
      ink(polyD(outline), pens.line, 4.6) +
      ink(opening, pens.line, 3.8, pens.line) +
      `<g clip-path="url(#${uid}-p)">${plants(ctx, shape, kind)}</g>` +
      ink(rim, pens.line, 4.6),
    defs: clipPath(`${uid}-v`, polyD(outline)) + `<clipPath id="${uid}-p"><path d="${above}"/><path d="${opening}"/></clipPath>`,
  }
}
