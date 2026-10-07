function channels(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
}

function linearChannels(hex: string): number[] {
  return channels(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
}

export function luminance(hex: string): number {
  const [r, g, b] = linearChannels(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

export const isDark = (hex: string) => luminance(hex) < 0.18

function oklab(hex: string): number[] {
  const [r, g, b] = linearChannels(hex)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

export function distance(a: string, b: string): number {
  const [la, aa, ba] = oklab(a)
  const [lb, ab, bb] = oklab(b)
  return Math.hypot(la - lb, aa - ab, ba - bb)
}

function vividness(hex: string): number {
  const values = channels(hex)
  const l = luminance(hex)
  const midTone = l > 0.06 && l < 0.65 ? 1 : 0.4
  return (Math.max(...values) - Math.min(...values)) * midTone
}

type Theme = { accent: string; second: string }

export function themeFor(colors: string[]): Theme {
  const ranked = [...colors].sort((a, b) => vividness(b) - vividness(a))
  const accent = ranked[0]
  return { accent, second: ranked.find((c) => c !== accent) ?? accent }
}

type Hsl = { h: number; s: number; l: number }

export type Spread = { hue: number; saturation: number; lightness: number }

function toHsl(hex: string): Hsl {
  const [r, g, b] = channels(hex)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s, l }
}

function toHex({ h, s, l }: Hsl): string {
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export function nudge(hex: string, rng: () => number, spread: Spread): string {
  const offset = (range: number) => (rng() * 2 - 1) * range
  const { h, s, l } = toHsl(hex)
  return toHex({
    h: (h + offset(spread.hue) + 360) % 360,
    s: clamp01(s + offset(spread.saturation)),
    l: clamp01(l + offset(spread.lightness)),
  })
}

let probe: CanvasRenderingContext2D | null | undefined

export function resolveColor(css: string, fallback: string): string {
  probe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const context = probe
  if (!context) return fallback
  context.fillStyle = fallback
  context.fillStyle = css
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  return `rgb(${r} ${g} ${b})`
}
