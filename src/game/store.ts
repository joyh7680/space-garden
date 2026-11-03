import { reactive, ref, watch } from 'vue'
import { SAVE_KEY, createState, restore, tickFarm, type View, type FlowerColor } from './model'
let initial = createState()
try { initial = restore(localStorage.getItem(SAVE_KEY)) } catch { /* Storage may be disabled. */ }
export const state = reactive(initial)
export const view = ref<View>('station')
export const planting = ref(false)
export const inputBlocked = ref(false)
export const flowerColor = ref<FlowerColor>('cream')
export const joystick = reactive({ x: 0, y: 0 })
export const selectedCreature = ref(1)
export const notices = ref<{ id: number; text: string; kind: 'good' | 'info' }[]>([])
export const reward = ref<{ title: string; text: string } | null>(null)
export const saveStatus = ref('자동 저장 중')
export const happyId = ref<number | null>(null)
let toastId = 0
export function notify(text: string, kind: 'good' | 'info' = 'good') {
  const id = ++toastId; notices.value.push({ id, text, kind })
  setTimeout(() => { notices.value = notices.value.filter(n => n.id !== id) }, 4000)
}
export function go(next: View) { view.value = next; joystick.x = 0; joystick.y = 0 }
export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt: Date.now() })); saveStatus.value = '진행 상황 저장됨' }
  catch { saveStatus.value = '저장 공간을 사용할 수 없어요' }
}
let dirty = false
watch(state, () => { dirty = true }, { deep: true })
let timer: ReturnType<typeof setInterval> | undefined
export function startStore() {
  if (timer) return
  timer = setInterval(() => {
  const n = tickFarm(state, 1)
  if (n) notify(`자동 수확 완료! 작물 ${n}개 · 씨앗도 다시 모았어요`)
  if (dirty) { dirty = false; save() }
  }, 1000)
}
window.addEventListener('pagehide', save)
window.addEventListener('blur', () => { joystick.x = 0; joystick.y = 0 })
export function resetGame() {
  Object.assign(state, createState()); planting.value = false; selectedCreature.value = 1; reward.value = null; go('station'); save(); notify('새로운 우주 정원에 오신 것을 환영해요!')
}
export function stopStore() { clearInterval(timer); timer = undefined; save() }
