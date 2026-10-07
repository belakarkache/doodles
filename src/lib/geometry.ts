export const TAU = Math.PI * 2

export type Vec = { x: number; y: number }

export const vec = (x: number, y: number): Vec => ({ x, y })
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k })
export const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y
export const length = (a: Vec) => Math.hypot(a.x, a.y)
export const distance = (a: Vec, b: Vec) => length(sub(a, b))
export const normalize = (a: Vec): Vec => scale(a, 1 / (length(a) || 1))
export const perpendicular = (a: Vec): Vec => ({ x: -a.y, y: a.x })
export const lerp = (a: Vec, b: Vec, t: number): Vec => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
export const fromAngle = (angle: number, r = 1): Vec => ({ x: Math.cos(angle) * r, y: Math.sin(angle) * r })

export const fmt = (n: number) => (Math.round(n * 10) / 10).toString()
export const pt = (p: Vec) => `${fmt(p.x)} ${fmt(p.y)}`

export function polylinePath(points: Vec[], closed = false): string {
  return `M${points.map(pt).join(' L')}${closed ? ' Z' : ''}`
}

export function clipHalfPlane(polygon: Vec[], origin: Vec, normal: Vec): Vec[] {
  const inside = (p: Vec) => dot(sub(p, origin), normal) <= 0
  const result: Vec[] = []
  polygon.forEach((current, i) => {
    const previous = polygon[(i + polygon.length - 1) % polygon.length]
    const currentIn = inside(current)
    const previousIn = inside(previous)
    if (currentIn !== previousIn) {
      const a = dot(sub(previous, origin), normal)
      const b = dot(sub(current, origin), normal)
      result.push(lerp(previous, current, a / (a - b)))
    }
    if (currentIn) result.push(current)
  })
  return result
}

export function voronoiCells(seeds: Vec[], bounds: Vec[]): Vec[][] {
  return seeds.map((seed, i) =>
    seeds.reduce((cell, other, j) => {
      if (i === j || cell.length === 0) return cell
      return clipHalfPlane(cell, lerp(seed, other, 0.5), sub(other, seed))
    }, bounds),
  )
}

export function catmullRom(points: Vec[], samplesPerSegment = 16, closed = false): Vec[] {
  const count = points.length
  const get = (i: number) => (closed ? points[(i + count) % count] : points[Math.min(Math.max(i, 0), count - 1)])
  const segments = closed ? count : count - 1
  const result: Vec[] = []
  for (let i = 0; i < segments; i++) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)]
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment
      const t2 = t * t
      const t3 = t2 * t
      result.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      })
    }
  }
  if (!closed) result.push(points[count - 1])
  return result
}

export function poissonPoints(rng: () => number, width: number, height: number, minDistance: number, margin: number, limit = 60): Vec[] {
  const points: Vec[] = []
  for (let attempt = 0; attempt < 1500 && points.length < limit; attempt++) {
    const p = vec(margin + rng() * (width - margin * 2), margin + rng() * (height - margin * 2))
    if (points.every((q) => distance(p, q) >= minDistance)) points.push(p)
  }
  return points
}
