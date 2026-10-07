<script lang="ts">
  import Fineliner from './Fineliner.svelte'

  let { colors, blackPen }: { colors: string[]; blackPen: boolean } = $props()

  const nudge = (i: number) => [6, 0, 10, 2, 12, 1, 8][i % 7]
  const tilt = (i: number) => [-2.5, 1.5, -1, 3, -2, 1, -3][i % 7]
</script>

{#key `${colors.join()}|${blackPen}`}
  <ul class="tray" aria-hidden="true">
    {#each colors as color, i (i)}
      <li style:--nudge={`${nudge(i)}px`} style:--tilt={`${tilt(i)}deg`} style:--delay={`${i * 45}ms`}>
        <svg viewBox="0 0 34 200">
          <g transform="matrix(1 0 0 -1 0 200)">
            <rect x="4" y="0" width="26" height="150" rx="6" fill="#fbfaf8" />
            <rect x="4" y="0" width="7" height="150" rx="3" fill="#ffffff" />
            <rect x="24" y="0" width="6" height="150" rx="3" fill="#ebe8e3" />
            <rect x="4" y="118" width="26" height="4" fill="#d9d5cf" />
            <rect x="11" y="0" width="12" height="10" rx="3" fill={color} opacity=".9" />
            <path d="M5 150 H29 V186 Q29 196 17 196 Q5 196 5 186 Z" fill={color} />
            <path d="M5 150 H11 V190 Q5 186 5 180 Z" fill="#fff" opacity=".25" />
          </g>
        </svg>
      </li>
    {/each}
    {#if blackPen}
      <li class="fineliner" style:--nudge="4px" style:--tilt="2deg" style:--delay={`${colors.length * 45}ms`}>
        <Fineliner />
      </li>
    {/if}
  </ul>
{/key}

<style>
  .tray {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: clamp(8px, 1.6vw, 16px);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    width: var(--marker-w, clamp(24px, 2.7vw, 36px));
    transform: translateY(var(--nudge)) rotate(var(--tilt));
    transform-origin: 50% 100%;
    filter: drop-shadow(0 4px 3px rgb(60 55 48 / 0.2)) drop-shadow(0 1px 1px rgb(60 55 48 / 0.18));
    animation: place 0.45s var(--delay) cubic-bezier(0.25, 1.3, 0.5, 1) backwards;
    transition: transform 0.25s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  li:hover {
    transform: translateY(calc(var(--nudge) - 12px)) rotate(calc(var(--tilt) * -1.5));
  }

  .fineliner {
    width: calc(var(--marker-w, clamp(24px, 2.7vw, 36px)) * 0.5);
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  @keyframes place {
    from {
      opacity: 0;
      transform: translateY(calc(var(--nudge) + 28px)) rotate(var(--tilt));
    }
  }
</style>
