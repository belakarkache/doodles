import type { Field } from '../contours'
import { vec, type Vec } from '../geometry'
import { intBetween, type Rng } from '../random'

type Noise = (x: number, y: number) => number

function valueNoise(seed: number): Noise {
  const hash = (i: number, j: number) => {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + seed) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  const smooth = (t: number) => t * t * (3 - 2 * t)
  return (x, y) => {
    const i = Math.floor(x)
    const j = Math.floor(y)
    const fx = smooth(x - i)
    const fy = smooth(y - j)
    const a = hash(i, j)
    const b = hash(i + 1, j)
    const c = hash(i, j + 1)
    const d = hash(i + 1, j + 1)
    return (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy) * 2 - 1
  }
}

export type Hand = {
  field: (f: Field) => Field
  points: (points: Vec[]) => Vec[]
  softer: (factor: number) => Hand
}

export function handDrawn(rng: Rng, amount = 3.5, size = 60): Hand {
  const nx = valueNoise(intBetween(rng, 1, 1e9))
  const ny = valueNoise(intBetween(rng, 1, 1e9))
  const build = (k: number): Hand => {
    const dx = (x: number, y: number) => k * nx(x / size, y / size)
    const dy = (x: number, y: number) => k * ny(x / size, y / size)
    return {
      field: (f) => (x, y) => f(x + dx(x, y), y + dy(x, y)),
      points: (points) => points.map((p) => vec(p.x + dx(p.x, p.y), p.y + dy(p.x, p.y))),
      softer: (factor) => build(amount * factor),
    }
  }
  return build(amount)
}
