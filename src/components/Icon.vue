<script setup lang="ts">
defineProps<{ name: string; size?: number }>()
const paths: Record<string, string> = {
  sprout: 'M12 21v-9M12 16C4 16 2 11 3 7c7-1 10 3 9 9ZM12 12c0-7 4-10 9-9 1 6-3 10-9 9Z',
  station: 'M3 21h18M5 21V10a7 7 0 0 1 14 0v11M9 21v-6h6v6M2 11h20M12 3V1M8 7h.01M16 7h.01',
  planet: 'M20 10a8 8 0 1 1-6-6M4 17C-3 17 3 8 12 5s16-1 8 6S5 18 3 17M17 3h4M19 1v4',
  leaf: 'M20 3C7 2 2 8 5 15s17 8 15-12ZM4 21 16 9M9 16v-5M9 16h5',
  friends: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM1 21v-3a5 5 0 0 1 10 0v3M16 4a4 4 0 0 1 0 8M17 14a5 5 0 0 1 6 5v2',
  egg: 'M19 14c0 5-3 8-7 8s-7-3-7-8S9 2 12 2s7 7 7 12ZM8 13l4 2 3-4',
  drop: 'M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13ZM8 15a4 4 0 0 0 3 4',
  flower: 'M12 8C5-4 1 8 8 12c-12 4-1 13 4 4 5 9 16 0 4-4 7-4 3-16-4-4ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM12 18v5',
  crystal: 'm12 2 8 7-3 11-5 3-5-3L4 9ZM4 9h16M12 2 9 9l3 14 3-14Z',
  seed: 'M19 4C8 1 2 7 5 15s15 7 14-11ZM6 19 15 9M15 9v6M15 9h-5',
  arrow: 'M5 12h14M14 7l5 5-5 5',
  chevron: 'm9 5 7 7-7 7',
  check: 'm5 12 4 4L19 6',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 2h6l1 3 3 1 3 3v6l-3 1-1 3-3 3H9l-1-3-3-1-3-3V9l3-1 1-3Z',
  close: 'm6 6 12 12M6 18 18 6',
  help: 'M9 8a3 3 0 0 1 6 1c0 2-3 2-3 5M12 18h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  sound: 'M3 9h4l5-4v14l-5-4H3ZM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14',
  mute: 'M3 9h4l5-4v14l-5-4H3ZM17 9l6 6M17 15l6-6',
  lock: 'M5 10h14v12H5ZM8 10V6a4 4 0 0 1 8 0v4M12 15v3',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2',
  star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',
  pause: 'M8 5v14M16 5v14',
  play: 'm7 3 14 9-14 9Z',
  home: 'm2 11 10-9 10 9M5 9v12h14V9M9 21v-8h6v8',
  expand: 'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M3 3l6 6M21 3l-6 6M3 21l6-6M21 21l-6-6',
  save: 'M5 2h12l5 5v15H2V2ZM7 2v7h10V2M7 22v-9h10v9',
}
</script>
<template><svg :width="size || 22" :height="size || 22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.star"/></svg></template>
