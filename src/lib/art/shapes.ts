import { catmullRom, vec, type Vec } from '../geometry'
import { between, intBetween, type Rng } from '../random'
import type { MotifId } from '../data/motifs'

const TAU = Math.PI * 2

type ShapeMaker = (rng: Rng, cx: number, cy: number, r: number) => Vec[]

function organic(cx: number, cy: number, controls: [number, number][], samples = 10): Vec[] {
  return catmullRom(
    controls.map(([angle, r]) => vec(cx + r * Math.cos(angle), cy + r * Math.sin(angle))),
    samples,
    true,
  )
}

const jitter = (rng: Rng, k: number) => 1 + between(rng, -k, k)

const blob: ShapeMaker = (rng, cx, cy, r) => {
  const n = intBetween(rng, 5, 7)
  return organic(cx, cy, Array.from({ length: n }, (_, i) => [(i / n) * TAU, r * between(rng, 0.75, 1.05)]), 14)
}

export const flower: ShapeMaker = (rng, cx, cy, r) => {
  const petals = intBetween(rng, 5, 8)
  const tilt = between(rng, 0, TAU)
  const half = (TAU / petals) * 0.5
  const controls: [number, number][] = []
  for (let i = 0; i < petals; i++) {
    const center = tilt + (i / petals) * TAU
    const tip = r * jitter(rng, 0.1)
    controls.push([center - half, r * 0.42], [center - half * 0.55, tip * 0.86], [center, tip], [center + half * 0.55, tip * 0.86])
  }
  return organic(cx, cy, controls, 6)
}

export const leaf: ShapeMaker = (rng, cx, cy, r) => {
  const tilt = between(rng, -0.6, 0.6) - Math.PI / 2
  const width = between(rng, 0.42, 0.55)
  return organic(
    cx,
    cy,
    [
      [tilt, r],
      [tilt + 1.3, r * width],
      [tilt + Math.PI - 0.25, r * 0.85],
      [tilt + Math.PI, r * 0.9],
      [tilt + Math.PI + 0.25, r * 0.85],
      [tilt - 1.3, r * width],
    ],
    12,
  )
}

const star: ShapeMaker = (rng, cx, cy, r) => {
  const tilt = between(rng, -0.3, 0.3) - Math.PI / 2
  const controls: [number, number][] = Array.from({ length: 10 }, (_, i) => [
    tilt + (i / 10) * TAU + between(rng, -0.06, 0.06),
    i % 2 ? r * between(rng, 0.42, 0.5) : r * jitter(rng, 0.1),
  ])
  return organic(cx, cy, controls, 6)
}

const heart: ShapeMaker = (rng, cx, cy, r) => {
  const lean = between(rng, -0.12, 0.12)
  const left = jitter(rng, 0.08)
  const right = jitter(rng, 0.08)
  return Array.from({ length: 140 }, (_, i) => {
    const t = (i / 140) * TAU
    const x = 16 * Math.sin(t) ** 3
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    const k = (x < 0 ? left : right) * (r / 17)
    return vec(cx + x * k + lean * y * k, cy - y * k)
  })
}

const sparkle: ShapeMaker = (rng, cx, cy, r) => {
  const tilt = between(rng, -0.25, 0.25)
  const controls: [number, number][] = Array.from({ length: 8 }, (_, i) => [
    tilt + (i / 8) * TAU,
    i % 2 ? r * 0.26 : r * (i % 4 ? 0.72 : 1) * jitter(rng, 0.08),
  ])
  return organic(cx, cy, controls, 8)
}

const sun: ShapeMaker = (rng, cx, cy, r) => {
  const rays = intBetween(rng, 9, 13)
  const phase = between(rng, 0, TAU)
  return Array.from({ length: 220 }, (_, i) => {
    const t = (i / 220) * TAU
    const k = r * (0.84 + 0.16 * Math.cos(rays * t + phase))
    return vec(cx + k * Math.cos(t), cy + k * Math.sin(t))
  })
}

const moon: ShapeMaker = (rng, cx, cy, r) => {
  const bite = between(rng, 0.45, 0.6)
  const tilt = between(rng, -0.6, 0.2)
  const outer = Array.from({ length: 61 }, (_, i) => {
    const t = -Math.PI / 2 + (i / 60) * Math.PI
    return vec(r * Math.cos(t), r * Math.sin(t))
  })
  const inner = Array.from({ length: 61 }, (_, i) => {
    const t = Math.PI / 2 - (i / 60) * Math.PI
    return vec(r * bite * Math.cos(t) - r * 0.05, r * Math.sin(t))
  })
  return [...outer, ...inner].map((p) => vec(cx + p.x * Math.cos(tilt) - p.y * Math.sin(tilt), cy + p.x * Math.sin(tilt) + p.y * Math.cos(tilt)))
}

