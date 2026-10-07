<script lang="ts">
  let { colors, hop }: { colors: string[]; hop: number } = $props()

  const letters = [...'doodles']
</script>

{#key hop}
  <span class="logo" class:hopping={hop > 0} role="img" aria-label="doodles">
    {#each letters as letter, i (i)}
      <span class="letter" aria-hidden="true" style:--c={colors[i % colors.length]} style:--i={i}>{letter}</span>
    {/each}
  </span>
{/key}

<style>
  .logo {
    display: inline-flex;
    font-family: var(--display);
    font-size: clamp(3.4rem, 7vw, 5.2rem);
    font-weight: 400;
    line-height: 1;
    user-select: none;
  }

  .letter {
    display: inline-block;
    margin-right: 0.015em;
    color: color-mix(in oklch, var(--c) 88%, white);
    text-shadow: 0 0.055em 0 color-mix(in oklch, var(--c) 62%, #3b3548);
    transition:
      color 0.5s ease,
      text-shadow 0.5s ease,
      transform 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  .letter:hover {
    transform: translateY(-0.07em) rotate(calc((var(--i) - 3) * 2deg - 4deg));
  }

  .hopping .letter {
    animation: hop 0.55s calc(var(--i) * 45ms) cubic-bezier(0.3, 1.5, 0.5, 1);
  }

  @keyframes hop {
    40% {
      transform: translateY(-0.12em) scale(1.04, 0.96);
    }
    70% {
      transform: translateY(0.02em) scale(0.98, 1.03);
    }
  }
</style>
