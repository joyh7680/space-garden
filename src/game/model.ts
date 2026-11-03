export type Species = 'momo' | 'lumi' | 'pipi'
export type View = 'station' | 'explore' | 'farm' | 'creatures' | 'hatch'
export type Crop = 'berry' | 'luna' | 'herb'
export type FlowerColor = 'cream' | 'blue' | 'pink'
export interface Creature { id: number; species: Species; name: string; xp: number; duty: 'explore' | 'farm' }
export interface Flower { x: number; y: number; color: FlowerColor }
export interface Bed { crop: Crop; nextCrop?: Crop; progress: number; active: boolean; cycles: number }
export interface GameState {
  version: 1; essence: number; petals: number; seeds: number; crystals: number; eggs: number;
  creatures: Creature[]; flowers: Record<string, Flower>; blooms: boolean[]; expanded: boolean;
  beds: Bed[]; harvested: number; fed: number; hatched: number; player: { x: number; y: number }; savedAt: number
}
export const SPECIES = {
  momo: { name: '모모', color: '#b8d9a2', dark: '#72926d', description: '풀잎을 닮은 귀여운 정원 친구. 햇살 아래 낮잠을 좋아해요.', habitat: '이끼 숲' },
  lumi: { name: '루미', color: '#b9b8e5', dark: '#8173b1', description: '별빛을 모으는 보랏빛 친구. 호기심이 많고 늘 주변을 살펴요.', habitat: '별빛 언덕' },
  pipi: { name: '피피', color: '#efb5ae', dark: '#b8787e', description: '복숭아처럼 말랑한 분홍 친구. 꽃향기를 따라 폴짝폴짝!', habitat: '꽃잎 초원' },
} as const
export const CROPS = {
  berry: { name: '글로우 베리', seconds: 20, icon: 'berry', color: '#a3cf8a', reward: '정수 2 · 결정 2', description: '은은하게 빛나는 달콤한 열매' },
  luna: { name: '루나 플라워', seconds: 30, icon: 'flower', color: '#bdafe2', reward: '꽃잎 12 · 정수 1 · 결정 3', description: '달빛을 머금은 작은 꽃' },
  herb: { name: '크리스탈 허브', seconds: 40, icon: 'crystal', color: '#90cdd1', reward: '정수 1 · 결정 5', description: '투명한 결정이 맺히는 허브' },
} as const
export const GIANTS = [{ x: 650, y: 500, name: '별빛 목련', radius: 290 }, { x: 1320, y: 650, name: '달무리 연꽃', radius: 290 }]
export const SAVE_KEY = 'cosmo-garden-v1'
export function createState(): GameState {
  return { version: 1, essence: 6, petals: 0, seeds: 2, crystals: 0, eggs: 0,
    creatures: (['momo', 'lumi', 'pipi'] as Species[]).map((species, i) => ({ id: i + 1, species, name: SPECIES[species].name, xp: 0, duty: 'explore' })),
    flowers: {}, blooms: [false, false], expanded: false,
    beds: [newBed(), newBed()], harvested: 0, fed: 0, hatched: 0, player: { x: 510, y: 700 }, savedAt: Date.now() }
}
function newBed(): Bed { return { crop: 'berry', progress: 0, active: false, cycles: 0 } }
export function feed(s: GameState, id: number): boolean {
  const c = s.creatures.find(c => c.id === id)
  if (!c || s.essence < 1) return false
  s.essence--; s.petals += 10; c.xp += 12; s.fed++; return true
}
export function assign(s: GameState, id: number, duty: Creature['duty']): boolean {
  const c = s.creatures.find(c => c.id === id)
  if (!c) return false
  if (duty === 'farm' && c.duty !== 'farm' && workers(s) >= (s.expanded ? 4 : 2)) return false
  c.duty = duty; return true
}
export function workers(s: GameState) { return s.creatures.filter(c => c.duty === 'farm').length }
export function speed(s: GameState) { return Math.min(1.75, 1 + Math.max(0, workers(s) - 1) * .25) }
export function bloomProgress(s: GameState, index: number) {
  const g = GIANTS[index]; if (!g) return 0
  return Math.min(20, Object.values(s.flowers).filter(f => Math.hypot(f.x - g.x, f.y - g.y) <= g.radius).length)
}
export function plant(s: GameState, x: number, y: number, color: FlowerColor): { planted: boolean; bloomed: number[] } {
  const result = { planted: false, bloomed: [] as number[] }
  if (s.petals < 1 || !Number.isFinite(x) || !Number.isFinite(y) || x < 65 || y < 65 || x > 1835 || y > 1135) return result
  const gx = Math.floor(x / 28), gy = Math.floor(y / 28), key = `${gx},${gy}`
  if (s.flowers[key]) return result
  s.flowers[key] = { x: gx * 28 + 14, y: gy * 28 + 14, color }; s.petals--; result.planted = true
  s.creatures.filter(c => c.duty === 'explore').forEach(c => c.xp += .5)
  GIANTS.forEach((_, index) => {
    if (!s.blooms[index] && bloomProgress(s, index) >= 20) {
      const first = !s.blooms.some(Boolean)
      s.blooms[index] = true; s.essence += 3; s.seeds += 2
      // Both one-time blooms guarantee an egg so the prototype remains reproducible.
      s.eggs++; if (first) s.seeds++
      result.bloomed.push(index)
    }
  })
  return result
}
export function hatch(s: GameState): Creature | null {
  if (s.eggs < 1) return null
  s.eggs--; s.hatched++
  const types: Species[] = ['momo', 'lumi', 'pipi']; const species = types[s.hatched % 3]
  const c: Creature = { id: Math.max(0, ...s.creatures.map(c => c.id)) + 1, species, name: SPECIES[species].name, xp: 0, duty: 'explore' }
  s.creatures.push(c); return c
}
export function unlocked(s: GameState, crop: Crop) { return crop === 'berry' || (crop === 'luna' ? s.blooms.some(Boolean) : s.harvested >= 2) }
export function selectCrop(s: GameState, index: number, crop: Crop): boolean {
  const bed = s.beds[index]
  if (!bed || !unlocked(s, crop)) return false
  if (bed.active) bed.nextCrop = crop
  else bed.crop = crop
  return true
}
export function tickFarm(s: GameState, dt: number): number {
  if (workers(s) === 0 || dt <= 0 || !Number.isFinite(dt)) return 0
  let total = 0
  s.beds.forEach(b => {
    // Use elapsed time in bounded cycles; called once per second even outside the greenhouse.
    let remaining = Math.min(dt, 3600)
    while (remaining > 0) {
      if (!b.active) { if (s.seeds < 1) break; s.seeds--; b.active = true; b.progress = 0 }
      const duration = CROPS[b.crop].seconds / speed(s)
      const consumed = Math.min(remaining, (1 - b.progress) * duration)
      b.progress += consumed / duration; remaining -= consumed
      if (b.progress >= 1 - 1e-9) {
        b.active = false; b.progress = 0; b.cycles++; s.harvested++; total++
        // Every harvest returns a seed: renewable production cannot exhaust itself.
        s.seeds++
        if (b.crop === 'berry') { s.essence += 2; s.crystals += 2 }
        if (b.crop === 'luna') { s.petals += 12; s.essence++; s.crystals += 3 }
        if (b.crop === 'herb') { s.essence++; s.crystals += 5 }
        s.creatures.filter(c => c.duty === 'farm').forEach(c => c.xp += 3)
        if (b.nextCrop) { b.crop = b.nextCrop; delete b.nextCrop }
      }
    }
  }); return total
}
export function expand(s: GameState): boolean {
  if (s.expanded || s.crystals < 8) return false
  s.crystals -= 8; s.expanded = true; s.beds.push(newBed(), newBed()); s.seeds += 2; return true
}
export const MISSIONS = [
  { title: '친구에게 정수를 먹여주세요', detail: '생명체를 선택하고 정수 1개를 먹여요.', target: 1, value: (s: GameState) => s.fed },
  { title: '별빛 목련 주변에 꽃 20송이 심기', detail: '꽃 심기를 켜고 점선 원 안을 걸어보세요.', target: 20, value: (s: GameState) => Math.max(...GIANTS.map((_, i) => bloomProgress(s, i))) },
  { title: '새로운 친구를 만나보세요', detail: '부화실에서 탐험으로 얻은 알을 깨워요.', target: 1, value: (s: GameState) => s.hatched },
  { title: '스마트팜에서 작물 2번 수확하기', detail: '친구를 배치하면 심기부터 수확까지 자동!', target: 2, value: (s: GameState) => s.harvested },
  { title: '우리의 온실을 더 넓게', detail: '별빛 결정 8개로 두 번째 온실을 열어요.', target: 1, value: (s: GameState) => Number(s.expanded) },
]
export function missionIndex(s: GameState) { const i = MISSIONS.findIndex(m => m.value(s) < m.target); return i < 0 ? MISSIONS.length : i }
export function restore(raw: string | null): GameState {
  if (!raw) return createState()
  try {
    const s = JSON.parse(raw) as GameState
    if (s.version !== 1 || !Array.isArray(s.creatures) || s.creatures.length < 3 || !Array.isArray(s.beds) || !Array.isArray(s.blooms) || s.blooms.length !== 2 || !s.flowers || typeof s.flowers !== 'object' || typeof s.expanded !== 'boolean') return createState()
    for (const key of ['essence','petals','seeds','crystals','eggs','harvested','fed','hatched','savedAt'] as const) if (!Number.isFinite(s[key]) || s[key] < 0) return createState()
    if (s.beds.length !== (s.expanded ? 4 : 2) || s.blooms.some(b => typeof b !== 'boolean')) return createState()
    if (s.creatures.some(c => !SPECIES[c.species] || !Number.isFinite(c.id) || !Number.isFinite(c.xp) || c.xp < 0 || !['explore','farm'].includes(c.duty) || typeof c.name !== 'string') || new Set(s.creatures.map(c => c.id)).size !== s.creatures.length) return createState()
    if (workers(s) > (s.expanded ? 4 : 2)) return createState()
    if (s.beds.some(b => !CROPS[b.crop] || (b.nextCrop && !CROPS[b.nextCrop]) || !Number.isFinite(b.progress) || b.progress < 0 || b.progress >= 1 || typeof b.active !== 'boolean' || !Number.isFinite(b.cycles) || b.cycles < 0)) return createState()
    if (Object.values(s.flowers).some(f => !f || !Number.isFinite(f.x) || !Number.isFinite(f.y) || !['cream','pink','blue'].includes(f.color))) return createState()
    s.player = { x: Math.max(80, Math.min(1820, Number(s.player?.x) || 510)), y: Math.max(80, Math.min(1120, Number(s.player?.y) || 700)) }
    return s
  } catch { return createState() }
}
