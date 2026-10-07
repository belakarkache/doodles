import { fmt, lerp, vec, type Vec } from '../../geometry'
import { between, pick } from '../../random'
import { color, HEIGHT, WIDTH, type ArtContext } from '../context'
import { fill, ink, type Art } from '../draw'

type Lens = { x: number; y: number; diagonal: number }

export function onion(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const angle = pick(rng, [-30, -22, 0, 22, 30])
  const w = between(rng, 70, 92)
  const h = w * between(rng, 1.2, 1.6)
  const bend = h * between(rng, 0.2, 0.3)
  const count = Math.max(3, Math.round(w / 22))
  const cx = WIDTH / 2
  const cy = HEIGHT / 2
  const lenses: Lens[] = []
  for (let j = -Math.ceil(620 / h); j <= Math.ceil(620 / h); j++) {
    for (let i = -Math.ceil(320 / w); i <= Math.ceil(320 / w); i++) {
      const column = 2 * i + (Math.abs(j) % 2)
      lenses.push({ x: cx + (column * w) / 2, y: cy + (j * h) / 2, diagonal: (column - j) / 2 })
    }
  }

  const curve = (lens: Lens, t: number) => {
    const top = vec(lens.x, lens.y - h / 2)
    const bottom = vec(lens.x, lens.y + h / 2)
    const side = lerp(vec(lens.x - w / 2, lens.y), vec(lens.x + w / 2, lens.y), t)
    const shift = (p: Vec, k: number) => `${fmt(p.x)} ${fmt(p.y + k)}`
    return {
      forward: `M${shift(top, 0)} C${shift(top, bend)} ${shift(side, -bend)} ${shift(side, 0)} C${shift(side, bend)} ${shift(bottom, -bend)} ${shift(bottom, 0)}`,
      backward: `C${shift(bottom, -bend)} ${shift(side, bend)} ${shift(side, 0)} C${shift(side, -bend)} ${shift(top, bend)} ${shift(top, 0)}`,
    }
  }

  const body = lenses.map((lens) => {
    const parts: string[] = []
    for (let k = 0; k < count; k++) {
      const a = curve(lens, k / count)
      const b = curve(lens, (k + 1) / count)
      parts.push(fill(`${a.forward} ${b.backward} Z`, color(ctx, lens.diagonal + k)))
    }
    for (let k = 0; k <= count; k++) parts.push(ink(curve(lens, k / count).forward, pens.line, 4.2))
    return parts.join('')
  })
  return { background: pens.background, body: `<g transform="rotate(${angle} ${cx} ${cy})">${body.join('')}</g>` }
}
