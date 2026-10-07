import { add, clipHalfPlane, distance, dot, fromAngle, lerp, normalize, perpendicular, poissonPoints, scale, sub, TAU, vec, voronoiCells, type Vec } from '../../geometry'
import { between, intBetween, pick, type Rng } from '../../random'
import { HEIGHT, WIDTH, type ArtContext } from '../context'
import { fill, polyD, type Art } from '../draw'

const BLEED = 12

type Bloom = { cell: Vec[]; center: Vec; core: number; petals: number }

type Layout = { blooms: Bloom[]; roundness: number }

const box = (x: number, y: number, w: number, h: number): Vec[] => [vec(x, y), vec(x + w, y), vec(x + w, y + h), vec(x, y + h)]

const page = box(-BLEED, -BLEED, WIDTH + BLEED * 2, HEIGHT + BLEED * 2)

function centroid(polygon: Vec[]): Vec {
  return scale(polygon.reduce(add, vec(0, 0)), 1 / polygon.length)
}

function inset(polygon: Vec[], amount: number): Vec[] {
  const middle = centroid(polygon)
  return polygon.reduce((shape, a, i) => {
    if (shape.length === 0) return shape
    const b = polygon[(i + 1) % polygon.length]
    let outward = normalize(perpendicular(sub(b, a)))
    if (dot(outward, sub(middle, a)) > 0) outward = scale(outward, -1)
    return clipHalfPlane(shape, sub(a, scale(outward, amount)), outward)
  }, polygon)
}

function rounded(polygon: Vec[], radius: number): Vec[] {
  return polygon.flatMap((corner, i) => {
    const before = polygon[(i + polygon.length - 1) % polygon.length]
    const after = polygon[(i + 1) % polygon.length]
    const r = Math.min(radius, distance(corner, before) / 2, distance(corner, after) / 2)
    const from = add(corner, scale(normalize(sub(before, corner)), r))
    const to = add(corner, scale(normalize(sub(after, corner)), r))
    return [0, 0.25, 0.5, 0.75, 1].map((t) => lerp(lerp(from, corner, t), lerp(corner, to, t), t))
  })
}

function petalShapes(rng: Rng, bloom: Bloom, gap: number): Vec[][] {
  const { cell, center, core, petals } = bloom
  const turn = between(rng, 0, TAU)
  const edges = Array.from({ length: petals + 1 }, (_, i) => turn + ((i + (i < petals ? between(rng, -0.12, 0.12) : 0)) / petals) * TAU)
  edges[petals] = edges[0] + TAU
  const farthest = Math.max(...cell.map((p) => distance(p, center)))
  return Array.from({ length: petals }, (_, i) => {
    const start = fromAngle(edges[i])
    const end = fromAngle(edges[i + 1])
    const middle = fromAngle((edges[i] + edges[i + 1]) / 2)
    const reach = farthest * (rng() < 0.75 ? 2 : between(rng, 0.75, 1))
    let shape = clipHalfPlane(cell, add(center, scale(perpendicular(start), gap / 2)), scale(perpendicular(start), -1))
    shape = clipHalfPlane(shape, sub(center, scale(perpendicular(end), gap / 2)), perpendicular(end))
    shape = clipHalfPlane(shape, add(center, scale(middle, core + gap)), scale(middle, -1))
    return clipHalfPlane(shape, add(center, scale(middle, reach)), middle)
  }).filter((shape) => shape.length > 2)
}

function gridBlooms(rng: Rng, gap: number): Layout {
  const rects: [number, number, number, number][] = [[-BLEED, -BLEED, WIDTH + BLEED * 2, HEIGHT + BLEED * 2]]
  const target = intBetween(rng, 8, 12)
  while (rects.length < target) {
    rects.sort((a, b) => b[2] * b[3] - a[2] * a[3])
    const [x, y, w, h] = rects.shift()!
    const ratio = between(rng, 0.36, 0.64)
    if (w > h) rects.push([x, y, w * ratio, h], [x + w * ratio, y, w * (1 - ratio), h])
    else rects.push([x, y, w, h * ratio], [x, y + h * ratio, w, h * (1 - ratio)])
  }
  const blooms = rects.map(([x, y, w, h]) => {
    const core = Math.max(12, Math.min(24, Math.min(w, h) * between(rng, 0.14, 0.18)))
    const margin = core + gap * 2
    const center = vec(x + margin + rng() * Math.max(0, w - margin * 2), y + margin + rng() * Math.max(0, h - margin * 2))
    return { cell: inset(box(x, y, w, h), gap / 2), center, core, petals: intBetween(rng, 6, 9) }
  })
  return { blooms, roundness: between(rng, 8, 11) }
}

function packedBlooms(rng: Rng, gap: number): Layout {
  const sites = poissonPoints(rng, WIDTH, HEIGHT, between(rng, 112, 128), -24, 40)
  const blooms = voronoiCells(sites, page)
    .map((cell, i) => {
      const shape = inset(cell, gap / 2)
      const middle = shape.length > 2 ? centroid(shape) : sites[i]
      return { cell: shape, center: lerp(sites[i], middle, 0.4), core: between(rng, 11, 15), petals: intBetween(rng, 5, 6) }
    })
    .filter((bloom) => bloom.cell.length > 2)
  return { blooms, roundness: between(rng, 13, 17) }
}

function circle(center: Vec, r: number): Vec[] {
  return Array.from({ length: 28 }, (_, i) => add(center, fromAngle((i / 28) * TAU, r)))
}

export function daisies(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.45)
  const gap = between(rng, 7, 9)
  const { blooms, roundness } = pick(rng, ['grid', 'packed']) === 'grid' ? gridBlooms(rng, gap) : packedBlooms(rng, gap)
  const cream = ctx.outlines !== 'none' && rng() < 0.5
  const petalColors = pens.colors.filter((c) => c !== pens.line)
  const tint = (i: number) => petalColors[i % petalColors.length]
  const body = blooms.map((bloom, f) => {
    const petals = petalShapes(rng, bloom, gap).map((shape) => polyD(hand.points(rounded(shape, roundness))))
    const petalColor = cream ? pens.background : tint(f)
    const coreColor = cream ? tint(f) : tint(f + 2)
    return fill(petals.join(' '), petalColor) + fill(polyD(hand.points(circle(bloom.center, bloom.core))), coreColor)
  })
  return { background: ctx.outlines === 'none' ? pens.background : pens.line, body: body.join('') }
}
