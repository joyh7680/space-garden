import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createState, feed, assign, workers, speed, plant, bloomProgress, hatch, tickFarm, expand, restore, selectCrop, unlocked, GIANTS, missionIndex } from '../src/game/model.ts'

test('starts with exactly the requested starter resources and three original creatures', () => {
  const s=createState()
  assert.deepEqual([s.creatures.length,s.essence,s.petals,s.seeds,s.beds.length],[3,6,0,2,2])
  assert.equal(new Set(s.creatures.map(c=>c.species)).size,3)
})
test('feeding consumes exactly one essence, adds ten petals and XP, never allows debt', () => {
  const s=createState()
  assert.equal(feed(s,99),false)
  for(let i=0;i<6;i++) assert.equal(feed(s,1),true)
  assert.equal(feed(s,1),false)
  assert.deepEqual([s.essence,s.petals,s.creatures[0].xp,s.fed],[0,60,72,6])
})
test('planting deduplicates tiles, requires petals, and ignores flowers outside a giant radius', () => {
  const s=createState(); assert.equal(plant(s,650,500,'pink').planted,false)
  feed(s,1); assert.equal(plant(s,651,501,'blue').planted,true)
  assert.equal(plant(s,653,503,'pink').planted,false)
  assert.equal(s.petals,9)
  assert.equal(Object.values(s.flowers)[0].color,'blue')
  plant(s,80,80,'cream'); assert.equal(bloomProgress(s,0),1)
  assert.equal(plant(s,-10,20,'cream').planted,false)
})
function bloom(s:ReturnType<typeof createState>, index=0) {
  s.petals+=25
  for(let i=0;i<20;i++)plant(s,GIANTS[index].x-70+(i%5)*28,GIANTS[index].y-70+Math.floor(i/5)*28,'cream')
}
test('20 nearby flowers bloom each giant once and award exactly one guaranteed egg', () => {
  const s=createState();bloom(s)
  assert.equal(s.blooms[0],true);assert.equal(s.eggs,1);assert.equal(s.essence,9);assert.equal(s.seeds,5)
  const essence=s.essence;bloom(s);plant(s,650,640,'pink')
  assert.equal(s.eggs,1);assert.equal(s.essence,essence)
  bloom(s,1);assert.deepEqual(s.blooms,[true,true]);assert.equal(s.eggs,2)
})
test('hatching spends one egg and creates a unique, exploration-only creature', () => {
  const s=createState();assert.equal(hatch(s),null);s.eggs=1
  const c=hatch(s)!;assert.equal(c.id,4);assert.equal(c.duty,'explore');assert.equal(s.eggs,0);assert.equal(s.creatures.length,4);assert.equal(hatch(s),null)
})
test('work assignments are exclusive and respect greenhouse capacity', () => {
  const s=createState();assert.equal(assign(s,1,'farm'),true);assert.equal(assign(s,2,'farm'),true);assert.equal(assign(s,3,'farm'),false)
  assert.equal(workers(s),2);assert.equal(speed(s),1.25)
  assign(s,1,'explore');assert.equal(assign(s,3,'farm'),true);assert.equal(s.creatures[0].duty,'explore')
})
test('farm stays idle without workers, automatically grows and harvests with renewable seeds', () => {
  const s=createState();assert.equal(tickFarm(s,60),0);assert.equal(s.seeds,2)
  assign(s,1,'farm');assert.equal(tickFarm(s,19),0);assert.equal(s.seeds,0)
  assert.equal(tickFarm(s,1),2);assert.equal(s.harvested,2);assert.equal(s.essence,10);assert.equal(s.crystals,4);assert.equal(s.seeds,2)
  assert.equal(tickFarm(s,20),2);assert.equal(s.seeds,2);assert.equal(s.crystals,8)
  assign(s,1,'explore');const before=JSON.stringify(s.beds);tickFarm(s,100);assert.equal(JSON.stringify(s.beds),before)
})
test('unlocked crops queue for next cycle without replacing the current crop or progress', () => {
  const s=createState();assert.equal(selectCrop(s,0,'luna'),false);bloom(s)
  assert.equal(unlocked(s,'luna'),true);assign(s,1,'farm');tickFarm(s,10)
  assert.equal(selectCrop(s,0,'luna'),true);assert.equal(s.beds[0].crop,'berry');assert.equal(s.beds[0].nextCrop,'luna');assert.equal(s.beds[0].progress,.5)
  tickFarm(s,10);assert.equal(s.beds[0].crop,'luna');assert.equal(s.beds[0].nextCrop,undefined)
  const petals=s.petals;tickFarm(s,30);assert.equal(s.petals,petals+12)
  assert.equal(unlocked(s,'herb'),true)
})
test('rare herb harvest awards expansion materials and consumes no perpetual seeds', () => {
  const s=createState();s.harvested=2;selectCrop(s,0,'herb');s.beds.splice(1,1);assign(s,1,'farm')
  assert.equal(tickFarm(s,40),1);assert.equal(s.crystals,5);assert.equal(s.essence,7);assert.equal(s.seeds,2)
})
test('expansion charges only once, adds visible bed data and increases worker capacity', () => {
  const s=createState();assert.equal(expand(s),false);s.crystals=8;assert.equal(expand(s),true)
  assert.equal(s.crystals,0);assert.equal(s.beds.length,4);assert.equal(s.seeds,4);assert.equal(expand(s),false)
  s.creatures.forEach(c=>assert.equal(assign(s,c.id,'farm'),true));assert.equal(speed(s),1.5)
})
test('save restoration preserves flowers, rewards, assignments and active farm progress', () => {
  const s=createState();feed(s,1);bloom(s);hatch(s);assign(s,2,'farm');tickFarm(s,8)
  const loaded=restore(JSON.stringify(s));assert.deepEqual(loaded,s)
  const eggs=loaded.eggs;plant(loaded,650,650,'pink');assert.equal(loaded.eggs,eggs)
})
test('malformed and incompatible saves safely start a new garden', () => {
  assert.equal(restore('{oops').essence,6);assert.equal(restore('{"version":9}').creatures.length,3)
  const s=createState();s.essence=-1;assert.equal(restore(JSON.stringify(s)).essence,6)
  const bad=createState();bad.beds[0].progress=NaN;assert.equal(restore(JSON.stringify(bad)).beds[0].progress,0)
})
test('complete requested loop is achievable from starter resources without cheats', () => {
  const s=createState();assert.equal(missionIndex(s),0)
  feed(s,1);feed(s,2);assert.equal(missionIndex(s),1)
  for(let i=0;i<20;i++)plant(s,580+(i%5)*28,430+Math.floor(i/5)*28,'pink')
  assert.equal(s.blooms[0],true);assert.equal(missionIndex(s),2)
  const c=hatch(s)!;assert.equal(missionIndex(s),3);assign(s,c.id,'farm');tickFarm(s,40)
  assert.equal(missionIndex(s),4);assert.equal(expand(s),true);assert.equal(missionIndex(s),5)
  assert.deepEqual(restore(JSON.stringify(s)),s)
})
