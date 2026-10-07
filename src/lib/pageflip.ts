type Key = [time: number, value: number]

export type Pose = { lift: number; curl: number; sway: number; tilt: number }

const LIFT: Key[] = [
  [0, 0],
  [0.1, 4],
  [0.24, 32],
  [0.38, 104],
  [0.5, 176],
  [0.6, 236],
  [0.7, 292],
  [0.8, 336],
  [0.9, 355],
  [1, 360],
]

const CURL: Key[] = [
  [0, 0],
  [0.1, 34],
  [0.22, 60],
  [0.32, 44],
  [0.42, 6],
  [0.52, -26],
  [0.62, -24],
  [0.74, -8],
  [0.86, 3],
  [1, 0],
]

const SWAY: Key[] = [
  [0, 0],
  [0.16, 5],
  [0.36, 3],
  [0.56, -3.5],
  [0.8, 1],
  [1, 0],
]

const TILT: Key[] = [
  [0, 0],
  [0.18, -1.6],
  [0.44, 0.9],
  [0.7, -0.4],
  [1, 0],
]

function slope(keys: Key[], i: number): number {
  const before = keys[Math.max(0, i - 1)]
  const after = keys[Math.min(keys.length - 1, i + 1)]
  return (after[1] - before[1]) / (after[0] - before[0])
}

function sample(keys: Key[], t: number): number {
  const i = Math.max(0, keys.findIndex(([time]) => time >= t) - 1)
  const [t0, v0] = keys[i]
  const [t1, v1] = keys[i + 1] ?? keys[i]
  const span = t1 - t0
  if (span <= 0) return v1
  const s = (t - t0) / span
  const s2 = s * s
  const s3 = s2 * s
  const m0 = slope(keys, i) * span
  const m1 = slope(keys, i + 1) * span
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * m1
}

export function poseAt(t: number): Pose {
  return { lift: sample(LIFT, t), curl: sample(CURL, t), sway: sample(SWAY, t), tilt: sample(TILT, t) }
}

export function bendAt(pose: Pose, slice: number, slices: number): number {
  return pose.lift + pose.curl * (slice / (slices - 1)) ** 1.7
}
