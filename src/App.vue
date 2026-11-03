<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import Icon from './components/Icon.vue'
import CreatureArt from './components/CreatureArt.vue'
import { state, view, go, planting, inputBlocked, flowerColor, joystick, selectedCreature, happyId, notify, notices, reward, saveStatus, resetGame, startStore, stopStore } from './game/store'
import { SPECIES, CROPS, GIANTS, MISSIONS, missionIndex, feed, hatch, assign, workers, speed, expand, selectCrop, unlocked, bloomProgress, type View, type Crop, type FlowerColor } from './game/model'
const nav: { id: View; name: string; en: string; icon: string }[] = [
  { id:'station',name:'나의 정거장',en:'MY STATION',icon:'station' },{ id:'explore',name:'행성 탐험',en:'EXPLORE',icon:'planet' },{ id:'farm',name:'스마트팜',en:'SMART FARM',icon:'leaf' },{ id:'creatures',name:'생명체 도감',en:'LITTLE FRIENDS',icon:'friends' },{ id:'hatch',name:'부화실',en:'HATCHERY',icon:'egg' }]
const current = computed(()=>nav.find(n=>n.id===view.value)!)
const selected = computed(()=>state.creatures.find(c=>c.id===selectedCreature.value)||state.creatures[0])
const flowerCount = computed(()=>Object.keys(state.flowers).length)
const team = computed(()=>state.creatures.filter(c=>c.duty==='explore'))
const workerCount = computed(()=>workers(state))
const missionNo = computed(()=>missionIndex(state))
const mission = computed(()=>MISSIONS[Math.min(missionNo.value,MISSIONS.length-1)])
const missionValue = computed(()=>Math.min(mission.value.target,mission.value.value(state)))
const modal = ref<'help'|'settings'|null>(null)
const resetConfirm = ref(false)
const feeding = ref<number|null>(null)
const hatching = ref(false)
const sound = ref(false)
const hatchResult = ref<number|null>(null)
watch([modal, reward, hatching], () => { inputBlocked.value = Boolean(modal.value || reward.value || hatching.value); if(inputBlocked.value) padStop() })
let audio: AudioContext | undefined
let hatchTimer: ReturnType<typeof setTimeout> | undefined
let feedTimer: ReturnType<typeof setTimeout> | undefined
function chime() {
  if(!sound.value)return
  audio ||= new AudioContext();void audio.resume()
  ;[523.25,659.25,783.99].forEach((frequency,i)=>{const o=audio!.createOscillator(),g=audio!.createGain(),t=audio!.currentTime+i*.08;o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.4);o.connect(g).connect(audio!.destination);o.start(t);o.stop(t+.4)})
}
function giveFood() {
  if(feed(state,selected.value.id)) {chime();feeding.value=selected.value.id;happyId.value=selected.value.id;notify(`${selected.value.name}가 행복해해요! 꽃잎 +10`);clearTimeout(feedTimer);feedTimer=setTimeout(()=>feeding.value=null,1500)}
  else notify('정수가 부족해요. 스마트팜에 친구를 배치해 정수를 모아보세요.','info')
}
function changeDuty(id:number,duty:'farm'|'explore') {
  if(assign(state,id,duty)){notify(duty==='farm'?'친구가 스마트팜에 도착했어요!':'탐험팀에 합류했어요!');chime()}
  else notify('온실이 가득 찼어요. 온실을 확장하면 더 배치할 수 있어요.','info')
}
function togglePlanting(){
  if(!planting.value && state.petals===0){notify('먼저 친구에게 정수를 먹여 꽃잎을 모아주세요.','info');return}
  planting.value=!planting.value
}
function startHatch(){
  if(hatching.value||state.eggs<1)return
  hatching.value=true;hatchResult.value=null;chime()
  hatchTimer=setTimeout(()=>{const c=hatch(state);hatching.value=false;if(c){selectedCreature.value=c.id;hatchResult.value=c.id;reward.value={title:`안녕, ${c.name}!`,text:'새로운 친구가 탐험팀에 합류했어요.\n도감에서 정수를 먹이거나 스마트팜에 배치해보세요.'};chime()}},2200)
}
function doExpand(){if(expand(state)){chime();reward.value={title:'우리의 정원이 더 넓어졌어요!',text:'새로운 재배 구역 +2 · 씨앗 +2\n이제 친구 4마리가 함께 농사를 지을 수 있어요.'}}}
function cropChanged(index:number,event:Event){selectCrop(state,index,(event.target as HTMLSelectElement).value as Crop)}
function missionGo(){go(missionNo.value===0?'creatures':missionNo.value===1?'explore':missionNo.value===2?'hatch':'farm')}
const flowerOptions:{id:FlowerColor;name:string;color:string}[]=[{id:'cream',name:'별빛 꽃',color:'#f2dba3'},{id:'blue',name:'하늘 꽃',color:'#9ac7e4'},{id:'pink',name:'분홍 꽃',color:'#e9a7c5'}]
function padStart(e:PointerEvent,x:number,y:number){(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);joystick.x=x;joystick.y=y}
function padStop(){joystick.x=0;joystick.y=0}
onMounted(startStore)
onBeforeUnmount(()=>{clearTimeout(hatchTimer);clearTimeout(feedTimer);void audio?.close();stopStore()})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#" @click.prevent="go('station')" aria-label="코스모 가든 홈"><span class="brand-mark"><Icon name="sprout" :size="29"/></span><span><strong>cosmo<span>garden</span></strong><small>나의 작은 우주 정원</small></span></a>
      <div class="sidebar-caption">MY LITTLE UNIVERSE</div>
      <nav aria-label="게임 메뉴"><button v-for="item in nav" :key="item.id" :class="['nav-item',{active:view===item.id}]" @click="go(item.id)" :aria-current="view===item.id?'page':undefined"><Icon :name="item.icon" :size="23"/><span>{{item.name}}</span><b v-if="item.id==='hatch'&&state.eggs" class="nav-badge">{{state.eggs}}</b><span v-else-if="view===item.id" class="nav-dot"/></button></nav>
      <div class="sidebar-note"><div class="note-planet"><Icon name="planet" :size="35"/><span>✦</span></div><strong>조금씩, 초록빛으로.</strong><p>작은 발걸음이 모여<br>커다란 정원이 될 거예요.</p><span class="note-coordinate">PLANET C-021 · 나의 첫 행성</span></div>
      <div class="sidebar-bottom"><button @click="modal='help'"><Icon name="help" :size="19"/><span>플레이 가이드</span></button><button @click="modal='settings'"><Icon name="settings" :size="19"/><span>설정</span></button><small>COSMO GARDEN <span>PROTOTYPE 0.1</span></small></div>
    </aside>
    <main>
      <header class="topbar"><div class="breadcrumb">나의 우주 <Icon name="chevron" :size="13"/><span>{{current.name}}</span></div><div class="resources" aria-label="보유 자원"><div class="resource essence" title="꽃 정수 · 친구에게 먹이면 꽃잎 10개"><Icon name="drop"/><span>꽃 정수</span><strong data-testid="essence">{{state.essence}}</strong></div><div class="resource petals" title="꽃을 한 송이 심을 때 꽃잎 1개"><Icon name="flower"/><span>꽃잎</span><strong data-testid="petals">{{state.petals}}</strong></div><div class="resource seeds" title="자동 재배용 씨앗 · 수확하면 씨앗이 돌아와요"><Icon name="seed"/><span>씨앗</span><strong>{{state.seeds}}</strong></div><div class="resource crystals" title="별빛 결정 · 8개로 온실 확장"><Icon name="crystal"/><span>별빛 결정</span><strong data-testid="crystals">{{state.crystals}}</strong></div></div><button class="icon-button sound-button" @click="sound=!sound;chime()" :aria-label="sound?'효과음 끄기':'효과음 켜기'" :aria-pressed="sound"><Icon :name="sound?'sound':'mute'" :size="19"/></button></header>
      <div class="page-content">
        <div class="page-heading"><div><div class="eyebrow"><span/>{{current.en}}</div><h1>{{view==='station'?'오늘도, 반가워요 탐험가님':view==='explore'?'발걸음마다 피어나는 우주':view==='farm'?'작은 친구들의 커다란 농장':view==='creatures'?'우리가 만난 작은 친구들':'새로운 만남이 기다리는 곳'}}<span class="heading-star">✧</span></h1><p>{{view==='station'?'친구들과 함께, 나만의 우주 정원을 가꿔보세요.':view==='explore'?'정수로 꽃잎을 모으고, 별빛 목련 주변을 꽃으로 채워주세요.':view==='farm'?'친구를 배치하면 씨앗 심기부터 수확까지 알아서 척척.':view==='creatures'?'함께 걷고, 함께 자라는 우리만의 탐험대예요.':'행성에서 발견한 알 속에는 어떤 친구가 있을까요?'}}</p></div><div class="saved"><Icon name="check" :size="15"/><span>{{saveStatus}}</span></div></div>

        <div class="play-layout">
          <section class="world-column">
            <div class="world" :class="{'collection-world':view==='creatures','hatching':hatching}">
              <GameCanvas/>
              <div v-if="view!=='creatures'" class="world-top"><div class="location-pill"><span class="live-dot"/><span>{{view==='explore'?'별빛 초원':view==='farm'?'제1 우주 온실':view==='hatch'?'별빛 부화실':'코스모 우주정거장'}}</span><small>{{view==='explore'?'C-021':view==='farm'?'AUTO FARM':'HOME BASE'}}</small></div><div class="weather"><Icon name="sun" :size="18"/>포근한 별빛 <span>24°</span></div></div>
              <div v-if="view==='station'" class="station-intro"><span class="tiny-label">A LITTLE SPACE, A LOT OF LIFE</span><h2>이곳에서 시작되는<br>우리의 작은 우주.</h2><span class="intro-line"/></div>
              <div v-if="view==='station'" class="world-bottom station-bottom"><div class="planet-caption"><span class="small-orbit">✧</span><div><strong>탐험을 떠나볼까요?</strong><small>새로운 꽃과 친구들이 기다려요.</small></div></div><button class="button primary" @click="go('explore')"><Icon name="planet" :size="20"/>행성 탐험하기<Icon name="arrow" :size="19"/></button></div>
              <template v-if="view==='explore'">
                <button class="return-button" @click="go('station')"><Icon name="home" :size="18"/>정거장 복귀</button>
                <div class="map-compass"><span>N</span><Icon name="planet" :size="33"/><i/></div>
                <div class="direction-pad" aria-label="터치 이동 패드"><button class="pad-up" aria-label="위로 이동" @pointerdown.prevent="padStart($event,0,-1)" @pointerup="padStop" @pointercancel="padStop" @lostpointercapture="padStop">↑</button><button class="pad-left" aria-label="왼쪽 이동" @pointerdown.prevent="padStart($event,-1,0)" @pointerup="padStop" @pointercancel="padStop" @lostpointercapture="padStop">←</button><span>✧</span><button class="pad-right" aria-label="오른쪽 이동" @pointerdown.prevent="padStart($event,1,0)" @pointerup="padStop" @pointercancel="padStop" @lostpointercapture="padStop">→</button><button class="pad-down" aria-label="아래로 이동" @pointerdown.prevent="padStart($event,0,1)" @pointerup="padStop" @pointercancel="padStop" @lostpointercapture="padStop">↓</button></div>
                <div class="explore-bottom"><button :class="['button',planting?'planting-button':'primary']" @click="togglePlanting" :aria-pressed="planting"><Icon :name="planting?'pause':'flower'" :size="20"/>{{planting?'꽃 심는 중 · 멈추기':'꽃 심기 시작'}}<span>{{state.petals}} 꽃잎</span></button><small>WASD / 방향키 · 지도를 눌러 이동</small></div>
              </template>
              <div v-if="view==='farm'" class="farm-world-footer"><span class="auto-indicator" :class="{running:workerCount>0}"><span/>{{workerCount?'자동 재배 가동 중':'친구를 배치해 시작하세요'}}</span><small>수확한 씨앗은 다시 심어요 · 다른 화면에서도 계속 자라요</small></div>
              <template v-if="view==='hatch'"><div class="hatch-visual" v-if="hatching"><span class="hatch-glow"/><span class="egg-art">✦</span><span class="hatch-spark s1">✧</span><span class="hatch-spark s2">✦</span><strong>작은 심장이 두근두근…</strong></div><div class="hatch-world-footer"><span class="tiny-label">A NEW FRIEND, A NEW STORY</span><h2>{{hatching?'곧 만날 수 있어요!':'알 속의 친구를 깨워주세요'}}</h2><button class="button primary" :disabled="state.eggs===0||hatching" @click="startHatch"><Icon name="egg"/>{{hatching?'부화하는 중…':`알 부화하기 (${state.eggs})`}}</button></div></template>
              <div v-if="view==='creatures'" class="collection-content"><div class="collection-top"><span class="tiny-label">COSMO FIELD NOTES</span><span class="collection-count">발견한 생명체 <b>03</b> / 03</span></div><h2>우리의 초록빛 동행</h2><p>모든 친구가 탐험도, 농사도 할 수 있어요.</p><div class="creature-grid"><button v-for="(info,species,index) in SPECIES" :key="species" :class="['species-card',{chosen:selected.species===species}]" @click="selectedCreature=state.creatures.find(c=>c.species===species)!.id"><span class="species-number">NO. 00{{index+1}}</span><CreatureArt :species="species" :happy="feeding===selected.id && selected.species===species"/><h3>{{info.name}}<span>{{state.creatures.filter(c=>c.species===species).length}}마리</span></h3><small>{{info.habitat}}에서 온 친구</small><p>{{info.description}}</p><span class="species-tag"><Icon name="check" :size="12"/>발견 완료</span></button></div><div class="friend-list-label">함께하는 친구들 <span>{{state.creatures.length}}</span></div><div class="member-list"><button v-for="c in state.creatures" :key="c.id" :class="{selected:selected.id===c.id}" @click="selectedCreature=c.id"><span class="member-dot" :style="{background:SPECIES[c.species].color}"/>{{c.name}} <small>#{{String(c.id).padStart(2,'0')}}</small><span class="member-duty">{{c.duty==='farm'?'온실':'탐험팀'}}</span></button></div></div>
            </div>
            <div class="below-world"><span><Icon :name="view==='explore'?'flower':'sprout'" :size="16"/>{{view==='explore'?`지금까지 심은 꽃 ${flowerCount}송이`:'작은 생명이 모여, 하나의 우주가 됩니다.'}}</span><span>PLANET C-021 <span class="separator">/</span> COSMO GARDEN</span></div>
            <div class="mission-banner" @click="missionGo" @keydown.enter="missionGo" role="button" tabindex="0"><div class="mission-icon"><Icon :name="missionNo>=5?'check':'star'" :size="23"/></div><div class="mission-copy"><div class="tiny-label">{{missionNo>=5?'ALL MISSIONS COMPLETE':'오늘의 작은 목표'}}<span>{{Math.min(missionNo+1,5)}} / 5</span></div><strong>{{missionNo>=5?'멋진 정원을 완성했어요! 자유롭게 탐험해보세요.':mission.title}}</strong><small>{{missionNo>=5?'모든 핵심 미션을 완료했어요. 친구들과 계속 가꿔보세요.':mission.detail}}</small></div><div class="mission-progress"><div class="track"><span :style="{width:`${missionValue/mission.target*100}%`}"/></div><span>{{missionValue}} / {{mission.target}}</span></div><Icon name="chevron" :size="18"/></div>
          </section>

          <aside class="detail-column">
            <section v-if="view==='station'" class="panel greeting-panel"><div class="panel-header"><h2>나의 정원 이야기</h2><span class="panel-number">LOG 001</span></div><div class="garden-stats"><div><strong>{{state.creatures.length.toString().padStart(2,'0')}}</strong><small>함께하는 친구</small></div><span/><div><strong>{{flowerCount.toString().padStart(2,'0')}}</strong><small>심은 꽃</small></div><span/><div><strong>{{state.blooms.filter(Boolean).length.toString().padStart(2,'0')}}</strong><small>피어난 거대 꽃</small></div></div><div class="friends-parade"><button v-for="c in state.creatures.slice(0,5)" :key="c.id" @click="selectedCreature=c.id;go('creatures')" :aria-label="`${c.name} 만나기`"><CreatureArt :species="c.species"/></button></div><p>오늘도 함께라서 더 즐거워요.</p></section>
            <section v-if="view==='station'||view==='creatures'||view==='explore'" class="panel friend-panel"><div class="panel-header"><h2>{{view==='creatures'?'친구 자세히 보기':'친구에게 마음을 주세요'}}</h2><span class="soft-label">Lv. {{Math.floor(selected.xp/30)+1}}</span></div><div class="selected-friend"><div class="friend-avatar" :style="{background:SPECIES[selected.species].color+'30'}"><CreatureArt :species="selected.species" :happy="feeding===selected.id"/><span v-if="feeding===selected.id" class="floating-heart">♥</span></div><div><span class="tiny-label">MY LITTLE FRIEND</span><h3>{{selected.name}}<small>#{{String(selected.id).padStart(2,'0')}}</small></h3><span class="friend-status"><span/>{{selected.duty==='farm'?'온실에서 일하는 중':'탐험을 기다리는 중'}}</span></div></div><div class="xp-row"><span>함께 자라는 중</span><span>{{Math.floor(selected.xp%30)}} / 30</span></div><div class="track xp"><span :style="{width:`${selected.xp%30/30*100}%`}"/></div><button class="button feed-button" :disabled="state.essence<1" @click="giveFood"><Icon name="drop" :size="18"/>정수 먹이기<span>1 <Icon name="arrow" :size="13"/>꽃잎 10</span></button><p class="footnote">정수를 먹으면 꽃잎을 선물해요.</p><div v-if="view==='creatures'" class="duty-control"><span>친구가 함께할 곳</span><div class="segmented"><button :class="{active:selected.duty==='explore'}" @click="changeDuty(selected.id,'explore')"><Icon name="planet" :size="16"/>탐험팀</button><button :class="{active:selected.duty==='farm'}" @click="changeDuty(selected.id,'farm')"><Icon name="leaf" :size="16"/>스마트팜</button></div></div></section>

            <section v-if="view==='explore'" class="panel flower-panel"><div class="panel-header"><h2>오늘 심을 꽃</h2><Icon name="flower" :size="18"/></div><div class="flower-options"><button v-for="f in flowerOptions" :key="f.id" :class="{selected:flowerColor===f.id}" @click="flowerColor=f.id" :aria-pressed="flowerColor===f.id"><span :style="{color:f.color}">✿</span><small>{{f.name}}</small><i v-if="flowerColor===f.id"><Icon name="check" :size="10"/></i></button></div><div class="bloom-list"><div v-for="(g,i) in GIANTS" :key="g.name"><div><span>{{g.name}}</span><small>{{state.blooms[i]?'개화 완료':`${bloomProgress(state,i)} / 20`}}</small></div><div class="track"><span :style="{width:`${bloomProgress(state,i)*5}%`}"/></div></div></div><p class="footnote">점선 원 안에 꽃 20송이를 심으면 개화해요.</p></section>
            <section v-if="view==='explore'" class="panel compact-team"><div class="panel-header"><h2>탐험대</h2><span>{{team.length}}마리</span></div><div class="team-mini"><CreatureArt v-for="c in team" :key="c.id" :species="c.species"/><button class="round-add" @click="go('creatures')" aria-label="탐험대 관리">＋</button></div><p v-if="!team.length" class="footnote">혼자서도 꽃을 심을 수 있어요.</p></section>

            <template v-if="view==='farm'">
              <section class="panel farm-settings"><div class="panel-header"><h2>함께 일하는 친구들</h2><span class="soft-label">{{workerCount}} / {{state.expanded?4:2}}</span></div><p class="panel-desc">친구를 누르면 온실에 배치돼요.</p><div class="worker-list"><button v-for="c in state.creatures" :key="c.id" :class="{assigned:c.duty==='farm'}" @click="changeDuty(c.id,c.duty==='farm'?'explore':'farm')" :aria-pressed="c.duty==='farm'"><CreatureArt :species="c.species"/><span>{{c.name}}<small>#{{c.id.toString().padStart(2,'0')}}</small></span><span class="assign-check"><Icon v-if="c.duty==='farm'" name="check" :size="13"/><template v-else>＋</template></span></button></div><div class="efficiency"><Icon name="leaf" :size="16"/><span>재배 속도</span><b>× {{workerCount?speed(state).toFixed(2):'0.00'}}</b></div></section>
              <section class="panel crop-settings"><div class="panel-header"><h2>재배 구역</h2><small>자동 수확 {{state.harvested}}회</small></div><div class="bed-setting" v-for="(bed,i) in state.beds" :key="i"><label :for="`crop-${i}`"><span>0{{i+1}}</span><select :id="`crop-${i}`" :value="bed.nextCrop || bed.crop" @change="cropChanged(i,$event)"><option v-for="(crop,key) in CROPS" :key="key" :value="key" :disabled="!unlocked(state,key)">{{crop.name}}{{unlocked(state,key)?'':' · 잠김'}}</option></select><span class="crop-time">{{CROPS[bed.crop].seconds}}s</span></label><div class="track"><span :style="{width:`${bed.progress*100}%`,background:CROPS[bed.crop].color}"/></div><small>{{bed.active?`${Math.floor(bed.progress*100)}% 성장 중 · 다음 재배: ${CROPS[bed.nextCrop || bed.crop].name}`:CROPS[bed.crop].reward}}</small></div><p class="footnote">첫 개화 → 루나 플라워 · 수확 2회 → 허브</p><p class="seed-note"><Icon name="seed" :size="14"/>수확할 때마다 씨앗 1개를 돌려받아요.</p></section>
            </template>

            <section v-if="view==='station'||view==='farm'" class="panel expansion-panel" :class="{unlocked:state.expanded}"><div class="panel-header"><span class="tiny-label">ROOM TO GROW</span><Icon :name="state.expanded?'check':'expand'" :size="19"/></div><h3>{{state.expanded?'더 넓어진 우리 온실':'더 넓은 정원을 꿈꿔요'}}</h3><p>{{state.expanded?'4개의 재배 구역에서 더 많은 친구와 함께해요.':'온실을 확장하고, 더 많은 친구와 함께 작물을 길러보세요.'}}</p><button v-if="!state.expanded" class="button expand-button" :disabled="state.crystals<8" @click="doExpand"><Icon name="crystal" :size="17"/>{{state.crystals}} / 8<span>온실 확장<Icon name="arrow" :size="15"/></span></button><span v-else class="expansion-done">확장 완료 · 재배 구역 +2</span></section>
            <section v-if="view==='hatch'" class="panel hatch-panel"><div class="panel-header"><h2>별빛 알 보관함</h2><span class="soft-label">{{state.eggs}}개</span></div><div class="egg-slot"><span class="egg-illustration" :class="{empty:!state.eggs}">✧</span><h3>{{state.eggs?'새 친구가 기다리고 있어요':'아직은 조용한 부화실'}}</h3><p>거대 식물을 개화시키면<br>별빛 알을 발견할 수 있어요.</p></div><div class="hatch-info"><Icon name="star" :size="17"/><p>프로토타입에서는 거대 식물마다<br>알을 한 번씩 확정으로 선물해요.</p></div><button class="button pale-button" @click="go(hatchResult?'creatures':'explore')">{{hatchResult?'새로운 친구 만나기':'별빛 알 찾으러 가기'}}<Icon name="arrow" :size="17"/></button></section>
            <div v-if="view==='station'||view==='hatch'||view==='creatures'" class="quiet-note"><Icon name="sprout" :size="21"/><p>서두르지 않아도 괜찮아요.<br>우리의 정원은 매일 자라니까요.</p></div>
          </aside>
        </div>
        <footer class="page-footer"><span>GROW A GARDEN. FIND YOUR UNIVERSE.</span><span><i/>싱글플레이 · 나만의 우주</span></footer>
      </div>
    </main>
    <div class="toast-stack" aria-live="polite"><TransitionGroup name="toast"><div v-for="n in notices" :key="n.id" class="toast" :class="n.kind"><Icon :name="n.kind==='good'?'check':'help'" :size="19"/>{{n.text}}</div></TransitionGroup></div>
    <div v-if="reward" class="modal-backdrop" @click.self="reward=null"><section class="modal reward-modal" role="dialog" aria-modal="true" aria-labelledby="reward-title"><button class="modal-close icon-button" @click="reward=null" aria-label="보상 창 닫기"><Icon name="close"/></button><div class="reward-art"><Icon name="flower" :size="65"/><span>✧</span><i>✦</i></div><span class="tiny-label">A LITTLE WONDER!</span><h2 id="reward-title">{{reward.title}}</h2><p class="reward-text">{{reward.text}}</p><button class="button primary" @click="reward=null">좋아요!<Icon name="check" :size="18"/></button></section></div>
    <div v-if="modal" class="modal-backdrop" @click.self="modal=null;resetConfirm=false"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="modal-close icon-button" @click="modal=null;resetConfirm=false" aria-label="닫기"><Icon name="close"/></button><span class="eyebrow">COSMO GARDEN</span><h2 id="modal-title">{{modal==='help'?'작은 탐험가를 위한 가이드':'정원 설정'}}</h2><template v-if="modal==='help'"><ol class="guide-list"><li><strong>친구에게 정수를 주세요.</strong><p>정수 1개를 먹이면 꽃잎 10개를 얻어요.</p></li><li><strong>행성에 꽃을 심어보세요.</strong><p>꽃 심기를 켜고 WASD, 방향키, 터치 패드 또는 지도 클릭으로 이동하세요. 점선 원 안에 20송이를 심으면 거대 꽃이 피어나요.</p></li><li><strong>알 속의 친구를 만나세요.</strong><p>개화 보상 알을 부화실에서 깨워요.</p></li><li><strong>스마트팜에 친구를 배치하세요.</strong><p>20~40초마다 자동으로 수확해요. 씨앗을 돌려받아 재배가 이어지고, 결정 8개로 온실을 확장해요. 재배 중 품종을 바꾸면 다음 수확 후 적용돼요.</p></li></ol><p class="footnote">진행 상황은 이 브라우저에 자동 저장돼요. 게임이 열려 있는 동안 농장이 작동해요.</p></template><template v-else><div class="setting-row"><span>효과음</span><button class="button pale-button" @click="sound=!sound;chime()">{{sound?'켜짐':'꺼짐'}}<Icon :name="sound?'sound':'mute'" :size="18"/></button></div><div class="setting-row"><span>저장 상태</span><small>{{saveStatus}}</small></div><div class="reset-area"><h3>새 정원 시작하기</h3><p>친구, 자원, 꽃 심기 기록을 모두 초기화해요.</p><button class="button danger-button" @click="resetConfirm=true" v-if="!resetConfirm">게임 초기화</button><div v-else><p>저장된 진행 상황을 지울까요?</p><button class="button danger-button" @click="resetGame();resetConfirm=false;modal=null">초기화하고 새로 시작</button><button class="button pale-button" @click="resetConfirm=false">취소</button></div></div></template></section></div>
  </div>
</template>
