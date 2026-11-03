<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import Phaser from 'phaser'
import { GardenScene } from '../game/GardenScene'
import { view } from '../game/store'
const host = ref<HTMLDivElement>()
let game: Phaser.Game | undefined
let observer: ResizeObserver | undefined
function preventScroll(event: KeyboardEvent) {
  const tag = (event.target as HTMLElement)?.tagName
  if(view.value === 'explore' && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key) && !['INPUT','SELECT','TEXTAREA'].includes(tag)) event.preventDefault()
}
onMounted(() => {
  if(!host.value) return
  game = new Phaser.Game({ type: Phaser.AUTO, parent: host.value, width: host.value.clientWidth, height: host.value.clientHeight,
    backgroundColor: '#d3dfce', scene: GardenScene, antialias: true, roundPixels: false,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, input: { activePointers: 3 },
    render: { powerPreference: 'low-power' }, audio: { noAudio: true } })
  observer = new ResizeObserver(() => { if(host.value && game) game.scale.resize(host.value.clientWidth,host.value.clientHeight) })
  observer.observe(host.value)
  window.addEventListener('keydown', preventScroll)
})
onBeforeUnmount(() => { observer?.disconnect(); game?.destroy(true); window.removeEventListener('keydown', preventScroll) })
</script>
<template><div ref="host" class="game-canvas" role="img" aria-label="코스모 가든 게임 화면. 탐험에서는 방향키 또는 WASD, 터치 방향 패드, 지도 클릭으로 이동할 수 있습니다."/></template>
