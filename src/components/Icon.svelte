<script lang="ts">
  type Name = 'die' | 'lock' | 'shuffle' | 'chevron' | 'check' | 'heart'

  let { name, open = false }: { name: Name; open?: boolean } = $props()
</script>

<svg class="icon {name}" class:open viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
  {#if name === 'die'}
    <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="var(--icon-fill, none)" />
    <circle cx="8.4" cy="8.4" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="15.6" cy="15.6" r="1.7" fill="currentColor" stroke="none" />
  {:else if name === 'lock'}
    <path class="shackle" d="M8 11 V8 A4 4 0 0 1 16 8 V11" />
    <rect x="4.6" y="10.6" width="14.8" height="10.2" rx="3.4" fill="currentColor" />
    <circle cx="12" cy="15.4" r="1.6" fill="var(--icon-hole, #fff)" stroke="none" />
  {:else if name === 'shuffle'}
    <path d="M3.5 7.5 H7 C11 7.5 13 16.5 17 16.5 H20 M3.5 16.5 H7 C8.6 16.5 9.8 15 10.8 13.4 M13.2 10.6 C14.2 9 15.4 7.5 17 7.5 H20" />
    <path d="M17.8 4.8 L20.5 7.5 L17.8 10.2 M17.8 13.8 L20.5 16.5 L17.8 19.2" />
  {:else if name === 'chevron'}
    <path d="M6 9.5 L12 15.5 L18 9.5" stroke-width="3" />
  {:else if name === 'check'}
    <path d="M5 12.5 L10 17 L19 7.5" stroke-width="3" />
  {:else if name === 'heart'}
    <path d="M12 20 C7 16.5 3.5 13.4 3.5 9.4 A4.3 4.3 0 0 1 12 7.6 A4.3 4.3 0 0 1 20.5 9.4 C20.5 13.4 17 16.5 12 20 Z" fill="currentColor" />
  {/if}
</svg>

<style>
  .shackle {
    transform-origin: 16px 11px;
    transition: transform 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  .lock.open .shackle {
    transform: translateY(-2px) rotate(28deg);
  }
</style>
