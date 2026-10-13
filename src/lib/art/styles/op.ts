import { bulge, circleD, clipPath, clipped, fill, ink, loopsD, onCell, paint, polyD, range, rect, regions, type Art } from '../draw'
import { color, except, HEIGHT, tone, WIDTH, type ArtContext } from '../context'
import { flower, motifShapes } from '../shapes'
import { vec } from '../../geometry'
import { distance } from '../../theme'
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
  const warped = (x: number, y: number): [number, number] => {
    let p: [number, number] = [x, y]
    for (const warp of warps) p = warp(p[0], p[1])
    return [p[0] * Math.cos(angle) + p[1] * Math.sin(angle), -p[0] * Math.sin(angle) + p[1] * Math.cos(angle)]
  }
  const field = hand.field((x, y) => checker(...warped(x, y), size))
  const loops = regions(field)
  const others = except(ctx, 1, 2, 3)
  const cells = loopsD(loops)
  const defs = spheres.map(([x, y, r], i) => clipPath(`${uid}-s${i}`, circleD(x, y, r * 0.95))).join('')
  const inner = spheres.map((_, i) => clipped(`${uid}-s${i}`, rect(color(ctx, 3)) + fill(cells, color(ctx, 2)))).join('')
  return { background: color(ctx, 1), body: paint(loops, ({ x, y }) => {
    const [u, v] = warped(x, y)
    return tone(ctx, others, ...onCell(u / size, v / size))
  }) + inner + ink(cells, pens.line, 3.6), defs }
}

export function stripeInversion(ctx: ArtContext): Art {
  const { rng, hand, uid, motif } = ctx
  const period = between(rng, 22, 28)
  const shape = hand.points(motifShapes[motif](rng, WIDTH / 2, HEIGHT / 2, between(rng, 105, 125)))
  const amp = between(rng, 8, 16)
  const freq = between(rng, 0.018, 0.032)
  const band = (x: number, y: number) => (y + amp * Math.sin(x * freq)) / period
  const outside = hand.field((x, y) => Math.sin(band(x, y) * Math.PI))
  const others = except(ctx, 2, 3)
  const inside = hand.field((x, y) => Math.sin(((x + amp * Math.sin(y * freq)) / period) * Math.PI))
  return {
    background: ctx.pens.background,
    body: paint(regions(outside), ({ x, y }) => tone(ctx, others, Math.floor(band(x, y) / 2))) + clipped(`${uid}-m`, rect(color(ctx, 3)) + fill(loopsD(regions(inside)), color(ctx, 2))),
    defs: clipPath(`${uid}-m`, polyD(shape)),
  }
}

export function interference(ctx: ArtContext): Art {
  const { rng, hand, pens } = ctx
  const a = vec(between(rng, 80, 130), between(rng, 110, 170))
  const b = vec(between(rng, 170, 220), between(rng, 230, 300))
  const period = between(rng, 42, 52)
  const field = hand.field((x, y) => checker(Math.hypot(x - a.x, y - a.y) / period, Math.hypot(x - b.x, y - b.y) / period, 1))
  const loops = regions(field)
  const sameLine = rng() < 0.5
  const y = color(ctx, 1)
  const x = pens.colors.reduce((a, b) => (distance(b, y) > distance(a, y) ? b : a))
  const lines = ctx.outlined ? ink(loopsD(loops), sameLine ? x : pens.line, 3.4) : ''
  return { background: y, body: fill(loopsD(loops), x) + lines }
}

export function twist(ctx: ArtContext): Art {
  const { rng, pens, hand } = ctx
  const cx = WIDTH / 2 + between(rng, -30, 30)
  const cy = HEIGHT / 2 + between(rng, -40, 40)
  const turn = between(rng, 0.005, 0.01)
  const sectors = pick(rng, [6, 8, 10])
  const ring = between(rng, 30, 40)
  const polar = (x: number, y: number): [number, number] => {
    const r = Math.hypot(x - cx, y - cy)
    const t = Math.atan2(y - cy, x - cx) + r * turn
    return [r / ring, (t * sectors) / (2 * Math.PI)]
  }
  const field = hand.field((x, y) => checker(...polar(x, y), 1))
  const loops = regions(field, 0, 1.5)
  const others = except(ctx, 1)
  const body = paint(loops, ({ x, y }) => tone(ctx, others, ...onCell(...polar(x, y))))
  return { background: color(ctx, 1), body: body + ink(loopsD(loops), pens.line, 3.4) }
}

export function groovy(ctx: ArtContext): Art {
  const { rng, hand } = ctx
  const size = between(rng, 40, 52)
  const amp = between(rng, 14, 24)
  const swirl = (x: number, y: number): [number, number] => [(x + amp * Math.sin(y * 0.022)) / size, (y + amp * Math.sin(x * 0.026 + 1)) / size]
  const field = hand.field((x, y) => checker(...swirl(x, y), 1))
  const spots = shuffle(rng, [
    [85, 95],
    [215, 160],
    [105, 280],
    [225, 335],
  ]).slice(0, intBetween(rng, 2, 3))
  const petals = spots.map((_, i) => 2 + i)
  const flowers = spots.map(([x, y], i) => {
    const r = between(rng, 48, 66)
    return fill(polyD(hand.points(flower(rng, x, y, r))), color(ctx, petals[i])) + fill(circleD(x, y, r * 0.3), color(ctx, petals[i] + 1))
  })
  return { background: color(ctx, 1), body: fill(loopsD(regions(field)), color(ctx, 0)) + flowers.join('') }
}

type Swell = { amp: number; freq: number; phase: number; sharp: number }

function swellAt(swells: Swell[], x: number): number {
  return swells.reduce((y, { amp, freq, phase, sharp }) => {
    const t = x * freq + phase
    return y - amp * (Math.sin(t) + sharp * Math.sin(2 * t - Math.PI / 2))
  }, 0)
}

export function waves(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const angle = pick(rng, [0, 0, -10, 10, -18, 18])
  const lean = between(rng, -0.6, 0.6)
  const inks = pens.colors.slice(0, intBetween(rng, 3, pens.colors.length))
  const bands: string[] = []
  let k = 0
  for (let base = HEIGHT + 200; base > -200; k++) {
    const thickness = between(rng, 44, 78)
    const swells: Swell[] = [
      { amp: between(rng, 12, 24), freq: between(rng, 0.014, 0.024), phase: between(rng, 0, 7) + k * lean, sharp: between(rng, 0.15, 0.35) },
      { amp: between(rng, 3, 9), freq: between(rng, 0.04, 0.07), phase: between(rng, 0, 7), sharp: 0 },
    ]
    const top = range(-140, WIDTH + 150, 6).map((x) => vec(x, base + swellAt(swells, x)))
    const d = polyD([...ctx.hand.softer(0.5).points(top), vec(WIDTH + 150, HEIGHT + 260), vec(-140, HEIGHT + 260)])
    bands.push(fill(d, inks[k % inks.length]))
    base -= thickness
  }
  return {
    background: pens.background,
    body: `<g transform="rotate(${angle} ${WIDTH / 2} ${HEIGHT / 2})">${bands.reverse().join('')}</g>`,
  }
}
