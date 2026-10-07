import { add, fromAngle, lerp, polylinePath, scale, sub, TAU, vec, type Vec } from '../../geometry'
import { between, intBetween } from '../../random'
import { color, HEIGHT, WIDTH, type ArtContext } from '../context'
import { fill, ink, polyD, type Art } from '../draw'

const STRAND_SAMPLES = 10
const REACH = 560

function ringRadii(first: number, gap: number, growth: number): number[] {
  const radii: number[] = []
  for (let r = first, k = 0; r < REACH; k++) {
    radii.push(r)
    r += gap * (1 + k * growth)
  }
  return radii
}

export function spiderweb(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.6)
  const center = vec(WIDTH / 2 + between(rng, -50, 50), HEIGHT / 2 + between(rng, -70, 70))
  const spokes = intBetween(rng, 9, 13)
  const turn = between(rng, 0, TAU)
  const angles = Array.from({ length: spokes }, (_, i) => turn + ((i + between(rng, -0.18, 0.18)) / spokes) * TAU)
  const radii = ringRadii(between(rng, 14, 22), between(rng, 28, 38), between(rng, 0.04, 0.08))
  const wobble = radii.map(() => angles.map(() => between(rng, 0.92, 1.08)))
  const sag = between(rng, 0.12, 0.2)
  const node = (i: number, k: number) => add(center, fromAngle(angles[i % spokes], radii[k] * wobble[k][i % spokes]))

  const strand = (i: number, k: number): Vec[] => {
    const a = node(i, k)
    const b = node(i + 1, k)
    const pull = add(center, scale(sub(lerp(a, b, 0.5), center), 1 - sag * 2))
    return hand.points(Array.from({ length: STRAND_SAMPLES + 1 }, (_, s) => {
      const t = s / STRAND_SAMPLES
      return lerp(lerp(a, pull, t), lerp(pull, b, t), t)
    }))
  }

  const strands = radii.map((_, k) => angles.map((_, i) => strand(i, k)))
  const withBackground = rng() < 0.5
  const cells: string[] = []
  for (let k = 0; k < radii.length - 1; k++) {
    strands[k].forEach((inner, i) => {
      const outer = strands[k + 1][i]
      const even = (i + k) % 2 === 0
      const cellColor = even ? color(ctx, k % 2 ? 0 : 2) : withBackground ? pens.background : color(ctx, k % 2 ? 1 : 3)
      cells.push(fill(polyD([...inner, ...[...outer].reverse()]), cellColor))
    })
  }
  const hub = fill(polyD(strands[0].flat()), color(ctx, 1))
  const rings = strands.map((ring) => polyD(ring.flat())).join(' ')
  const threads = angles.map((_, i) => polylinePath(hand.points([center, ...radii.map((_, k) => node(i, k))]))).join(' ')
  return { background: pens.background, body: cells.join('') + hub + ink(threads, pens.line, 5.6) + ink(rings, pens.line, 5.6) }
}
