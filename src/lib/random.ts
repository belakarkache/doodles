export type Rng = () => number

function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rngFor(seed: number, salt: number): Rng {
  return mulberry32(Math.imul(seed + 1, 2654435761) ^ Math.imul(salt + 7, 40503))
}

export function between(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}

export function intBetween(rng: Rng, min: number, max: number): number {
  return Math.floor(between(rng, min, max + 1))
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

function pickMany<T>(rng: Rng, items: readonly T[], count: number): T[] {
  const pool = [...items]
  const chosen: T[] = []
  while (chosen.length < count && pool.length > 0) {
    chosen.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  }
  return chosen
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  return pickMany(rng, items, items.length)
}
