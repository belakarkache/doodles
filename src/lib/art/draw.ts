import { contourLoops, dropSpecks, sampleField, simplifyLoop, smoothLoop, type Field } from '../contours'
import { fmt, polylinePath, type Vec } from '../geometry'
import { HEIGHT, LINE, WIDTH } from './context'

const TAU = Math.PI * 2

export const polyD = (points: Vec[]) => polylinePath(points, true)
export const loopsD = (loops: Vec[][]) => loops.map(polyD).join(' ')

export function regions(field: Field, level = 0, cell = 2): Vec[][] {
  return dropSpecks(contourLoops(sampleField(field, WIDTH, HEIGHT, cell), level), 3).map(smoothLoop).map((loop) => simplifyLoop(loop))
}

export function levelLines(field: Field, levels: number[], cell = 2): Vec[][][] {
  const grid = sampleField(field, WIDTH, HEIGHT, cell)
  return levels.map((level) => dropSpecks(contourLoops(grid, level), 3).map(smoothLoop).map((loop) => simplifyLoop(loop)))
}

export function range(from: number, to: number, step: number): number[] {
  const values: number[] = []
  for (let v = from; v < to; v += step) values.push(v)
  return values
}

export const fill = (d: string, color: string) => `<path class="fill" d="${d}" fill="${color}" fill-rule="evenodd"/>`

export const ink = (d: string, color: string, width = LINE, fillColor = 'none') =>
  `<path class="ink" pathLength="1" d="${d}" fill="${fillColor}" stroke="${color}" stroke-width="${fmt(width)}"/>`

export const hatch = (d: string, color: string, width: number) =>
  `<path class="ink hatch" pathLength="1" d="${d}" fill="none" stroke="${color}" stroke-width="${fmt(width)}"/>`

export const circleD = (x: number, y: number, r: number) =>
  `M${fmt(x - r)} ${fmt(y)} a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(r * 2)} 0 a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-r * 2)} 0 Z`

export const rect = (color: string) => `<rect class="fill" x="-20" y="-20" width="${WIDTH + 40}" height="${HEIGHT + 40}" fill="${color}"/>`

export const clipPath = (id: string, d: string) => `<clipPath id="${id}"><path d="${d}" clip-rule="evenodd"/></clipPath>`

export const clipped = (id: string, content: string) => `<g clip-path="url(#${id})">${content}</g>`

export type Art = { background: string; body: string; defs?: string }

export function withoutOutlines(body: string, line: string): string {
  const stroke = `stroke="${line}"`
  return body.replace(/<path class="ink"[^>]*>/g, (tag) => {
    if (!tag.includes(stroke)) return tag
    return tag.includes('fill="none"') ? '' : tag.replace(stroke, 'stroke="none"')
  })
}

export function bulge(cx: number, cy: number, radius: number, strength: number) {
  return (x: number, y: number): [number, number] => {
    const dx = x - cx
    const dy = y - cy
    const k = 1 - strength * Math.exp(-(dx * dx + dy * dy) / (radius * radius))
    return [cx + dx * k, cy + dy * k]
  }
}

export function sunburst(cx: number, cy: number, rays: number, color: string): string {
  const wedges: string[] = []
  for (let i = 0; i < rays; i += 2) {
    const a = (i / rays) * TAU
    const b = ((i + 1) / rays) * TAU
    wedges.push(`M${fmt(cx)} ${fmt(cy)} L${fmt(cx + 900 * Math.cos(a))} ${fmt(cy + 900 * Math.sin(a))} L${fmt(cx + 900 * Math.cos(b))} ${fmt(cy + 900 * Math.sin(b))} Z`)
  }
  return fill(wedges.join(' '), color)
}
