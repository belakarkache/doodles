<script lang="ts">
  let { svg, label, delay }: { svg: string; label: string; delay: number } = $props()
</script>

<div class="art" role="img" aria-label={label} style:--draw-delay={`${delay}ms`}>
  {@html svg}
</div>

<style>
  .art :global(svg) {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 3px;
  }

  .art :global(.ink) {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 1.2s var(--draw-delay) cubic-bezier(0.55, 0.05, 0.3, 1) forwards;
  }

  .art :global(.ink:not([fill='none'])),
  .art :global(.fill) {
    animation:
      draw 1.2s var(--draw-delay) cubic-bezier(0.55, 0.05, 0.3, 1) forwards,
      ink-fill 0.7s calc(var(--draw-delay) + 0.5s) ease-out backwards;
  }

  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes ink-fill {
    from {
      fill-opacity: 0;
    }
  }
</style>
