import { vec, type Vec } from './geometry'

export type Field = (x: number, y: number) => number

type Grid = { values: Float64Array; columns: number; rows: number; cell: number; originX: number; originY: number }

const OUTSIDE = 1e6

export function sampleField(field: Field, width: number, height: number, cell: number): Grid {
  const originX = -cell * 2
  const originY = -cell * 2
  const columns = Math.ceil((width + cell * 4) / cell)
  const rows = Math.ceil((height + cell * 4) / cell)
  const values = new Float64Array((columns + 1) * (rows + 1))
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= columns; i++) {
      const border = i === 0 || j === 0 || i === columns || j === rows
      values[j * (columns + 1) + i] = border ? OUTSIDE : field(originX + i * cell, originY + j * cell)
    }
  }
  return { values, columns, rows, cell, originX, originY }
}

const segmentsByCase: Record<number, [number, number][]> = {
  1: [[3, 2]],
  2: [[2, 1]],
  3: [[3, 1]],
  4: [[0, 1]],
  6: [[0, 2]],
  7: [[0, 3]],
  8: [[3, 0]],
  9: [[0, 2]],
  11: [[0, 1]],
  12: [[3, 1]],
  13: [[2, 1]],
  14: [[3, 2]],
}

export function contourLoops(grid: Grid, level: number): Vec[][] {
  const { values, columns, rows, cell, originX, originY } = grid
  const nx = columns + 1
  const value = (i: number, j: number) => values[j * nx + i]
  const horizontal = (i: number, j: number) => j * columns + i
  const verticalBase = (rows + 1) * columns
  const vertical = (i: number, j: number) => verticalBase + j * nx + i
  const point = (id: number): Vec => {
    if (id < verticalBase) {
      const j = Math.floor(id / columns)
      const i = id % columns
      const a = value(i, j)
      const b = value(i + 1, j)
      return vec(originX + (i + (level - a) / (b - a)) * cell, originY + j * cell)
    }
    const local = id - verticalBase
    const j = Math.floor(local / nx)
    const i = local % nx
    const a = value(i, j)
    const b = value(i, j + 1)
    return vec(originX + i * cell, originY + (j + (level - a) / (b - a)) * cell)
  }

  const edgeCount = verticalBase + rows * nx
  const first = new Int32Array(edgeCount).fill(-1)
  const second = new Int32Array(edgeCount).fill(-1)
  const touched: number[] = []
  const attach = (from: number, to: number) => {
    if (first[from] === -1) {
      first[from] = to
      touched.push(from)
    } else second[from] = to
  }
  const link = (a: number, b: number) => {
    attach(a, b)
    attach(b, a)
  }

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const tl = value(i, j)
      const tr = value(i + 1, j)
      const br = value(i + 1, j + 1)
      const bl = value(i, j + 1)
      const index = (tl < level ? 8 : 0) | (tr < level ? 4 : 0) | (br < level ? 2 : 0) | (bl < level ? 1 : 0)
      if (index === 0 || index === 15) continue
      const edges = [horizontal(i, j), vertical(i + 1, j), horizontal(i, j + 1), vertical(i, j)]
      let pairs = segmentsByCase[index]
      if (index === 5 || index === 10) {
        const centerInside = (tl + tr + br + bl) / 4 < level
        const isolateCorners = (index === 5) === centerInside
        pairs = isolateCorners ? [[3, 0], [2, 1]] : [[0, 1], [3, 2]]
      }
      pairs.forEach(([a, b]) => link(edges[a], edges[b]))
    }
  }

  const loops: Vec[][] = []
  const visited = new Uint8Array(edgeCount)
  for (const start of touched) {
    if (visited[start]) continue
    const loop: Vec[] = []
    let previous = -1
    let current = start
    while (!visited[current]) {
      visited[current] = 1
      loop.push(point(current))
      const a = first[current]
      const b = second[current]
      const next = a !== -1 && a !== previous && !visited[a] ? a : b !== -1 && b !== previous && !visited[b] ? b : -1
      if (next === -1) break
      previous = current
      current = next
    }
    if (loop.length > 2) loops.push(loop)
  }
  return loops
}

export function smoothLoop(points: Vec[]): Vec[] {
  return points.flatMap((p, i) => {
    const q = points[(i + 1) % points.length]
    return [vec(p.x * 0.75 + q.x * 0.25, p.y * 0.75 + q.y * 0.25), vec(p.x * 0.25 + q.x * 0.75, p.y * 0.25 + q.y * 0.75)]
  })
}

export function dropSpecks(loops: Vec[][], gap: number): Vec[][] {
  return loops.filter((loop) => {
    let area = 0
    let perimeter = 0
    loop.forEach((p, i) => {
      const q = loop[(i + 1) % loop.length]
      area += p.x * q.y - q.x * p.y
      perimeter += Math.hypot(q.x - p.x, q.y - p.y)
    })
    return Math.abs(area) / 2 / perimeter >= gap * 0.3
  })
}

function offsetFromChord(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const span = dx * dx + dy * dy
  if (span === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  return Math.abs(dx * (a.y - p.y) - dy * (a.x - p.x)) / Math.sqrt(span)
}

export function simplifyLoop(points: Vec[], tolerance = 0.15): Vec[] {
  const count = points.length
  if (count < 4) return points
  const keep = new Uint8Array(count + 1)
  keep[0] = keep[count] = 1
  const at = (i: number) => points[i % count]
  const spans: [number, number][] = [[0, count]]
  while (spans.length > 0) {
    const [start, end] = spans.pop()!
    let farthest = -1
    let widest = tolerance
    for (let i = start + 1; i < end; i++) {
      const offset = offsetFromChord(at(i), at(start), at(end))
      if (offset > widest) {
        widest = offset
        farthest = i
      }
    }
    if (farthest === -1) continue
    keep[farthest] = 1
    spans.push([start, farthest], [farthest, end])
  }
  const kept = points.filter((_, i) => keep[i])
  return kept.length > 2 ? kept : points
}
