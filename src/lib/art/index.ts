import type { StyleId } from '../data/catalog'
import type { Combination } from '../generator'
import { createContext, HEIGHT, WIDTH, type ArtContext } from './context'
import { withoutOutlines, type Art } from './draw'
import { athos, britto, tarsila, volpi } from './styles/brazilian'
import { haring, kusama, milhazes } from './styles/contemporary'
import { daisies } from './styles/daisies'
import { geometric } from './styles/geometric'
import { hatched } from './styles/hatched'
import { kandinsky, matisse, mondrian, vangogh } from './styles/modernists'
import { lines3d, pop } from './styles/motifs'
import { eye, lips, mushrooms } from './styles/objects'
import { onion } from './styles/onion'
import { checkerBulge, groovy, interference, stripeInversion, twist, waves } from './styles/op'
import { spiderweb } from './styles/spiderweb'
import { tiles } from './styles/tiles'
import { vase } from './styles/vase'

export { pensFor } from './context'

const renderers: Record<StyleId, (ctx: ArtContext) => Art> = {
  spiderweb,
  checkerBulge,
  stripeInversion,
  lines3d,
  vase,
  pop,
  groovy,
  interference,
  twist,
  waves,
  daisies,
  onion,
  mushrooms,
  eye,
  lips,
  tiles,
  hatched,
  geometric,
  tarsila,
  volpi,
  britto,
  athos,
  vangogh,
  mondrian,
  matisse,
  kandinsky,
  kusama,
  milhazes,
  haring,
}

let counter = 0

export function inkedIn(svg: string): (color: string) => boolean {
  const used = new Set(svg.match(/"#[0-9a-f]{6}"/g))
  return (color) => used.has(`"${color}"`)
}

export function renderArt(combo: Combination, outlined = true): string {
  const uid = `art${counter++}`
  const ctx = createContext(combo, uid, outlined)
  const art = renderers[combo.style.id](ctx)
  const body = outlined ? art.body : withoutOutlines(art.body, ctx.pens.line)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" stroke-linecap="round" stroke-linejoin="round"><defs><clipPath id="${uid}-page"><rect width="${WIDTH}" height="${HEIGHT}"/></clipPath>${art.defs ?? ''}</defs><rect width="${WIDTH}" height="${HEIGHT}" fill="${art.background}"/><g clip-path="url(#${uid}-page)">${body}</g></svg>`
}
