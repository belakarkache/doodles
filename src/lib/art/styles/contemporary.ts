import { add, ellipse, fromAngle, polylinePath, pt, TAU, vec, type Vec } from '../../geometry'
import { between, intBetween, pick, shuffle } from '../../random'
import { HEIGHT, WIDTH, type ArtContext } from '../context'
import { circleD, clipPath, clipped, fill, ink, polyD, rect, type Art } from '../draw'
import { motifShapes } from '../shapes'
import { inksOf } from './brazilian'
import { distance } from '../../theme'

function dotField(step: number, radius: (x: number, y: number) => number): string {
  const dots: string[] = []
  for (let row = 0, y = step / 2; y < HEIGHT + step; row++, y += step * 0.87) {
    for (let x = (row % 2) * (step / 2); x < WIDTH + step; x += step) {
      const r = radius(x, y)
      if (r > 0.8) dots.push(circleD(x, y, r))
    }
  }
  return dots.join(' ')
}

export function kusama(ctx: ArtContext): Art {
  const { rng, pens, uid } = ctx
  const dark = pens.line
  const byContrast = [...inksOf(ctx)].sort((a, b) => distance(b, dark) - distance(a, dark))
  const body = byContrast[0]
  const [ground, spots, stalk] = shuffle(rng, byContrast.slice(1))
  const step = between(rng, 20, 28)
  const backdrop = rect(ground) + fill(dotField(step, () => step * between(rng, 0.26, 0.3)), spots ?? pens.background)
  if (rng() < 0.3) {
    const swell = between(rng, 0.008, 0.016)
    return {
      background: ground,
      body: rect(body) + fill(dotField(step * 0.8, (x, y) => step * 0.36 * (0.55 + 0.45 * Math.sin(Math.hypot(x - WIDTH / 2, y - HEIGHT / 2) * swell * TAU))), dark),
    }
  }
  const hand = ctx.hand.softer(0.4)
  const center = vec(WIDTH / 2, HEIGHT * 0.58)
  const w = between(rng, 150, 162)
  const h = w * between(rng, 0.62, 0.72)
  const lobes = [
    { dx: -0.62, k: 0.55 },
    { dx: 0.62, k: 0.55 },
    { dx: -0.32, k: 0.72 },
    { dx: 0.32, k: 0.72 },
    { dx: 0, k: 0.8 },
  ]
  const defs: string[] = []
  const parts = lobes.map(({ dx, k }, i) => {
    const lobeW = w * 0.36
    const lobeH = h * (0.82 + k * 0.22)
    const at = vec(center.x + dx * w, center.y + Math.abs(dx) * h * 0.08)
    const outline = polyD(hand.points(ellipse(at, lobeW, lobeH, 56)))
    const id = `${uid}-k${i}`
    defs.push(clipPath(id, outline))
    const dots: string[] = []
    const rows = 7
    for (let r = 0; r < rows; r++) {
      const t = (r + 0.5) / rows
      const y = at.y - lobeH + t * lobeH * 2
      const span = Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2))
      for (let c = -2; c <= 2; c++) {
        const x = at.x + c * lobeW * 0.4 * span
        const size = lobeW * 0.16 * span ** 0.6 * (1 - (c / 3) ** 2)
        if (size > 1.4) dots.push(circleD(x, y, size))
      }
    }
    return ink(outline, dark, 3.6, body) + clipped(id, fill(dots.join(' '), dark))
  })
  const top = vec(center.x + between(rng, -6, 6), center.y - h * 1.02)
  const stem = polyD(hand.points([vec(top.x - 15, top.y + 22), vec(top.x - 10, top.y - 30), vec(top.x + 12, top.y - 36), vec(top.x + 15, top.y + 22)]))
  return {
    background: ground,
    body: backdrop + ink(stem, dark, 3.6, stalk ?? dark) + parts.join(''),
    defs: defs.join(''),
  }
}

export function milhazes(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const hand = ctx.hand.softer(0.3)
  const inks = inksOf(ctx)
  const tint = (k: number) => inks[((k % inks.length) + inks.length) % inks.length]
  const parts: string[] = []
  for (let x = -10, k = 0; x < WIDTH + 10; k++) {
    const w = between(rng, 14, 40)
    parts.push(fill(polyD(hand.points([vec(x, -20), vec(x + w, -20), vec(x + w, HEIGHT + 20), vec(x, HEIGHT + 20)])), tint(k)))
    x += w
  }
  const spots = shuffle(rng, [
    vec(70, 80),
    vec(220, 120),
    vec(110, 230),
    vec(230, 300),
    vec(60, 350),
    vec(170, 40),
  ]).slice(0, intBetween(rng, 4, 5))
  spots.forEach((spot, s) => {
    const r = between(rng, 48, 84) * (s === 0 ? 1.2 : 1)
    const center = add(spot, vec(between(rng, -12, 12), between(rng, -12, 12)))
    const kind = pick(rng, ['target', 'target', 'rosette', 'pearls'])
    const rings = intBetween(rng, 4, 6)
    if (kind === 'target') {
      for (let k = 0; k < rings; k++) parts.push(ink(polyD(hand.points(ellipse(center, r * (1 - k / rings), undefined, 48))), pens.line, 2.4, tint(s * 2 + k)))
      return
    }
    if (kind === 'rosette') {
      parts.push(ink(polyD(hand.points(ellipse(center, r, undefined, 48))), pens.line, 2.4, tint(s + 1)))
      parts.push(ink(polyD(hand.points(motifShapes.flower(rng, center.x, center.y, r * 0.86))), pens.line, 2.4, tint(s + 2)))
      parts.push(ink(polyD(hand.points(motifShapes.flower(rng, center.x, center.y, r * 0.5))), pens.line, 2.4, tint(s + 3)))
      parts.push(ink(circleD(center.x, center.y, r * 0.18), pens.line, 2.4, tint(s + 4)))
      return
    }
    const count = Math.round(r / 6)
    parts.push(ink(polyD(hand.points(ellipse(center, r * 0.7, undefined, 48))), pens.line, 2.4, tint(s + 1)))
    parts.push(ink(polyD(hand.points(ellipse(center, r * 0.4, undefined, 40))), pens.line, 2.4, tint(s + 2)))
    const pearls = Array.from({ length: count }, (_, k) => {
      const p = add(center, fromAngle((k / count) * TAU, r * 0.86))
      return circleD(p.x, p.y, r * 0.11)
    })
    parts.push(ink(pearls.join(' '), pens.line, 2, tint(s + 3)))
  })
  return { background: pens.background, body: parts.join('') }
}