export const mushroom: ShapeMaker = (rng, cx, cy, r) => {
  const capWidth = r * between(rng, 0.95, 1.08)
  const capTop = cy - r * between(rng, 0.85, 1)
  const brim = cy - r * 0.05
  const stem = r * between(rng, 0.26, 0.34)
  const flare = stem * between(rng, 1.05, 1.25)
  const foot = cy + r * 0.85
  const points = [
    vec(cx - capWidth, brim),
    vec(cx - capWidth * 0.82, brim - r * 0.45),
    vec(cx - capWidth * 0.45, capTop + r * 0.08),
    vec(cx, capTop),
    vec(cx + capWidth * 0.45, capTop + r * 0.08),
    vec(cx + capWidth * 0.82, brim - r * 0.45),
    vec(cx + capWidth, brim),
    vec(cx + capWidth * 0.55, brim + r * 0.14),
    vec(cx + stem, brim + r * 0.16),
    vec(cx + stem * 0.9, cy + r * 0.45),
    vec(cx + flare, foot - r * 0.06),
    vec(cx, foot),
    vec(cx - flare, foot - r * 0.06),
    vec(cx - stem * 0.9, cy + r * 0.45),
    vec(cx - stem, brim + r * 0.16),
    vec(cx - capWidth * 0.55, brim + r * 0.14),
  ]
  return catmullRom(points, 8, true)
}

export const eye: ShapeMaker = (rng, cx, cy, r) => {
  const top = r * between(rng, 0.55, 0.68)
  const bottom = r * between(rng, 0.4, 0.5)
  const lift = between(rng, -0.06, 0.06)
  const upper = Array.from({ length: 60 }, (_, i) => {
    const t = i / 60
    return vec(cx - r + 2 * r * t, cy - top * Math.sin(Math.PI * t) ** 0.85 + lift * r * (t - 0.5) * 2)
  })
  const lower = Array.from({ length: 60 }, (_, i) => {
    const t = 1 - i / 60
    return vec(cx - r + 2 * r * t, cy + bottom * Math.sin(Math.PI * t) ** 0.9 + lift * r * (t - 0.5) * 2)
  })
  return [...upper, ...lower]
}

export const lips: ShapeMaker = (rng, cx, cy, r) => {
  const peak = r * between(rng, 0.38, 0.48)
  const dip = r * between(rng, 0.18, 0.26)
  const fullness = r * between(rng, 0.5, 0.62)
  const points = [
    vec(cx - r, cy),
    vec(cx - r * 0.62, cy - peak * 0.72),
    vec(cx - r * 0.3, cy - peak),
    vec(cx, cy - dip),
    vec(cx + r * 0.3, cy - peak),
    vec(cx + r * 0.62, cy - peak * 0.72),
    vec(cx + r, cy),
    vec(cx + r * 0.6, cy + fullness * 0.75),
    vec(cx, cy + fullness),
    vec(cx - r * 0.6, cy + fullness * 0.75),
  ]
  return catmullRom(points, 10, true)
}

export const motifShapes: Record<MotifId, ShapeMaker> = { heart, flower, star, blob, sparkle, sun, moon, leaf, mushroom, eye, lips }

export function signedDistance(polygon: Vec[]): (x: number, y: number) => number {
  const count = polygon.length
  const ax = new Float64Array(count)
  const ay = new Float64Array(count)
  const dx = new Float64Array(count)
  const dy = new Float64Array(count)
  const inverse = new Float64Array(count)
  for (let i = 0, j = count - 1; i < count; j = i++) {
    ax[i] = polygon[i].x
    ay[i] = polygon[i].y
    dx[i] = polygon[j].x - ax[i]
    dy[i] = polygon[j].y - ay[i]
    inverse[i] = 1 / (dx[i] * dx[i] + dy[i] * dy[i] || 1)
  }
  return (x, y) => {
    let inside = false
    let best = Infinity
    for (let i = 0; i < count; i++) {
      const px = x - ax[i]
      const py = y - ay[i]
      const sx = dx[i]
      const sy = dy[i]
      if (ay[i] > y !== ay[i] + sy > y && px < (sx * py) / sy) inside = !inside
      const t = Math.max(0, Math.min(1, (px * sx + py * sy) * inverse[i]))
      const ex = px - t * sx
      const ey = py - t * sy
      const squared = ex * ex + ey * ey
      if (squared < best) best = squared
    }
    const d = Math.sqrt(best)
    return inside ? -d : d
  }
}
