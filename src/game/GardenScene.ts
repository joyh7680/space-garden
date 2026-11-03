import Phaser from 'phaser'
import { state, view, planting, inputBlocked, flowerColor, joystick, go, notify, reward, happyId, selectedCreature } from './store'
import { GIANTS, bloomProgress, plant, type Species, type View } from './model'

const C = { ink: 0x4d5360, grass: 0xb9d2bd, light: 0xdce4c7, purple: 0xb6a0d3 }
type Actor = { id: number; sprite: Phaser.GameObjects.Image; phase: number }
export class GardenScene extends Phaser.Scene {
  private stage: View | '' = ''
  private player!: Phaser.GameObjects.Image
  private actors: Actor[] = []
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private goal: Phaser.Math.Vector2 | null = null
  private flowerImages = new Map<string, Phaser.GameObjects.Image>()
  private giants: { image: Phaser.GameObjects.Image; text: Phaser.GameObjects.Text; ring: Phaser.GameObjects.Graphics; progress: number }[] = []
  private beds: { plants: Phaser.GameObjects.Image[]; label: Phaser.GameObjects.Text }[] = []
  private expanded = false
  private lastPlant = { x: 0, y: 0 }
  private resizeHandler = () => this.layout()
  constructor() { super('garden') }
  create() {
    this.makeTextures()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>
    this.input.keyboard!.removeCapture('W,A,S,D,UP,DOWN,LEFT,RIGHT')
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (view.value === 'explore') this.goal = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY)
    })
    this.scale.on('resize', this.resizeHandler)
    this.events.once('shutdown', () => this.scale.off('resize', this.resizeHandler))
    this.build()
  }
  private texture(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
    if (this.textures.exists(key)) return
    const g = this.make.graphics({ x: 0, y: 0 }); draw(g); g.generateTexture(key, w, h); g.destroy()
  }
  private ellipse(g: Phaser.GameObjects.Graphics, color: number, x: number, y: number, w: number, h: number, alpha = 1) { g.fillStyle(color, alpha); g.fillEllipse(x, y, w, h) }
  private line(g: Phaser.GameObjects.Graphics, color: number, width: number, points: number[][], alpha = 1) { g.lineStyle(width, color, alpha); g.beginPath(); points.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokePath() }
  private makeTextures() {
    const e = this.ellipse.bind(this), l = this.line.bind(this)
    const colors = { momo: [0xb7d89d,0x7d9f70], lumi: [0xbdb6e5,0x8c81b8], pipi: [0xf0b9af,0xc18b8c] }
    ;(Object.keys(colors) as Species[]).forEach(type => this.texture(type, 100, 115, g => {
      const [body, dark] = colors[type]
      e(g,0x4b4d62,50,104,65,13,.12)
      if (type === 'momo') { e(g,dark,40,23,28,17); e(g,0x9ab978,62,17,29,16); l(g,dark,5,[[50,42],[50,23],[61,16]]) }
      if (type === 'lumi') { e(g,body,29,27,17,44); e(g,body,72,27,17,44); e(g,0x998dc8,29,24,6,24); e(g,0x998dc8,72,24,6,24) }
      if (type === 'pipi') { e(g,dark,26,43,24,21); e(g,dark,77,41,24,21); e(g,body,53,25,16,27) }
      e(g,dark,33,99,24,12); e(g,dark,68,99,24,12)
      e(g,body,50,66,70,72); e(g,0xffffff,53,77,44,33,.2)
      e(g,body,17,73,12,22); e(g,body,83,73,12,22)
      e(g,C.ink,37,60,6,9); e(g,C.ink,65,60,6,9); e(g,0xffffff,38,58,2,3); e(g,0xffffff,66,58,2,3)
      e(g,0xe68e9b,28,70,13,6,.65); e(g,0xe68e9b,74,70,13,6,.65)
      l(g,C.ink,2,[[46,73],[50,76],[55,73]])
      e(g,0xffffff,35,44,16,6,.28)
    }))
    this.texture('astronaut', 100, 130, g => {
      e(g,0x4b4d62,50,118,60,14,.15)
      g.fillStyle(0xb7b1cf); g.fillRoundedRect(14,52,72,41,14)
      g.fillStyle(0xf4f0e7); g.fillRoundedRect(26,66,49,42,14)
      g.fillStyle(0x8c82ad); g.fillRoundedRect(27,101,20,15,6); g.fillRoundedRect(55,101,20,15,6)
      g.fillStyle(0xf4f0e7); g.fillRoundedRect(16,69,15,25,7); g.fillRoundedRect(72,69,15,25,7)
      g.fillStyle(0x867aa8); g.fillRoundedRect(38,78,25,13,4)
      e(g,0xfaf6ed,50,44,70,65); e(g,0x9aacc2,50,45,57,44); e(g,0x607789,52,48,50,37)
      e(g,0xcfe9e1,43,36,25,11,.65); e(g,0xffffff,31,39,8,16,.3)
      e(g,0xecd7aa,87,76,11,12)
      l(g,0xf4f0e7,3,[[50,14],[50,4]]); e(g,0xebd295,50,4,7,7)
    })
    const flowerColors = { cream: 0xfff3ce, blue: 0x9bcbe9, pink: 0xf2b6d0 }
    Object.entries(flowerColors).forEach(([name, color]) => this.texture(`flower-${name}`, 38, 48, g => {
      l(g,0x7fa889,3,[[19,43],[19,22]]); e(g,0x8fb69a,13,34,14,7); e(g,0x93ba9d,25,30,13,7)
      for (let i=0;i<5;i++) { const a=i*Math.PI*2/5; e(g,color,19+Math.cos(a)*8,19+Math.sin(a)*8,13,13) }
      e(g,0xe6bc6b,19,19,9,9); e(g,0xffffff,16,16,3,3,.6)
    }))
    this.texture('mushroom', 130, 150, g => {
      e(g,0x4c5465,65,137,99,18,.11)
      g.fillStyle(0xf4dfd7); g.fillRoundedRect(49,59,31,78,12); e(g,0xc8b6bf,65,73,32,24)
      g.fillStyle(0xa48ab9); g.beginPath();g.moveTo(6,72);g.lineTo(14,46);g.lineTo(39,18);g.lineTo(67,8);g.lineTo(99,25);g.lineTo(122,60);g.lineTo(124,73);g.closePath();g.fillPath()
      e(g,0xcbb4d4,65,66,119,36);e(g,0xb396c1,65,52,108,48)
      e(g,0xf3dce7,42,37,21,12);e(g,0xe7d3e0,80,30,16,10);e(g,0xf2dfe6,95,54,18,11);e(g,0xe6cfdc,26,59,13,8)
      l(g,0xffffff,3,[[30,31],[43,23],[58,18]],.25)
    })
    this.texture('crystals', 100, 120, g => {
      e(g,0x4c5465,50,107,80,15,.1)
      const crystal = (x:number,y:number,w:number,h:number,color:number) => {
        g.fillStyle(color);g.fillPoints([{x,y:y-h},{x:x+w,y:y-h*.65},{x:x+w,y:y-8},{x,y},{x:x-w,y:y-8},{x:x-w,y:y-h*.65}],true)
        g.fillStyle(0xffffff,.25);g.fillTriangle(x,y-h,x+w,y-h*.65,x,y);l(g,0xffffff,1.5,[[x,y-h],[x,y]],.4)
      }
      crystal(30,108,18,66,0xa3cbd4);crystal(57,110,21,101,0xb5a6dc);crystal(80,108,13,52,0xc4b4e2)
    })
    this.texture('bush', 130, 90, g => {
      e(g,0x4c5465,65,77,102,17,.09)
      e(g,0x91b8aa,39,53,56,50);e(g,0xa3c8b3,79,45,65,64);e(g,0xbed8bd,54,41,49,45);e(g,0xc8dfc6,89,33,28,25)
      for(let i=0;i<7;i++) e(g,0xe5efc7,29+i*12,45+(i%3)*9,5,5)
    })
    this.texture('rock',100,75,g=>{ e(g,0x5c566b,50,65,90,15,.12);g.fillStyle(0xb2b1c3);g.fillPoints([{x:8,y:52},{x:27,y:15},{x:58,y:7},{x:84,y:29},{x:93,y:61},{x:54,y:69}],true);g.fillStyle(0xc8c6d3);g.fillTriangle(27,15,58,7,54,69);g.fillStyle(0x9d9fb4);g.fillTriangle(58,7,84,29,54,69) })
    for(let stage=0;stage<5;stage++) this.texture(`giant-${stage}`,260,340,g=>{
      e(g,0x526b67,130,310,194,34,.13)
      l(g,0x74987c,17,[[130,299],[125,220],[132,167]])
      e(g,0x8db093,90,255,90,30);e(g,0xa3c2a0,166,229,94,31);e(g,0xb7cca2,100,287,95,24)
      if(stage<4){
        const w=82+stage*14,h=110+stage*11
        e(g,0xa88cba,130,145,w+12,h+8);e(g,0xcbb0d0,120,139,w,h)
        e(g,0xe3c9df,108,123,w*.48,h*.72);e(g,0xbaa0c7,148,144,w*.4,h*.77)
        e(g,0x90ac8c,103,190,51,21);e(g,0xa2ba99,153,189,58,24)
        l(g,0xf8e6ee,3,[[111,101],[106,133],[115,165]],.6)
      }else{
        for(let i=0;i<8;i++){const a=i*Math.PI/4;e(g,i%2?0xd9b9e6:0xf3d1e8,130+Math.cos(a)*68,133+Math.sin(a)*53,91,81)}
        for(let i=0;i<6;i++){const a=i*Math.PI/3;e(g,0xf4dce9,130+Math.cos(a)*35,127+Math.sin(a)*30,67,62)}
        e(g,0xe6c477,130,130,62,50);e(g,0xf8dfa0,123,122,39,29)
        for(let i=0;i<12;i++){const a=i*2.4;e(g,0xc6a96a,130+Math.cos(a)*20,130+Math.sin(a)*15,4,4)}
      }
    })
    this.texture('greenhouse',620,420,g=>{
      e(g,0x595b72,310,378,565,61,.15)
      g.fillStyle(0xdedbd7);g.fillRoundedRect(31,249,558,128,27)
      g.fillStyle(0xa9b9b5);g.fillRoundedRect(40,281,540,76,12)
      g.fillStyle(0xd0e6df,.82);g.fillEllipse(310,235,550,405);g.fillRect(35,218,550,103)
      g.fillStyle(0xa1c5b5,.8);g.fillRect(43,269,534,55)
      for(let i=0;i<9;i++){const x=88+i*56;e(g,0x78a18c,x,278,54,60);e(g,0x99bb91,x+8,264,46,50);e(g,0xc6dbad,x,249,31,29)}
      g.lineStyle(12,0xecece3);g.beginPath();g.arc(310,228,275,Math.PI,Math.PI*2);g.strokePath();g.strokeRoundedRect(33,214,555,123,8)
      g.lineStyle(8,0xe8ebe1);g.strokeEllipse(310,225,315,384);g.strokeEllipse(310,225,110,384)
      l(g,0xf5f3e7,9,[[35,223],[586,223]])
      g.fillStyle(0xeaeae0);g.fillRoundedRect(252,248,119,121,30);g.fillStyle(0x7faaa3);g.fillRoundedRect(265,262,93,108,26)
      l(g,0xc9dfd0,3,[[310,263],[310,367]])
      g.fillStyle(0xf3f0e3);g.fillRoundedRect(262,233,99,30,9);e(g,0x9eba98,312,247,13,13)
      l(g,0xffffff,7,[[115,127],[140,103],[173,83]],.55)
      g.fillStyle(0xebe7dd);g.fillRoundedRect(219,364,182,24,9);g.fillStyle(0xc8c9bd);g.fillRoundedRect(202,386,216,16,6)
    })
    this.texture('incubator',230,240,g=>{
      e(g,0x585c70,115,220,196,26,.13)
      g.fillStyle(0xd5d2d8);g.fillRoundedRect(27,111,176,103,25);g.fillStyle(0xece9e3);g.fillRoundedRect(21,152,189,59,18)
      g.fillStyle(0xd5dbea,.85);g.fillEllipse(115,117,171,182);g.fillRect(30,115,170,43)
      g.lineStyle(8,0xf1ede7);g.beginPath();g.arc(115,115,85,Math.PI,Math.PI*2);g.strokePath()
      e(g,0xbeb5d9,115,139,67,85);e(g,0xe0d4ec,108,128,45,59);e(g,0xb3a1ce,100,140,15,20);e(g,0xb3a1ce,125,116,12,15)
      g.fillStyle(0xaaa3bc);g.fillRoundedRect(73,172,86,23,8);e(g,0xa8d1ad,89,183,9,9);l(g,0xeceae5,3,[[104,182],[140,182]])
      l(g,0xffffff,5,[[53,83],[66,63],[84,52]],.6)
    })
    this.texture('bed',280,170,g=>{
      e(g,0x4e5663,140,151,259,24,.1)
      g.fillStyle(0xd9ddd0);g.fillRoundedRect(6,31,268,120,25);g.fillStyle(0x87958c);g.fillRoundedRect(6,18,268,113,25)
      g.fillStyle(0x6e7f76);g.fillRoundedRect(18,27,244,91,18)
      g.fillStyle(0x91a197);g.fillRoundedRect(20,103,241,14,6)
      for(let i=0;i<5;i++)l(g,0xa6b3a2,1,[[35+i*48,38],[35+i*48,97]],.35)
      g.fillStyle(0xf1eee2);g.fillRoundedRect(106,128,70,17,5);e(g,0x90bfa1,120,136,6,6)
    })
    for(const type of ['berry','luna','herb'])for(let stage=0;stage<4;stage++)this.texture(`crop-${type}-${stage}`,70,100,g=>{
      e(g,0x3b5952,35,88,48,10,.13)
      if(stage===0){e(g,0xc7ba93,35,83,9,6);e(g,0x8eb28d,32,76,17,8);return}
      const h=stage*18;l(g,0x8bb48b,4,[[35,86],[35,84-h]])
      for(let i=0;i<stage+1;i++){e(g,i%2?0xa8c99a:0x87b48e,25+(i%2)*19,74-i*12,26,13)}
      if(stage>1){
        if(type==='berry'){for(let i=0;i<3+stage;i++)e(g,i%2?0xd8a6cf:0xb9a0d3,19+(i%3)*15,43+Math.floor(i/3)*16,15,16)}
        if(type==='luna'){for(let i=0;i<5;i++){const a=i*1.25;e(g,0xd3c5ed,35+Math.cos(a)*13,27+Math.sin(a)*11,21,18)}e(g,0xf3d58f,35,27,13,13)}
        if(type==='herb'){g.fillStyle(0xa5dce0);g.fillTriangle(35,6,48,31,35,56);g.fillStyle(0xd1ece6);g.fillTriangle(35,6,22,31,35,56)}
      }
    })
    this.texture('spark',24,24,g=>{g.fillStyle(0xfff4ca);g.fillPoints([{x:12,y:0},{x:15,y:9},{x:24,y:12},{x:15,y:15},{x:12,y:24},{x:9,y:15},{x:0,y:12},{x:9,y:9}],true)})
    this.texture('water',14,20,g=>{g.fillStyle(0xa9d8e3);g.fillTriangle(7,0,1,11,13,11);g.fillEllipse(7,12,12,13)})
  }
  private decor(key:string,x:number,y:number,scale=1) { return this.add.image(x,y,key).setOrigin(.5,.9).setScale(scale).setDepth(y) }
  private label(x:number,y:number,text:string,size=14,color='#59666a') {
    return this.add.text(x,y,text,{fontFamily:'"Malgun Gothic", sans-serif',fontSize:size,color,align:'center',backgroundColor:'#f4f3e8',padding:{x:13,y:7},fontStyle:'bold'}).setOrigin(.5).setDepth(y+350)
  }
  private build() {
    this.children.removeAll(true); this.tweens.killAll();this.flowerImages.clear();this.actors=[];this.giants=[];this.beds=[];this.goal=null
    this.stage=view.value;this.expanded=state.expanded
    if(this.stage==='explore') this.buildPlanet()
    else if(this.stage==='farm') this.buildFarm()
    else this.buildStation()
    this.makeActors();this.layout()
  }
  private base(w:number,h:number,color:number) {
    this.cameras.main.setBackgroundColor(color)
    const g=this.add.graphics().setDepth(-2000);g.fillStyle(color);g.fillRect(0,0,w,h)
    // Deterministic ground details keep the terrain calm and handcrafted.
    for(let i=0;i<400;i++){
      const x=(Math.sin(i*124.13)*43758.54%1+1)%1*w,y=(Math.sin(i*15.37)*24634.63%1+1)%1*h
      g.fillStyle(i%3===0?0xe3ead1:0x9ebfae,.35);g.fillEllipse(x,y,3+i%6,2+i%3)
      if(i%8===0){g.lineStyle(1,0x8fb09e,.3);g.lineBetween(x,y,x-3,y-6);g.lineBetween(x,y,x+3,y-5)}
    }
    return g
  }
  private buildPlanet() {
    const g=this.base(1900,1200,0xc8d8c5)
    g.fillStyle(0xb1cabb,.7);g.fillEllipse(420,500,890,750);g.fillEllipse(1280,640,900,850)
    g.lineStyle(100,0xdddac8,.75);g.beginPath();g.moveTo(100,870);g.lineTo(440,800);g.lineTo(900,960);g.lineTo(1320,800);g.lineTo(1830,950);g.strokePath()
    g.fillStyle(0xa8c9cd);g.fillEllipse(1070,270,320,170);g.lineStyle(9,0xc3dbce);g.strokeEllipse(1070,270,335,185)
    g.lineStyle(2,0xd3e7df,.7);g.strokeEllipse(1072,265,203,93);g.strokeEllipse(1040,276,99,38)
    for(let i=0;i<60;i++){
      const x=65+((i*277+40)%1770),y=85+((i*193)%1050)
      if(GIANTS.some(p=>Math.hypot(x-p.x,y-p.y)<210)||Math.hypot(x-510,y-700)<110||Math.hypot(x-1070,y-270)<210)continue
      const key=['bush','mushroom','rock','crystals'][i%4];this.decor(key,x,y,.5+(i%5)*.15)
    }
    this.decor('greenhouse',200,950,.49).setInteractive({useHandCursor:true}).on('pointerdown',()=>go('station'))
    this.label(200,990,'↖  정거장으로',14).setInteractive({useHandCursor:true}).on('pointerdown',()=>go('station'))
    this.decor('rock',1690,310,2);this.decor('rock',1755,320,1.6)
    const cave=this.add.graphics().setDepth(321);cave.fillStyle(0x69677c);cave.fillEllipse(1715,296,70,58)
    this.label(1715,367,'수정 동굴 · 탐사 준비 중',12,'#83818d')
    GIANTS.forEach((p,index)=>{
      const ring=this.add.graphics().setDepth(-50)
      for(let j=0;j<60;j++){const a=j*Math.PI/30;ring.lineStyle(2,0xf7f2da,.6);ring.beginPath();ring.arc(p.x,p.y,p.radius,a,a+.045);ring.strokePath()}
      const image=this.decor(`giant-${state.blooms[index]?4:0}`,p.x,p.y,.85)
      const text=this.label(p.x,p.y+40,'',14)
      this.giants.push({image,text,ring,progress:-1})
    })
    Object.entries(state.flowers).forEach(([key,f])=>this.flowerImages.set(key,this.decor(`flower-${f.color}`,f.x,f.y,.75)))
    this.player=this.decor('astronaut',state.player.x,state.player.y,.66)
    this.add.image(1800,1050,'spark').setAlpha(.3)
  }
  private buildStation() {
    const g=this.base(1320,890,0xd3dfce)
    g.fillStyle(0xc0d2c3);g.fillEllipse(660,600,1150,490)
    g.lineStyle(105,0xe6e1cd,.9);g.beginPath();g.moveTo(690,890);g.lineTo(690,650);g.lineTo(570,500);g.strokePath()
    g.lineStyle(58,0xe4decd,.85);g.lineBetween(670,700,1000,610);g.lineBetween(665,700,315,650)
    g.fillStyle(0xadc9c9);g.fillEllipse(1100,750,270,140);g.lineStyle(6,0xc7d9c7);g.strokeEllipse(1100,750,280,150)
    this.decor('greenhouse',590,570,.92).setInteractive({useHandCursor:true}).on('pointerdown',()=>go('farm'))
    this.label(590,610,'01   스마트팜  ↗',15).setInteractive({useHandCursor:true}).on('pointerdown',()=>go('farm'))
    this.decor('incubator',1010,590,.9).setInteractive({useHandCursor:true}).on('pointerdown',()=>go('hatch'))
    this.label(1010,630,'02   부화실  ↗',14).setInteractive({useHandCursor:true}).on('pointerdown',()=>go('hatch'))
    if(state.expanded){this.decor('greenhouse',290,590,.53);this.label(260,625,'확장 온실 · 가동 중',12)}
    else {
      const plot=this.add.graphics().setDepth(570);plot.lineStyle(3,0xb0b7ac,.65);plot.strokeRoundedRect(128,448,215,117,24);plot.fillStyle(0xd9decd,.4);plot.fillRoundedRect(128,448,215,117,24)
      this.label(238,505,'＋  확장 온실',15,'#929b8d');this.label(238,590,'별빛 결정 8개로 확장',11,'#8a9287')
    }
    const elements:[string,number,number,number][]=[['mushroom',130,400,1.2],['bush',175,470,.9],['bush',1130,480,1],['crystals',1180,610,.9],['rock',1040,820,.7],['bush',80,750,1.3],['mushroom',240,830,.7],['bush',350,825,1],['crystals',80,590,.65],['bush',1220,830,.9],['mushroom',1200,330,.8],['bush',370,380,.9]]
    elements.forEach(d=>this.decor(...d))
    for(let i=0;i<22;i++)this.decor(`flower-${i%3===0?'pink':i%3===1?'cream':'blue'}`,180+(i*43)%940,660+(i*71)%155,.45+(i%3)*.1)
    this.player=this.decor('astronaut',680,715,.68)
    if(this.stage==='hatch'){
      this.cameras.main.setBackgroundColor(0xd5ded5)
      this.decor('incubator',690,735,1.45)
      this.label(690,820,state.eggs?`${state.eggs}개의 별빛 알 · 새로운 만남을 기다려요`:'탐험에서 발견한 별빛 알을 깨워주세요',14)
      this.player.setVisible(false)
    }
    for(let i=0;i<12;i++){
      const spark=this.add.image(100+(i*113)%1150,250+(i*47)%350,'spark').setScale(.2+(i%3)*.1).setAlpha(.3).setDepth(950)
      this.tweens.add({targets:spark,alpha:.8,y:'-=12',duration:1500+i*100,yoyo:true,repeat:-1})
    }
  }
  private buildFarm() {
    const g=this.base(1320,890,0xd4dfd4)
    g.fillStyle(0xb4c6bc);g.fillRoundedRect(105,190,1110,610,40)
    g.fillStyle(0xe4e8da);g.fillRoundedRect(127,211,1066,562,30)
    g.lineStyle(2,0xc9d4c8,.8)
    for(let i=0;i<12;i++)g.lineBetween(150+i*88,225,150+i*88,760)
    for(let i=0;i<7;i++)g.lineBetween(140,225+i*85,1185,225+i*85)
    g.fillStyle(0xb3ceca,.5);g.fillRoundedRect(156,245,1000,100,20)
    for(let i=0;i<7;i++){g.fillStyle(0xd6e5da);g.fillRoundedRect(170+i*140,251,123,82,12);g.lineStyle(5,0xa3bdb4);g.strokeRoundedRect(170+i*140,251,123,82,12)}
    this.label(660,293,'COSMO BOTANICAL LAB   /   01',15,'#6e8d80')
    const slots=[[440,490],[850,490],[440,710],[850,710]]
    slots.forEach(([x,y],index)=>{
      if(index>=state.beds.length){
        const lock=this.add.graphics().setDepth(y);lock.lineStyle(3,0xbfc9ba);lock.strokeRoundedRect(x-135,y-110,270,142,20)
        this.label(x,y-38,'＋  온실 확장으로 열어요',14,'#a1ab9c');return
      }
      this.decor('bed',x,y,1)
      const plants=[]
      for(let i=0;i<4;i++)plants.push(this.decor('crop-berry-0',x-84+i*56,y-39,.65).setDepth(y+3))
      const label=this.label(x,y+30,`${index+1}번 재배 구역`,13)
      this.beds.push({plants,label})
    })
    this.decor('bush',140,400,1.2);this.decor('bush',1190,650,1.1)
    this.decor('crystals',1150,790,.7)
    this.player=this.decor('astronaut',660,770,.61)
  }
  private makeActors() {
    state.creatures.forEach((c,i)=>{
      if(this.stage==='explore'&&c.duty!=='explore')return
      if(this.stage==='farm'&&c.duty!=='farm')return
      const x=this.stage==='explore'?state.player.x-40-i*25:470+i*90
      const y=this.stage==='explore'?state.player.y+35+i*20:690+i%2*50
      const sprite=this.decor(c.species,x,y,.5).setInteractive({useHandCursor:true})
      sprite.on('pointerdown',(_p:unknown,_x:unknown,_y:unknown,e:Phaser.Types.Input.EventData)=>{e.stopPropagation();selectedCreature.value=c.id;if(this.stage!=='explore')go('creatures')})
      this.actors.push({id:c.id,sprite,phase:i*1.7})
    })
  }
  private layout() {
    if(!this.stage)return
    const cam=this.cameras.main,w=this.scale.width,h=this.scale.height
    if(this.stage==='explore'){
      cam.setZoom(Math.max(.55,Math.min(w/1000,h/690)));cam.setBounds(0,0,1900,1200);cam.startFollow(this.player,true,.08,.08)
    }else{cam.stopFollow();cam.setBounds(0,0,1320,890);cam.setZoom(Math.min(w/1320,h/890)*1.04);cam.centerOn(660,490)}
  }
  private sparkle(x:number,y:number,color=0xffe7a6,count=8) {
    for(let i=0;i<count;i++){
      const s=this.add.image(x,y-20,'spark').setTint(color).setScale(.2+Math.random()*.25).setDepth(4000)
      const a=i*Math.PI*2/count
      this.tweens.add({targets:s,x:x+Math.cos(a)*55,y:y-30+Math.sin(a)*45,alpha:0,scale:0,duration:600+Math.random()*400,onComplete:()=>s.destroy()})
    }
  }
  update(time:number,delta:number) {
    if(!this.stage)return
    if(view.value!==this.stage||state.expanded!==this.expanded){this.build();return}
    const expected=state.creatures.filter(c=>this.stage==='explore'?c.duty==='explore':this.stage==='farm'?c.duty==='farm':true)
    if(expected.length!==this.actors.length||expected.some(c=>!this.actors.some(a=>a.id===c.id))){this.actors.forEach(a=>a.sprite.destroy());this.actors=[];this.makeActors()}
    const dt=Math.min(delta,50)/1000
    let moving=false
    if(inputBlocked.value) this.goal=null
    if(this.stage==='explore' && !inputBlocked.value){
      const el=document.activeElement;const inField=el instanceof HTMLInputElement||el instanceof HTMLSelectElement||el instanceof HTMLTextAreaElement
      let dx=joystick.x,dy=joystick.y
      if(!inField){dx+=(Number(this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(this.keys.A.isDown||this.keys.LEFT.isDown));dy+=(Number(this.keys.S.isDown||this.keys.DOWN.isDown)-Number(this.keys.W.isDown||this.keys.UP.isDown))}
      if(dx||dy)this.goal=null
      else if(this.goal){const dist=Phaser.Math.Distance.Between(this.player.x,this.player.y,this.goal.x,this.goal.y);if(dist<10)this.goal=null;else{dx=(this.goal.x-this.player.x)/dist;dy=(this.goal.y-this.player.y)/dist}}
      const len=Math.hypot(dx,dy)
      if(len>.05){dx/=Math.max(1,len);dy/=Math.max(1,len);this.player.x=Phaser.Math.Clamp(this.player.x+dx*190*dt,80,1820);this.player.y=Phaser.Math.Clamp(this.player.y+dy*190*dt,80,1120);moving=true}
      this.player.setAngle(moving?Math.sin(time/110)*3:0).setDepth(this.player.y)
      state.player.x=this.player.x;state.player.y=this.player.y
      if(planting.value&&moving&&Phaser.Math.Distance.Between(this.lastPlant.x,this.lastPlant.y,this.player.x,this.player.y)>14){
        this.lastPlant={x:this.player.x,y:this.player.y}
        const result=plant(state,this.player.x,this.player.y,flowerColor.value)
        if(result.planted){
          const key=`${Math.floor(this.player.x/28)},${Math.floor(this.player.y/28)}`,f=state.flowers[key]
          const im=this.decor(`flower-${f.color}`,f.x,f.y,.05);this.flowerImages.set(key,im)
          this.tweens.add({targets:im,scale:.75,duration:350,ease:'Back.Out'});this.sparkle(f.x,f.y,0xfff2c3,3)
        }
        result.bloomed.forEach(i=>{
          const p=GIANTS[i];this.sparkle(p.x,p.y-110,0xf2c5e1,36)
          reward.value={title:`${p.name}이 피어났어요!`,text:'꽃 정수 +3 · 씨앗 +2 · 별빛 알 +1\n첫 개화에는 씨앗 1개를 더 드려요.'}
        })
        if(state.petals<=0){planting.value=false;notify('꽃잎을 모두 심었어요. 친구에게 정수를 먹여주세요.','info')}
      }
      this.giants.forEach((g,i)=>{
        const p=bloomProgress(state,i)
        if(g.progress!==p){g.progress=p;g.image.setTexture(`giant-${state.blooms[i]?4:Math.min(3,Math.floor(p/5))}`);g.text.setText(`${GIANTS[i].name}   ${state.blooms[i]?'✧ 개화 완료':`${p} / 20`}`)}
        g.image.setAngle(Math.sin(time/1800+i)*1.5)
      })
    }
    this.actors.forEach((a,i)=>{
      let tx:number,ty:number
      if(this.stage==='explore'){
        const leader=i===0?this.player:this.actors[i-1].sprite
        tx=leader.x+Math.sin(a.phase)*25;ty=leader.y+30+Math.cos(a.phase)*13
      }else if(this.stage==='farm'){
        const bedIndex=i%state.beds.length, bed=state.beds[bedIndex]
        const x=bedIndex%2===0?440:850,y=bedIndex<2?490:710
        tx=x+Math.sin(time/3000+a.phase)*120;ty=y+20+Math.cos(time/4000+a.phase)*25
        if(bed?.active&&bed.progress>.12&&bed.progress<.4&&time%700<delta){
          const water=this.add.image(a.sprite.x+12,a.sprite.y-25,'water').setScale(.5).setDepth(a.sprite.y+30)
          this.tweens.add({targets:water,x:a.sprite.x+38,y:a.sprite.y-8,alpha:0,duration:550,onComplete:()=>water.destroy()})
        }
      }else{tx=650+Math.sin(time/7000+a.phase)*330;ty=690+Math.cos(time/8000+a.phase)*95}
      const d=Phaser.Math.Distance.Between(a.sprite.x,a.sprite.y,tx,ty),v=Math.min(1,dt*(this.stage==='explore'?3.5:.8))
      a.sprite.x+=(tx-a.sprite.x)*v;a.sprite.y+=(ty-a.sprite.y)*v
      a.sprite.setDepth(a.sprite.y+2).setAngle(d>6?Math.sin(time/130+a.phase)*5:Math.sin(time/900+a.phase)*2)
      a.sprite.setScale(.5,.5+(d>6?Math.sin(time/120+a.phase)*.015:Math.sin(time/650+a.phase)*.01))
      if(happyId.value===a.id){this.sparkle(a.sprite.x,a.sprite.y-30,0xffd6bd,12);happyId.value=null;this.tweens.add({targets:a.sprite,y:'-=25',duration:180,yoyo:true,repeat:2})}
    })
    if(this.stage==='farm')this.beds.forEach((b,i)=>{
      const s=state.beds[i],stage=s.active?Math.min(3,Math.floor(s.progress*4)):0
      b.plants.forEach((p,j)=>{p.setTexture(`crop-${s.crop}-${stage}`).setVisible(s.active);p.setAngle(Math.sin(time/1300+j)*3)})
      const text=!expected.length?'친구 배치 대기':!s.active?'씨앗 대기':s.progress<.12?'씨앗 심는 중':s.progress<.4?'물 주는 중':s.progress<.9?'쑥쑥 자라는 중':'수확하는 중'
      b.label.setText(`${i+1}번 구역   ${text}${s.active?` · ${Math.floor(s.progress*100)}%`:''}`)
    })
  }
}
