type Lang = 'pt' | 'en'
export type Text = Record<Lang, string>

const STORAGE_KEY = 'doodles:lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'pt' || saved === 'en') return saved
  } catch {}
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

export const locale = $state({ lang: initialLang() })

export function setLang(lang: Lang) {
  locale.lang = lang
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {}
}

export function tr(text: Text): string {
  return text[locale.lang]
}
