import { circleD, clipPath, clipped, fill, ink, levelLines, loopsD, polyD, range, rect, sunburst, type Art } from '../draw'
import { color, HEIGHT, WIDTH, type ArtContext } from '../context'
import { motifShapes, signedDistance } from '../shapes'
import { vec } from '../../geometry'
import { between, pick } from '../../random'

export function lines3d(ctx: ArtContext): Art {
  const { rng, pens, motif } = ctx
  const shape = motifShapes[motif](rng, WIDTH / 2, HEIGHT / 2 + 10, between(rng, 105, 125))
  const distance = signedDistance(shape)
  const lift = between(rng, 16, 26)
  const maxSlope = 0.75
  const ramp = Math.max(between(rng, 18, 30), (lift * 1.6) / maxSlope)
  const field = (x: number, y: number) => {
    const d = distance(x, y)
    const bump = d < 0 ? 1 - Math.exp(d / ramp) : 0
    return y + lift * bump * 1.6 - lift * 0.3 * Math.exp(-Math.max(d, 0) / 14)
  }
  const levels = range(-40, HEIGHT + 60, between(rng, 14, 17))
  const lines = levelLines(field, levels)
  if (motif === 'flower' || rng() < 0.5) {
    return { background: pens.background, body: lines.map((loops, k) => ink(loopsD(loops), color(ctx, k), 5.2)).join('') }
  }
  const bands = levels.map((_, i) => {
    const k = levels.length - 1 - i
    return fill(loopsD(lines[k]), k % 2 ? color(ctx, Math.floor(k / 2)) : pens.background)
  })
  return { background: pens.background, body: bands.join('') + ink(lines.flat().map(polyD).join(' '), pens.line, 3.8) }
}

export function pop(ctx: ArtContext): Art {
  const { rng, pens, hand, uid, motif } = ctx
  const shape = hand.points(motifShapes[motif](rng, WIDTH / 2, HEIGHT / 2, between(rng, 112, 128)))
  const shadow = shape.map((p) => vec(p.x + 12, p.y + 12))
  const step = 15
  const dots: string[] = []
  for (let y = -10; y < HEIGHT + 10; y += step) {
    for (let x = -10; x < WIDTH + 10; x += step) {
      const ox = x + ((Math.round(y / step) % 2) * step) / 2
      const t = Math.max(0, Math.min(1, (ox + y - 160) / 420))
      dots.push(circleD(ox, y, 2.5 + t * 4.2))
    }
  }
  return {
    background: pens.background,
    body:
      sunburst(WIDTH / 2, HEIGHT / 2, pick(rng, [16, 20, 24]), color(ctx, 1)) +
      fill(polyD(shadow), pens.line) +
      clipped(`${uid}-m`, rect(color(ctx, 0)) + fill(dots.join(' '), color(ctx, 2))) +
      ink(polyD(shape), pens.line, 5.5),
    defs: clipPath(`${uid}-m`, polyD(shape)),
  }
}
