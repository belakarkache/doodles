import type { Text } from '../i18n.svelte'

export type MotifId = 'heart' | 'flower' | 'star' | 'blob' | 'sparkle' | 'sun' | 'moon' | 'leaf' | 'mushroom' | 'eye' | 'lips'

export type Motif = { id: MotifId; name: Text }

export const motifs: Motif[] = [
  { id: 'heart', name: { pt: 'Coração', en: 'Heart' } },
  { id: 'flower', name: { pt: 'Flor', en: 'Flower' } },
  { id: 'star', name: { pt: 'Estrela', en: 'Star' } },
  { id: 'blob', name: { pt: 'Bolha', en: 'Blob' } },
  { id: 'sparkle', name: { pt: 'Brilho', en: 'Sparkle' } },
  { id: 'sun', name: { pt: 'Sol', en: 'Sun' } },
  { id: 'moon', name: { pt: 'Lua', en: 'Moon' } },
  { id: 'leaf', name: { pt: 'Folha', en: 'Leaf' } },
  { id: 'mushroom', name: { pt: 'Cogumelo', en: 'Mushroom' } },
  { id: 'eye', name: { pt: 'Olho', en: 'Eye' } },
  { id: 'lips', name: { pt: 'Lábios', en: 'Lips' } },
]
