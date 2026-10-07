import { bulge, circleD, clipPath, clipped, fill, ink, levelLines, loopsD, polyD, range, rect, regions, type Art } from '../draw'
import { color, HEIGHT, WIDTH, type ArtContext } from '../context'
import { flower, motifShapes } from '../shapes'
import { vec } from '../../geometry'
import { between, intBetween, pick, shuffle } from '../../random'

const checker = (u: number, v: number, size: number) => Math.sin((u / size) * Math.PI) * Math.sin((v / size) * Math.PI)

export function checkerBulge(ctx: ArtContext): Art {
  const { rng, pens, hand, uid } = ctx
  const size = between(rng, 34, 44)
  const spheres: [number, number, number][] =
    rng() < 0.6
      ? [[WIDTH / 2, HEIGHT / 2, 120]]
      : [
          [WIDTH * 0.34, HEIGHT * 0.32, 92],
          [WIDTH * 0.68, HEIGHT * 0.7, 84],
        ]
  const warps = spheres.map(([x, y, r]) => bulge(x, y, r, 0.55))
  const angle = pick(rng, [0, Math.PI / 4])
  const field = hand.field((x, y) => {
    let p: [number, number] = [x, y]
    for (const warp of warps) p = warp(p[0], p[1])
    return checker(p[0] * Math.cos(angle) + p[1] * Math.sin(angle), -p[0] * Math.sin(angle) + p[1] * Math.cos(angle), size)
  })
  const cells = loopsD(regions(field))
  const defs = spheres.map(([x, y, r], i) => clipPath(`${uid}-s${i}`, circleD(x, y, r * 0.95))).join('')
  const inner = spheres.map((_, i) => clipped(`${uid}-s${i}`, rect(color(ctx, 3)) + fill(cells, color(ctx, 2)))).join('')
  return { background: color(ctx, 1), body: fill(cells, color(ctx, 0)) + inner + ink(cells, pens.line, 3.6), defs }
}

export function stripeInversion(ctx: ArtContext): Art {
  const { rng, hand, uid, motif } = ctx
  const period = between(rng, 22, 28)
  const shape = hand.points(motifShapes[motif](rng, WIDTH / 2, HEIGHT / 2, between(rng, 105, 125)))
  const amp = between(rng, 8, 16)
  const freq = between(rng, 0.018, 0.032)
  const outside = hand.field((x, y) => Math.sin(((y + amp * Math.sin(x * freq)) / period) * Math.PI))
  const inside = hand.field((x, y) => Math.sin(((x + amp * Math.sin(y * freq)) / period) * Math.PI))
  return {
    background: ctx.pens.background,
    body: fill(loopsD(regions(outside)), color(ctx, 0)) + clipped(`${uid}-m`, rect(color(ctx, 3)) + fill(loopsD(regions(inside)), color(ctx, 2))),
    defs: clipPath(`${uid}-m`, polyD(shape)),
  }
}

export function interference(ctx: ArtContext): Art {
  const { rng, pens, hand } = ctx
  const a = vec(between(rng, 80, 130), between(rng, 110, 170))
  const b = vec(between(rng, 170, 220), between(rng, 230, 300))
  const period = between(rng, 42, 52)
  const field = hand.field(
    (x, y) => Math.sin((Math.hypot(x - a.x, y - a.y) / period) * Math.PI) * Math.sin((Math.hypot(x - b.x, y - b.y) / period) * Math.PI),
  )
  const cells = loopsD(regions(field))
  return { background: color(ctx, 1), body: fill(cells, color(ctx, 0)) + ink(cells, pens.line, 3.4) }
}

export function twist(ctx: ArtContext): Art {
  const { rng, pens, hand } = ctx
  const cx = WIDTH / 2 + between(rng, -30, 30)
  const cy = HEIGHT / 2 + between(rng, -40, 40)
  const turn = between(rng, 0.005, 0.01)
  const sectors = pick(rng, [6, 8, 10])
  const ring = between(rng, 30, 40)
  const field = hand.field((x, y) => {
    const r = Math.hypot(x - cx, y - cy)
    const t = Math.atan2(y - cy, x - cx) + r * turn
    return Math.sin((r / ring) * Math.PI) * Math.sin((t * sectors) / 2)
  })
  const cells = loopsD(regions(field, 0, 1.5))
  return { background: color(ctx, 1), body: fill(cells, color(ctx, 0)) + ink(cells, pens.line, 3.4) }
}

export function groovy(ctx: ArtContext): Art {
  const { rng, hand } = ctx
  const size = between(rng, 40, 52)
  const amp = between(rng, 14, 24)
  const field = hand.field((x, y) => checker(x + amp * Math.sin(y * 0.022), y + amp * Math.sin(x * 0.026 + 1), size))
  const spots = shuffle(rng, [
    [85, 95],
    [215, 160],
    [105, 280],
    [225, 335],
  ]).slice(0, intBetween(rng, 2, 3))
  const flowers = spots.map(([x, y]) => {
    const r = between(rng, 48, 66)
    return fill(polyD(hand.points(flower(rng, x, y, r))), color(ctx, 2)) + fill(circleD(x, y, r * 0.3), color(ctx, 3))
  })
  return { background: color(ctx, 1), body: fill(loopsD(regions(field)), color(ctx, 0)) + flowers.join('') }
}

export function waves(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.6)
  const angle = (pick(rng, [0, -14, 14, -24, 24]) * Math.PI) / 180
  const gap = between(rng, 18, 24)
  const freq = between(rng, 0.018, 0.026)
  const amp = between(rng, 0.3, 0.38) / freq
  const field = hand.field((x, y) => {
    const u = x * Math.cos(angle) + y * Math.sin(angle)
    const v = -x * Math.sin(angle) + y * Math.cos(angle)
    return (v + amp * Math.sin(u * freq)) / Math.sqrt(1 + 0.5 * (amp * freq * Math.cos(u * freq)) ** 2)
  })
  const levels = range(-300, 600, gap)
  const lines = levelLines(field, levels)
  const bands = levels.map((_, k) => fill(loopsD(lines[levels.length - 1 - k]), color(ctx, levels.length - 1 - k))).join('')
  return { background: pens.background, body: bands + ink(lines.flat().map(polyD).join(' '), pens.line) }
}