type Pose = { hip: Vec; lean: number; arms: [number, number][]; legs: [number, number][] }

function limb(from: Vec, angles: [number, number], length: number): Vec[] {
  const knee = add(from, fromAngle(angles[0], length))
  return [from, knee, add(knee, fromAngle(angles[1], length * 0.95))]
}

function dancer(ctx: ArtContext, pose: Pose, scale: number, tint: string): { outline: string; body: string } {
  const { pens } = ctx
  const hand = ctx.hand.softer(0.25)
  const torso = 56 * scale
  const neck = add(pose.hip, fromAngle(-Math.PI / 2 + pose.lean, torso))
  const head = add(neck, fromAngle(-Math.PI / 2 + pose.lean, 26 * scale))
  const shoulder = add(pose.hip, fromAngle(-Math.PI / 2 + pose.lean, torso * 0.82))
  const lines = [
    [pose.hip, neck],
    ...pose.arms.map((a) => limb(shoulder, a, 34 * scale)),
    ...pose.legs.map((l) => limb(pose.hip, l, 40 * scale)),
  ].map((points) => polylinePath(hand.points(points)))
  const width = 19 * scale
  const d = lines.join(' ')
  const skull = circleD(head.x, head.y, 17 * scale)
  return {
    outline: ink(d, pens.line, width + 7) + ink(skull, pens.line, 7),
    body: ink(d, tint, width) + fill(skull, tint),
  }
}

const deg = (d: number) => (d * Math.PI) / 180

function pose(rng: () => number, hip: Vec, mirror: boolean): Pose {
  const flip = (a: number) => (mirror ? Math.PI - a : a)
  const arm = (shoulder: number, elbow: number): [number, number] => [flip(deg(shoulder)), flip(deg(shoulder + elbow))]
  const leg = (thigh: number, shin: number): [number, number] => [flip(deg(thigh)), flip(deg(thigh + shin))]
  const style = Math.floor(rng() * 3)
  const arms: [number, number][] =
    style === 0
      ? [arm(-150 + rng() * 20, 40 + rng() * 40), arm(-30 - rng() * 20, -40 - rng() * 40)]
      : style === 1
        ? [arm(-160, -50 - rng() * 30), arm(-10 - rng() * 20, 70 + rng() * 30)]
        : [arm(-120 - rng() * 20, -70), arm(-60 + rng() * 20, 70)]
  const legs: [number, number][] = [leg(110 + rng() * 25, rng() * 40), leg(60 - rng() * 30, 40 + rng() * 50)]
  return { hip, lean: (mirror ? -1 : 1) * deg(-14 + rng() * 22), arms, legs }
}

function buzz(ctx: ArtContext, center: Vec, r: number, count: number): string {
  const lines = Array.from({ length: count }, (_, k) => {
    const a = -Math.PI / 2 + ((k - (count - 1) / 2) / count) * Math.PI * 1.6
    return `M${pt(add(center, fromAngle(a, r)))} L${pt(add(center, fromAngle(a, r + 12)))}`
  })
  return ink(lines.join(' '), ctx.pens.line, 3.4)
}

export function haring(ctx: ArtContext): Art {
  const { rng, pens } = ctx
  const [ground, ...figures] = shuffle(rng, inksOf(ctx))
  const tint = (k: number) => figures[k % figures.length] ?? pens.background
  const background = rng() < 0.5 ? ground : pens.background
  const layout = pick(rng, ['heart', 'four'] as const)
  const dancers: { outline: string; body: string }[] = []
  const extras: string[] = []
  if (layout === 'heart') {
    const heart = polyD(ctx.hand.softer(0.4).points(motifShapes.heart(rng, WIDTH / 2, 110, 62)))
    extras.push(ink(heart, pens.line, 5, tint(2)) + buzz(ctx, vec(WIDTH / 2, 110), 74, 9))
    dancers.push(dancer(ctx, pose(rng, vec(84, 300), false), 1.15, tint(0)), dancer(ctx, pose(rng, vec(216, 300), true), 1.15, tint(1)))
  } else {
    const spots: [Vec, boolean][] = [
      [vec(80, 140), false],
      [vec(220, 130), true],
      [vec(84, 320), true],
      [vec(220, 330), false],
    ]
    spots.forEach(([hip, mirror], k) => dancers.push(dancer(ctx, pose(rng, hip, mirror), 0.95, tint(k))))
    spots.forEach(([hip]) => extras.push(buzz(ctx, vec(hip.x, hip.y - 40), 80, 5)))
  }
  return {
    background,
    body: extras.join('') + dancers.map((d) => d.outline).join('') + dancers.map((d) => d.body).join(''),
  }
}
