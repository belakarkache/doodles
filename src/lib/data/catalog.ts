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
  | 'geometric'
  | 'tarsila'
  | 'volpi'
  | 'britto'
  | 'athos'
  | 'vangogh'
  | 'mondrian'
  | 'matisse'
  | 'kandinsky'
  | 'kusama'
  | 'milhazes'
  | 'haring'

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
    motifs: ['heart', 'eye', 'blob'],
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
      pt: 'Um xadrez ondulado de só duas cores na página toda e algumas margaridas grandes por cima. Sem contorno.',
      en: 'A two-color wavy checkerboard over the whole page with a few big daisies on top. No outlines.',
    },
  },
  {
    id: 'interference',
    name: { pt: 'Anéis cruzados', en: 'Crossing rings' },
    hint: {
      pt: 'Círculos concêntricos ao redor de dois centros. Onde eles se cruzam, alterne duas cores como num xadrez, cor sim, cor não. A linha pode ser escura ou da mesma cor de uma delas.',
      en: 'Concentric circles around two centers. Where they cross, alternate two colors like a checkerboard, one on, one off. The line can be dark or match one of them.',
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
      pt: 'Ondas grossas e chapadas empilhadas, cada uma com seu próprio balanço e de uma cor. Sem linhas.',
      en: 'Thick, flat waves stacked up, each with its own swing and its own color. No lines.',
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
      pt: 'Uma grade de quadrados cortados em triângulos ou com um quarto de círculo num canto. Alterne peças escuras, hachuradas e de cor, girando as casas para formar cata-ventos ou ondas.',
      en: 'A grid of squares cut into triangles or with a quarter circle in one corner. Alternate dark, hatched and colored pieces, turning the tiles to make pinwheels or waves.',
    },
  },
  {
    id: 'geometric',
    name: { pt: 'Padrão geométrico', en: 'Geometric pattern' },
    hint: {
      pt: 'Formas geométricas repetidas como estampa de tapete antigo: losangos escalonados de kilim, estrelas de oito pontas, casas com círculos e triângulos, alvos, cubos ou zigue-zague. Tudo chapado, alternando as cores.',
      en: 'Geometric shapes repeated like an old rug: stepped kilim diamonds, eight-point stars, tiles with circles and triangles, targets, cubes or zigzags. All flat, alternating colors.',
    },
  },
  {
    id: 'onion',
    name: { pt: 'Cebolas', en: 'Onions' },
    hint: {
      pt: 'Gotas encaixadas em diagonal. Dentro de cada uma, linhas curvas saem da ponta de cima e se encontram na de baixo. Pinte cada gomo de uma cor, na mesma ordem em todas, ou alterne só duas.',
      en: 'Interlocking drops on a diagonal. Inside each, curved lines leave the top tip and meet at the bottom one. Color each slice differently, in the same order in all of them, or alternate just two.',
    },
  },
  {
    id: 'tarsila',
    name: { pt: 'Paisagem Tarsila', en: 'Tarsila landscape' },
    hint: {
      pt: 'Inspirado em Tarsila do Amaral: morros redondos em camadas, um sol grande, árvores de copa redonda e um cacto gordinho na frente. Cores chapadas e curvas macias.',
      en: 'Inspired by Tarsila do Amaral: layered round hills, a big sun, round-crowned trees and a chubby cactus in front. Flat colors and soft curves.',
    },
  },
  {
    id: 'volpi',
    name: { pt: 'Bandeirinhas Volpi', en: 'Volpi flags' },
    hint: {
      pt: 'Inspirado em Alfredo Volpi: fileiras de bandeirinhas de festa junina penduradas em barbantes. Alterne duas a quatro cores num padrão fixo.',
      en: 'Inspired by Alfredo Volpi: rows of little festival flags hanging on strings. Alternate two to four colors in a fixed pattern.',
    },
  },
  {
    id: 'britto',
    name: { pt: 'Pop Romero Britto', en: 'Romero Britto pop' },
    hint: {
      pt: 'Inspirado em Romero Britto: um motivo grande e a página cortados por linhas retas. Cada pedaço ganha uma cor ou um padrão (bolinhas, listras, xadrez), com contorno grosso.',
      en: 'Inspired by Romero Britto: a big motif and the page cut by straight lines. Each piece gets a color or a pattern (dots, stripes, checks), with a thick outline.',
    },
    motifs: ['heart', 'star', 'flower', 'sun', 'moon', 'lips', 'blob'],
  },
  {
    id: 'athos',
    name: { pt: 'Azulejos Athos Bulcão', en: 'Athos Bulcão tiles' },
    hint: {
      pt: 'Inspirado em Athos Bulcão: um único azulejo simples (arco, quarto de círculo, faixa) repetido e girado casa a casa. Duas ou três cores, tudo chapado.',
      en: 'Inspired by Athos Bulcão: one simple tile (arch, quarter circle, band) repeated and turned tile by tile. Two or three colors, all flat.',
    },
  },
  {
    id: 'vangogh',
    name: { pt: 'Céu Van Gogh', en: 'Van Gogh sky' },
    hint: {
      pt: 'Inspirado em Van Gogh: o céu todo feito de pinceladas curtas que giram em redemoinhos, estrelas com anéis de luz, morros embaixo e às vezes um cipreste. Use traços curtos lado a lado.',
      en: 'Inspired by Van Gogh: a sky made of short strokes swirling around, stars with rings of light, hills below and sometimes a cypress. Use short strokes side by side.',
    },
  },
  {
    id: 'mondrian',
    name: { pt: 'Grade Mondrian', en: 'Mondrian grid' },
    hint: {
      pt: 'Inspirado em Piet Mondrian: linhas retas e grossas dividindo a página em retângulos. Pinte só alguns com cores fortes e deixe o resto claro.',
      en: 'Inspired by Piet Mondrian: thick straight lines splitting the page into rectangles. Color only a few in bold colors and leave the rest light.',
    },
  },
  {
    id: 'matisse',
    name: { pt: 'Recortes Matisse', en: 'Matisse cut-outs' },
    hint: {
      pt: 'Inspirado nos recortes de Henri Matisse: painéis coloridos, cada um com uma alga ou estrela recortada de outra cor. Bordas meio tortas, como papel cortado à tesoura.',
      en: "Inspired by Henri Matisse's cut-outs: colored panels, each with a seaweed or star cut from another color. Slightly uneven edges, like scissor-cut paper.",
    },
  },
  {
    id: 'kandinsky',
    name: { pt: 'Círculos Kandinsky', en: 'Kandinsky circles' },
    hint: {
      pt: 'Inspirado em Kandinsky: uma grade de quadrados, cada um com círculos concêntricos de cores diferentes, um pouco fora do centro.',
      en: 'Inspired by Kandinsky: a grid of squares, each with concentric circles in different colors, slightly off center.',
    },
  },
  {
    id: 'kusama',
    name: { pt: 'Bolinhas Kusama', en: 'Kusama dots' },
    hint: {
      pt: 'Inspirado em Yayoi Kusama: uma abóbora de gomos redondos coberta de bolinhas escuras, que diminuem perto das bordas. Atrás, mais bolinhas em fileiras.',
      en: 'Inspired by Yayoi Kusama: a pumpkin with round lobes covered in dark dots that shrink near the edges. More dots in rows behind.',
    },
  },
  {
    id: 'milhazes',
    name: { pt: 'Mandalas Milhazes', en: 'Milhazes mandalas' },
    hint: {
      pt: 'Inspirado em Beatriz Milhazes: listras verticais de larguras diferentes e, por cima, alvos de círculos, rosáceas e anéis de pérolas se sobrepondo. Muita cor.',
      en: 'Inspired by Beatriz Milhazes: vertical stripes of different widths with overlapping circle targets, rosettes and pearl rings on top. Lots of color.',
    },
  },
  {
    id: 'haring',
    name: { pt: 'Dançarinos Haring', en: 'Haring dancers' },
    hint: {
      pt: 'Inspirado em Keith Haring: bonequinhos dançando feitos de traço grosso, com risquinhos de movimento em volta. Às vezes um coração grande no meio.',
      en: 'Inspired by Keith Haring: little dancing figures made of thick strokes with motion dashes around them. Sometimes a big heart in the middle.',
    },
  },
]
