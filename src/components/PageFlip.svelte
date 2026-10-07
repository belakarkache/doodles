<script lang="ts">
  import { onMount } from 'svelte'
  import { bendAt, poseAt, type Pose } from '../lib/pageflip'

  const SLICES = 16
  const DURATION = 850
  const HINGE = 22
  const FRAMES = 72

  let { svg, onDone }: { svg: string; onDone: () => void } = $props()

  let root: HTMLDivElement | undefined = $state()
  let sheet: HTMLDivElement | undefined = $state()
  let cast: HTMLDivElement | undefined = $state()
  let still: HTMLDivElement | undefined = $state()
  let ready = $state(false)

  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const clamp = (value: number) => Math.min(1, Math.max(0, value))

  type Box = { x: number; y: number; width: number; height: number }

  async function decode(markup: string, width: number, height: number): Promise<HTMLImageElement> {
    const sized = markup.replace('<svg ', `<svg width="${width}" height="${height}" `)
    const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }))
    const image = new Image()
    image.src = url
    try {
      await image.decode()
    } finally {
      URL.revokeObjectURL(url)
    }
    return image
  }

  function strip(image: HTMLImageElement, art: Box, top: number, bottom: number, scale: number, ghost: boolean) {
    const canvas = document.createElement('canvas')
    canvas.className = 'strip'
    canvas.style.left = `${art.x}px`
    canvas.style.top = `${top}px`
    canvas.style.width = `${art.width}px`
    canvas.style.height = `${bottom - top}px`
    canvas.width = Math.ceil(art.width * scale)
    canvas.height = Math.ceil((bottom - top) * scale)
    const context = canvas.getContext('2d')!
    const offset = (art.y - top) * scale
    context.beginPath()
    context.roundRect(0, offset, art.width * scale, art.height * scale, 3 * scale)
    context.clip()
    if (ghost) {
      context.globalAlpha = 0.09
      context.filter = `blur(${1.2 * scale}px) saturate(0.6)`
    }
    context.drawImage(image, 0, offset)
    return canvas
  }

  function paint(slices: HTMLElement[], image: HTMLImageElement, art: Box, step: number, scale: number) {
    slices.forEach((slice, index) => {
      const top = Math.max(art.y, index * step)
      const bottom = Math.min(art.y + art.height, (index + 1) * step + 1)
      if (bottom <= top) return
      const [front, back] = slice.querySelectorAll<HTMLElement>(':scope > .face > .content > .paper')
      front.append(strip(image, art, top, bottom, scale, false))
      back.append(strip(image, art, top, bottom, scale, true))
    })
  }

  function choreograph(slices: HTMLElement[], height: number): Animation[] {
    const step = height / SLICES
    const poses: Pose[] = Array.from({ length: FRAMES + 1 }, (_, frame) => poseAt(frame / FRAMES))
    const offsets = poses.map((_, frame) => frame / FRAMES)
    const timing: KeyframeAnimationOptions = { duration: DURATION, easing: 'linear', fill: 'forwards' }
    const animations: Animation[] = []

    const bends = poses.map((pose) => Array.from({ length: SLICES }, (_, i) => bendAt(pose, i, SLICES)))

    slices.forEach((slice, i) => {
      const front = slice.querySelector<HTMLElement>(':scope > .front > .shade')!
      const back = slice.querySelector<HTMLElement>(':scope > .back > .shade')!
      const turns = bends.map((angles) => angles[i] - (i > 0 ? angles[i - 1] : 0))
      const facing = bends.map((angles) => Math.abs(Math.cos(radians(angles[i]))))
      const downward = bends.map((angles) => Math.max(0, Math.sin(radians(angles[i]))))
      animations.push(
        slice.animate(turns.map((turn, f) => ({ transform: `rotateX(${turn}deg)`, offset: offsets[f] })), timing),
        front.animate(facing.map((face, f) => ({ opacity: 0.34 * (1 - face) + 0.1 * downward[f], offset: offsets[f] })), timing),
        back.animate(facing.map((face, f) => ({ opacity: 0.05 + 0.3 * (1 - face), offset: offsets[f] })), timing),
      )
    })

    animations.push(
      sheet!.animate(
        poses.map((pose, f) => ({ transform: `rotateY(${pose.sway}deg) rotateZ(${pose.tilt}deg)`, offset: offsets[f] })),
        timing,
      ),
    )

    const castHeight = height + HINGE + 30
    animations.push(
      cast!.animate(
        poses.map((pose, f) => {
          const angles = bends[f]
          const reach = angles.reduce((sum, angle) => sum + step * Math.cos(radians(angle)), 0)
          const rise = angles.reduce((sum, angle) => sum + step * Math.sin(radians(angle)), 0)
          const lifted = clamp(rise / (height * 0.45)) * clamp((150 - pose.lift) / 60)
          const stretch = (Math.max(0, reach) + HINGE + 30) / castHeight
          return { opacity: lifted, transform: `scaleY(${stretch})`, offset: offsets[f] }
        }),
        timing,
      ),
    )

    const sinks = poses.findIndex((pose) => bendAt(pose, SLICES / 2, SLICES) > 182)
    if (sinks > 0) {
      const at = offsets[sinks]
      animations.push(
        root!.animate(
          [
            { zIndex: 7, offset: 0 },
            { zIndex: 7, offset: at },
            { zIndex: 0, offset: at },
            { zIndex: 0, offset: 1 },
          ],
          timing,
        ),
      )
    }

    return animations
  }

  onMount(() => {
    let animations: Animation[] = []
    let cancelled = false

    async function start() {
      if (!root || !sheet || !cast || !still) return
      const bounds = root.getBoundingClientRect()
      const zoom = bounds.width / root.offsetWidth || 1
      const drawn = still.querySelector('svg')!.getBoundingClientRect()
      const art: Box = {
        x: (drawn.left - bounds.left) / zoom,
        y: (drawn.top - bounds.top) / zoom,
        width: drawn.width / zoom,
        height: drawn.height / zoom,
      }
      const height = root.offsetHeight
      const scale = Math.min(2, window.devicePixelRatio || 1)
      cast.style.height = `${height + HINGE + 30}px`

      const image = await decode(svg, Math.ceil(art.width * scale), Math.ceil(art.height * scale)).catch(() => null)
      if (cancelled) return
      const slices = [...root.querySelectorAll<HTMLElement>('.slice')]
      if (image) paint(slices, image, art, height / SLICES, scale)
      animations = choreograph(slices, height)
      ready = true
      await animations[0].finished.catch(() => {})
      if (!cancelled) onDone()
    }

    start()
    return () => {
      cancelled = true
      animations.forEach((animation) => animation.cancel())
    }
  })
