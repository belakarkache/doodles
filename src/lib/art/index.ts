import type { StyleId } from '../data/catalog'
import type { Combination } from '../generator'
import { createContext, HEIGHT, WIDTH, type ArtContext, type OutlineMode } from './context'
import { withoutOutlines, type Art } from './draw'
import { daisies } from './styles/daisies'
import { hatched } from './styles/hatched'
import { lines3d, pop } from './styles/motifs'
import { eye, lips, mushrooms } from './styles/objects'
import { onion } from './styles/onion'
import { checkerBulge, groovy, interference, stripeInversion, twist, waves } from './styles/op'
import { spiderweb } from './styles/spiderweb'
import { tiles } from './styles/tiles'
import { vase } from './styles/vase'

export { pensFor, type OutlineMode } from './context'

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
}

let counter = 0

export function renderArt(combo: Combination, outlines: OutlineMode = 'ink'): string {
  const uid = `art${counter++}`
  const ctx = createContext(combo, uid, outlines)
  const art = renderers[combo.style.id](ctx)
  const body = outlines === 'none' ? withoutOutlines(art.body, ctx.pens.line) : art.body
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" stroke-linecap="round" stroke-linejoin="round"><defs><clipPath id="${uid}-page"><rect width="${WIDTH}" height="${HEIGHT}"/></clipPath>${art.defs ?? ''}</defs><rect width="${WIDTH}" height="${HEIGHT}" fill="${art.background}"/><g clip-path="url(#${uid}-page)">${body}</g></svg>`
}
