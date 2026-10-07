import type { Text } from '../i18n.svelte'
import type { MotifId } from './motifs'

export type StyleId =
  | 'spiderweb'
  | 'checkerBulge'
  | 'stripeInversion'
  | 'lines3d'
  | 'vase'
  | 'pop'
  | 'groovy'
  | 'interference'
  | 'twist'
  | 'waves'
  | 'daisies'
  | 'onion'
  | 'mushrooms'
  | 'eye'
  | 'lips'
  | 'tiles'
  | 'hatched'

export type Style = { id: StyleId; name: Text; hint: Text; motifs?: MotifId[] }

export const styles: Style[] = [
  {
    id: 'spiderweb',
    name: { pt: 'Teia de aranha', en: 'Spiderweb' },
    hint: {
      pt: 'Raios saindo de um centro e anéis que cedem entre eles, tudo em linha grossa. Pinte os pedaços alternando as cores.',
      en: 'Spokes from one center and rings that sag between them, all in thick lines. Color the pieces in alternating colors.',
    },
  },
  {
    id: 'checkerBulge',
    name: { pt: 'Xadrez com bolha', en: 'Bulging checkerboard' },
    hint: {
      pt: 'Faça um xadrez que incha numa bolha: as casas crescem no centro e se espremem nas bordas. Pinte a bolha com outro par de cores.',
      en: 'Draw a checkerboard that swells into a bubble: squares grow in the middle and squeeze at the edges. Color the bubble with another pair.',
    },
  },
  {
    id: 'stripeInversion',
    name: { pt: 'Listras invertidas', en: 'Inverted stripes' },
    hint: {
      pt: 'Listras onduladas no fundo e, dentro do motivo, listras na direção oposta. Sem contorno: a forma aparece só pela troca das listras.',
      en: 'Wavy stripes in the background and, inside the motif, stripes the other way. No outline: the shape shows only where the stripes flip.',
    },
    motifs: ['heart', 'flower', 'star', 'blob', 'moon', 'mushroom', 'eye', 'lips'],
  },
  {
    id: 'lines3d',
    name: { pt: 'Linhas 3D', en: '3D lines' },
    hint: {
      pt: 'Linhas retas que sobem ao passar pelo motivo, como se ele saltasse da página. Use uma caneta por linha ou pinte faixas alternadas.',
      en: 'Straight lines that lift as they cross the motif, as if it pops off the page. Use one pen per line or fill every other band.',
    },
    motifs: ['heart', 'flower', 'blob'],
  },
  {
    id: 'vase',
    name: { pt: 'Vaso com plantas', en: 'Vase with plants' },
    hint: {
      pt: 'Um vaso grande com padrão op art, de onde saem flores ou folhas. Atrás, raios de sol ou arcos.',
      en: 'A big vase with an op art pattern and flowers or leaves coming out of it. Sun rays or arches behind.',
    },
  },
  {
    id: 'mushrooms',
    name: { pt: 'Cogumelos', en: 'Mushrooms' },
    hint: {
      pt: 'De um a três cogumelos fofos no chão. Encha o chapéu com um padrão: bolinhas, listras ou xadrez. Atrás, raios, arcos ou ondas.',
      en: 'One to three chubby mushrooms on the ground. Fill each cap with a pattern: dots, stripes or checks. Rays, arches or waves behind.',
    },
  },
  {
    id: 'eye',
    name: { pt: 'Olho', en: 'Eye' },
    hint: {
      pt: 'Um olho grande com cílios grossos. A íris é um alvo de anéis coloridos, com pupila e um brilho. Atrás, raios ou listras.',
      en: 'One big eye with thick lashes. The iris is a target of colored rings, with a pupil and a shine. Rays or stripes behind.',
    },
  },
  {
    id: 'lips',
    name: { pt: 'Lábios', en: 'Lips' },
    hint: {
      pt: 'Uma boca pop art enorme, com retícula, brilhos brancos e sombra deslocada. Brilhinhos em volta.',
      en: 'A huge pop art mouth with halftone dots, white shines and an offset shadow. Little sparkles around.',
    },
  },
  {
    id: 'pop',
    name: { pt: 'Pop art', en: 'Pop art' },
    hint: {
      pt: 'O motivo grande no centro, cheio de bolinhas de retícula, com sombra deslocada e raios de sol atrás.',
      en: 'A big motif in the middle filled with halftone dots, with an offset shadow and sun rays behind.',
    },
    motifs: ['heart', 'flower', 'star', 'sparkle', 'moon', 'mushroom', 'eye', 'lips'],
  },
  {
    id: 'groovy',
    name: { pt: 'Xadrez groovy', en: 'Groovy checkerboard' },
    hint: {
      pt: 'Um xadrez ondulado na página toda e algumas margaridas grandes por cima. Sem contorno.',
      en: 'A wavy checkerboard over the whole page with a few big daisies on top. No outlines.',
    },
  },
  {
    id: 'interference',
    name: { pt: 'Anéis cruzados', en: 'Crossing rings' },
    hint: {
      pt: 'Círculos concêntricos ao redor de dois centros. Onde eles se cruzam, alterne as duas cores como num xadrez.',
      en: 'Concentric circles around two centers. Where they cross, alternate the two colors like a checkerboard.',
    },
  },
  {
    id: 'twist',
    name: { pt: 'Anéis torcidos', en: 'Twisted rings' },
    hint: {
      pt: 'Anéis em volta de um centro, cortados por fatias em espiral. Alterne as duas cores em cada pedaço.',
      en: 'Rings around one center, cut by spiral slices. Alternate the two colors in each piece.',
    },
  },
  {
    id: 'waves',
    name: { pt: 'Ondas', en: 'Waves' },
    hint: {
      pt: 'Faixas onduladas da mesma largura atravessando a página, cada uma de uma cor.',
      en: 'Wavy bands of the same width across the page, each one a different color.',
    },
  },
  {
    id: 'daisies',
    name: { pt: 'Mosaico de flores', en: 'Flower mosaic' },
    hint: {
      pt: 'Margaridas que se esticam para caber em formas invisíveis: retângulos ou células coladas. As pétalas encostam nas bordas e o vão entre elas forma o desenho.',
      en: 'Daisies that stretch to fit invisible shapes: rectangles or packed cells. Petals reach the edges and the gaps between them make the drawing.',
    },
  },
  {
    id: 'tiles',
    name: { pt: 'Azulejo de flores', en: 'Flower tiles' },
    hint: {
      pt: 'Um xadrez de casas quadradas com um motivo no centro de cada uma: flores, raminhos, tulipas ou corações. Alterne motivos e cores casa a casa, tudo chapado.',
      en: 'A checkerboard of square tiles with a motif in the middle of each: flowers, sprigs, tulips or hearts. Alternate motifs and colors tile by tile, all flat.',
    },
  },
  {
    id: 'hatched',
    name: { pt: 'Retalhos hachurados', en: 'Hatched patchwork' },
    hint: {
      pt: 'Uma grade de quadrados cortados em triângulos ou com um quarto de círculo num canto. Alterne peças pretas, hachuradas e de cor, girando as casas para formar cata-ventos ou ondas.',
      en: 'A grid of squares cut into triangles or with a quarter circle in one corner. Alternate black, hatched and colored pieces, turning the tiles to make pinwheels or waves.',
    },
  },
  {
    id: 'onion',
    name: { pt: 'Cebolas', en: 'Onions' },
    hint: {
      pt: 'Gotas encaixadas em diagonal. Dentro de cada uma, linhas curvas saem da ponta de cima e se encontram na de baixo.',
      en: 'Interlocking drops on a diagonal. Inside each, curved lines leave the top tip and meet at the bottom one.',
    },
  },
]