</script>

{#snippet slice(index: number)}
  <div class="slice" class:first={index === 0} style:--index={index}>
    <div class="face front">
      <div class="content"><div class="paper"></div></div>
      <div class="shade"></div>
    </div>
    <div class="face back">
      <div class="content ghost"><div class="paper"></div></div>
      <div class="shade"></div>
    </div>
    {#if index < SLICES - 1}
      {@render slice(index + 1)}
    {/if}
  </div>
{/snippet}

<div class="cast" bind:this={cast} aria-hidden="true"></div>
<div class="flip" bind:this={root} aria-hidden="true" style:--slices={SLICES} style:--hinge={`${HINGE}px`}>
  {#if !ready}
    <div class="still paper" bind:this={still}>{@html svg}</div>
  {/if}
  <div class="sheet" class:ready bind:this={sheet}>
    {@render slice(0)}
  </div>
</div>

<style>
  .cast {
    position: absolute;
    top: 0;
    left: 2%;
    right: 2%;
    z-index: 6;
    opacity: 0;
    transform-origin: 50% 0;
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--shadow) 6%, transparent),
      color-mix(in srgb, var(--shadow) 24%, transparent) 70%,
      transparent
    );
    filter: blur(10px);
    pointer-events: none;
    will-change: transform, opacity;
  }

  .flip {
    position: absolute;
    inset: 0;
    z-index: 7;
    perspective: 1700px;
    perspective-origin: 50% 20%;
    pointer-events: none;
  }

  .still {
    position: absolute;
    inset: 0;
  }

  .sheet {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    transform-origin: 50% var(--hinge);
    visibility: hidden;
  }

  .sheet.ready {
    visibility: visible;
  }

  .slice {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: 50% 0;
    transform-style: preserve-3d;
    will-change: transform;
  }

  .slice.first {
    top: 0;
    height: calc(100% / var(--slices));
    transform-origin: 50% var(--hinge);
  }

  .face {
    position: absolute;
    inset: 0 0 -1px;
    overflow: hidden;
    backface-visibility: hidden;
  }

  .back {
    transform: rotateX(180deg) scaleY(-1);
    background: #fbfaf7;
  }

  .content {
    position: absolute;
    top: calc(var(--index) * -100%);
    left: 0;
    width: 100%;
    height: calc(var(--slices) * 100%);
  }

  .content > :global(.paper) {
    height: 100%;
  }

  .ghost > :global(.paper) {
    background: #fbfaf7;
  }

  .content :global(.strip) {
    position: absolute;
    display: block;
  }

  .shade {
    position: absolute;
    inset: 0;
    background: #2d2540;
    opacity: 0;
    will-change: opacity;
  }
</style>
