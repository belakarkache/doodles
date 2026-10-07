import type { Category } from './generator'
import type { Text } from './i18n.svelte'

export const categoryLabels: Record<Category, Text> = {
  style: { pt: 'Estilo', en: 'Style' },
  palette: { pt: 'Paleta', en: 'Palette' },
}

export const ui = {
  roll: { pt: 'Sortear', en: 'Roll' },
  rollRest: { pt: 'Sortear o resto', en: 'Roll the rest' },
  pressKey: { pt: 'ou aperte', en: 'or press' },
  spaceKey: { pt: 'espaço', en: 'space' },
  lock: { pt: 'Travar', en: 'Lock' },
  unlock: { pt: 'Destravar', en: 'Unlock' },
  chooseStyle: { pt: 'Escolher estilo', en: 'Choose style' },
  choosePalette: { pt: 'Escolher paleta', en: 'Choose palette' },
  randomStyle: { pt: 'Qualquer estilo (sortear)', en: 'Any style (roll)' },
  randomPalette: { pt: 'Qualquer paleta (sortear)', en: 'Any palette (roll)' },
  sketchNote: { pt: 'O esboço é um ponto de partida. Mude o que quiser.', en: 'The sketch is a starting point. Change anything.' },
  outlines: { pt: 'Contornos', en: 'Outlines' },
  outlineInk: { pt: 'Escuro', en: 'Dark' },
  outlineColor: { pt: 'Cor', en: 'Color' },
  outlineNone: { pt: 'Sem', en: 'None' },
  recipe: { pt: 'Receita da página', en: 'Page recipe' },
  developedBy: { pt: 'desenvolvido por', en: 'developed by' },
  whyTitle: { pt: 'Por que criei o Doodles?', en: 'Why I made Doodles' },
  whyText: {
    pt: 'Uso a arte como terapia, e tem dias em que não quero encher a cabeça decidindo o que desenhar. Ter uma referência de cores e formas para me inspirar, sem precisar pensar nisso, me ajuda muito.',
    en: "I use art as therapy, and some days I don't want to crowd my head deciding what to draw. Having a reference of colors and shapes to borrow from, without thinking about it, helps me a lot.",
  },
  whyHope: { pt: 'Espero que ajude mais alguém também.', en: 'I hope it helps someone else too.' },
} satisfies Record<string, Text>
