/* ============================================================
   DIRECTION 2 — CONSOLE ANALÓGICO  (the surprise)
   The whole app is a physical mixing / lighting console.
   Brushed metal, screws, faders, VU ladders, 7-seg LED.
   Financial pipeline = three channel faders.
   ============================================================ */

const METAL = 'linear-gradient(160deg,#27292d,#191a1d 70%)';
const BRUSH = 'repeating-linear-gradient(91deg, rgba(255,255,255,.016) 0 1px, transparent 1px 3px)';

function Screw({ x, y }){
  return (<div style={{ position:'absolute', top:y, left:x, width:11, height:11, borderRadius:'50%',
    background:'radial-gradient(circle at 35% 30%, #44474c, #141517)',
    boxShadow:'inset 0 1px 1px rgba(255,255,255,.25), 0 1px 1px rgba(0,0,0,.6)' }}>
    <div style={{ position:'absolute', top:'50%', left:2, right:2, height:1.4, background:'#0c0d0f', transform:'translateY(-50%) rotate(34deg)' }}></div>
  </div>);
}

function Panel({ children, style, label, screws=true }){
  return (
    <div style={{ position:'relative', borderRadius:12, padding:14, background:METAL,
      border:'1px solid #0b0c0e', boxShadow:'inset 0 1px 0 rgba(255,255,255,.07), inset 0 -3px 8px rgba(0,0,0,.55), 0 8px 16px -6px rgba(0,0,0,.6)', ...style }}>
      <div style={{ position:'absolute', inset:0, borderRadius:12, background:BRUSH, pointerEvents:'none' }}></div>
      {screws && <><Screw x={7} y={7}/><Screw x={'calc(100% - 18px)'} y={7}/><Screw x={7} y={'calc(100% - 18px)'}/><Screw x={'calc(100% - 18px)'} y={'calc(100% - 18px)'}/></>}
      {label && <div style={{ position:'relative', fontFamily:'Chakra Petch, sans-serif', fontSize:10, fontWeight:600, color:'#7d828b',
        letterSpacing:'0.18em', textTransform:'uppercase', textShadow:'0 1px 0 rgba(0,0,0,.6)', marginBottom:11 }}>{label}</div>}
      <div style={{ position:'relative' }}>{children}</div>
    </div>
  );
}

function Engrave({ children, style }){
  return <span style={{ fontFamily:'Chakra Petch, sans-serif', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase',
    color:'#888d96', textShadow:'0 1px 0 rgba(0,0,0,.55), 0 -1px 0 rgba(255,255,255,.03)', ...style }}>{children}</span>;
}

/* 7-segment style readout */
function Seg({ d, color, size=34 }){
  return (
    <span style={{ position:'relative', display:'inline-block', width:size*0.62, fontFamily:'JetBrains Mono, monospace',
      fontWeight:700, fontSize:size, lineHeight:1, transform:'skewX(-6deg)' }}>
      <span style={{ position:'absolute', inset:0, color:'#ffffff', opacity:0.05 }}>8</span>
      <span style={{ position:'relative', color, textShadow:`0 0 12px ${color}, 0 0 3px ${color}` }}>{d}</span>
    </span>
  );
}
function LedDisplay({ text, color, size, label }){
  return (
    <div style={{ position:'relative', borderRadius:8, padding:'10px 12px', background:'linear-gradient(180deg,#070808,#0d0f10)',
      border:'1px solid #000', boxShadow:'inset 0 2px 8px rgba(0,0,0,.8), inset 0 0 0 1px rgba(255,255,255,.03)' }}>
      <div style={{ position:'absolute', inset:0, borderRadius:8, pointerEvents:'none', opacity:.5,
        background:'repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 2px)' }}></div>
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', gap:1 }}>
        {String(text).split('').map((ch,i)=> ch===':' ?
          <span key={i} style={{ color, fontSize:size*0.7, margin:'0 1px', textShadow:`0 0 8px ${color}`, opacity:.9 }}>:</span>
          : <Seg key={i} d={ch} color={color} size={size}/>) }
      </div>
      {label && <div style={{ position:'relative', textAlign:'center', marginTop:6, fontFamily:'Chakra Petch, sans-serif', fontSize:8.5, letterSpacing:'0.2em', color:'#5a5f68' }}>{label}</div>}
    </div>
  );
}

/* vertical VU ladder; level 0..1 */
function VU({ level, n=11, height=120, tint }){
  const lit = Math.round(level*n);
  return (
    <div style={{ display:'flex', flexDirection:'column-reverse', gap:3, height }}>
      {Array.from({length:n}).map((_,i)=>{
        const on = i<lit;
        const col = tint || (i> n*0.8 ? '#ef4444' : i> n*0.55 ? '#f59e0b' : '#10b981');
        return <div key={i} style={{ flex:1, borderRadius:2, background: on?col:'#0d0e10',
          boxShadow: on?`0 0 7px ${col}, inset 0 0 2px rgba(255,255,255,.4)`:'inset 0 1px 2px rgba(0,0,0,.7)',
          border:`1px solid ${on?'transparent':'#000'}`, transition:'all .25s' }}></div>;
      })}
    </div>
  );
}

/* fader: value 0..1 */
function Fader({ value, color, height=128 }){
  return (
    <div style={{ position:'relative', width:30, height, margin:'0 auto' }}>
      <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:6, transform:'translateX(-50%)', borderRadius:4,
        background:'linear-gradient(90deg,#0a0b0c,#1c1e21)', boxShadow:'inset 0 0 3px rgba(0,0,0,.9)' }}></div>
      {/* lit portion */}
      <div style={{ position:'absolute', left:'50%', width:6, transform:'translateX(-50%)', bottom:0, borderRadius:4,
        height:`${value*100}%`, background:`linear-gradient(0deg,${color},${color}55)`, boxShadow:`0 0 8px ${color}` }}></div>
      {/* knurled cap */}
      <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', bottom:`calc(${value*100}% - 11px)`, width:28, height:22, borderRadius:5,
        background:'linear-gradient(180deg,#3a3d42,#1a1b1e)', border:'1px solid #0a0b0c',
        boxShadow:'0 2px 5px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.18)' }}>
        <div style={{ position:'absolute', inset:'4px 5px', background:'repeating-linear-gradient(0deg,#0c0d0f 0 1px, transparent 1px 3px)' }}></div>
        <div style={{ position:'absolute', top:'50%', left:2, right:2, height:2, transform:'translateY(-50%)', background:color, boxShadow:`0 0 6px ${color}` }}></div>
      </div>
    </div>
  );
}

function PowerLed({ on, color }){
  return <span style={{ width:9, height:9, borderRadius:'50%', display:'inline-block',
    background: on?color:'#1a1b1e', boxShadow: on?`0 0 9px ${color}, inset 0 0 2px #fff8`:'inset 0 1px 2px #000' }}></span>;
}

const consoleBg = { position:'absolute', inset:0,
  background:`radial-gradient(120% 60% at 50% 0%, #232529, #141517 70%), ${'#141517'}` };

/* ---------- SPLASH ---------- */
function ConsoleSplash({ c }){
  const boot = useLevels(11, 130, true);
  return (
    <div style={{ position:'absolute', inset:0 }}>
      <div style={consoleBg}></div>
      <div style={{ position:'absolute', inset:0, background:BRUSH }}></div>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:26 }}>
        <Panel style={{ width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <Engrave style={{ fontFamily:'Oswald, sans-serif', fontSize:26, color:'#cfd3da', letterSpacing:'0.06em' }}>BACKSTAGE&nbsp;PRO</Engrave>
            <PowerLed on color={c.primary}/>
          </div>
          <LedDisplay text="—READY—" color={c.primary} size={26}/>
          <div style={{ display:'flex', gap:5, justifyContent:'center', marginTop:18, alignItems:'flex-end', height:46 }}>
            {boot.map((v,i)=>(<div key={i} style={{ width:8, height:`${20+v*80}%`, borderRadius:2,
              background:i>8?'#ef4444':i>6?'#f59e0b':'#10b981', boxShadow:'0 0 6px currentColor' }}></div>))}
          </div>
          <div style={{ textAlign:'center', marginTop:18 }}>
            <Engrave style={{ fontSize:9.5, color:'#6a6f78' }}>INICIALIZANDO CONSOLE · v2.0</Engrave>
          </div>
        </Panel>
        <div style={{ marginTop:18 }}><Engrave style={{ fontFamily:'Chakra Petch,sans-serif', fontSize:11, color:'#7d828b', letterSpacing:'0.3em' }}>S E U   B A S T I D O R</Engrave></div>
      </div>
    </div>
  );
}

/* ---------- LOGIN ---------- */
function ConsoleLogin({ c }){
  return (
    <div style={{ position:'absolute', inset:0 }}>
      <div style={consoleBg}></div>
      <div style={{ position:'absolute', inset:0, background:BRUSH }}></div>
      <image-slot id="console-login-photo" shape="rect" fit="cover" placeholder="📷 foto da mesa/palco"
        style={{ position:'absolute', top:54, left:18, right:18, height:120, borderRadius:10, opacity:0.5, border:'1px solid #0b0c0e' }}></image-slot>
      <div style={{ position:'absolute', top:54, left:18, right:18, height:120, borderRadius:10, pointerEvents:'none',
        background:'linear-gradient(180deg, rgba(20,21,23,.1), rgba(20,21,23,.85))', boxShadow:'inset 0 0 30px rgba(0,0,0,.6)' }}></div>

      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 18px 30px' }}>
        <div style={{ marginBottom:16 }}>
          <Engrave style={{ fontFamily:'Oswald,sans-serif', fontSize:30, color:'#dfe2e7', letterSpacing:'0.04em' }}>AUTORIZAÇÃO</Engrave>
          <div style={{ marginTop:4 }}><Engrave style={{ fontSize:10, color:'#6a6f78', letterSpacing:'0.16em' }}>CONECTE-SE AO CONSOLE</Engrave></div>
        </div>
        <Panel>
          <ConsoleJack label="OPERADOR / E-MAIL" value="marcos@backstage.pro" c={c}/>
          <div style={{ height:13 }}></div>
          <ConsoleJack label="CHAVE / SENHA" value="••••••••••" c={c}/>
          {/* big illuminated power switch = login */}
          <div style={{ display:'flex', alignItems:'center', gap:13, marginTop:18 }}>
            <div style={{ position:'relative', width:62, height:62, borderRadius:'50%', flexShrink:0, display:'grid', placeItems:'center',
              background:'radial-gradient(circle at 38% 32%, #303338, #131416)', border:'2px solid #0a0b0c',
              boxShadow:`0 0 0 4px #1a1b1e, 0 0 26px ${c.primary}66, inset 0 2px 4px rgba(255,255,255,.12)` }}>
              <div style={{ width:26, height:26, borderRadius:'50%', border:`3px solid ${c.primary}`, position:'relative', boxShadow:`0 0 12px ${c.primary}` }}>
                <div style={{ position:'absolute', top:-7, left:'50%', width:3, height:13, transform:'translateX(-50%)', background:c.primary, boxShadow:`0 0 8px ${c.primary}` }}></div>
              </div>
            </div>
            <button style={{ flex:1, padding:'17px', borderRadius:10, border:'1px solid #0a0b0c', cursor:'pointer',
              fontFamily:'Oswald, sans-serif', fontWeight:600, fontSize:17, letterSpacing:'0.1em', color:'#06070a', textTransform:'uppercase',
              background:`linear-gradient(180deg, ${c.primary}, ${c.primary}bb)`, boxShadow:`0 0 22px ${c.primary}55, inset 0 1px 0 rgba(255,255,255,.4)` }}>
              Ligar Sistema
            </button>
          </div>
        </Panel>
        <div style={{ display:'flex', gap:10, marginTop:13 }}>
          {['GOOGLE','APPLE'].map(p=>(
            <button key={p} style={{ flex:1, padding:'13px', borderRadius:9, cursor:'pointer', background:METAL, border:'1px solid #0b0c0e',
              boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)', fontFamily:'Chakra Petch,sans-serif', fontWeight:600, fontSize:11.5, letterSpacing:'0.1em', color:'#9aa0a9' }}>{p}</button>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:16 }}>
          <Engrave style={{ fontSize:10.5, color:'#6a6f78' }}>SEM CREDENCIAL? </Engrave>
          <span style={{ fontFamily:'Chakra Petch,sans-serif', fontWeight:600, fontSize:11, letterSpacing:'0.1em', color:c.primary }}>REGISTRAR</span>
        </div>
      </div>
    </div>
  );
}
function ConsoleJack({ label, value, c }){
  return (
    <div>
      <div style={{ marginBottom:6 }}><Engrave style={{ fontSize:9, color:'#6a6f78' }}>{label}</Engrave></div>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 12px', borderRadius:8,
        background:'linear-gradient(180deg,#0c0d0f,#131416)', border:'1px solid #000', boxShadow:'inset 0 2px 5px rgba(0,0,0,.7)' }}>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'radial-gradient(circle at 35% 30%,#2a2c30,#0a0b0c)', boxShadow:`0 0 6px ${c.primary}55, inset 0 0 2px #000`, flexShrink:0 }}></span>
        <span style={{ flex:1, fontFamily:'JetBrains Mono, monospace', fontSize:13.5, color:'#d4d8de' }}>{value}</span>
      </div>
    </div>
  );
}

/* ---------- HOME ---------- */
function ConsoleHome({ c, stage }){
  const cd = useCountdown(stage);
  const ev = EVENT_BY_CAT[c.id] || EVENT_BY_CAT.dj;
  const pipe = DATA.pipeline; const tot = pipe.recebido+pipe.pendente+pipe.atrasado;
  const masterLv = useLevels(11, 150, stage);
  const cdText = `${cd.p(stage?cd.hours:cd.days)}:${cd.p(stage?cd.mins:cd.hours)}:${cd.p(stage?cd.secs:cd.mins)}`;
  return (
    <div style={{ position:'absolute', inset:0 }}>
      <div style={consoleBg}></div>
      <div style={{ position:'absolute', inset:0, background:BRUSH }}></div>
      <div style={{ position:'relative', padding:'56px 16px 96px', display:'flex', flexDirection:'column', gap:13 }}>

        {/* nameplate / master strip */}
        <Panel screws={true} style={{ padding:'13px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <Engrave style={{ fontFamily:'Oswald,sans-serif', fontSize:19, color:'#d8dbe1', letterSpacing:'0.05em' }}>{DATA.user.greetingNight.toUpperCase()}, {DATA.user.name.toUpperCase()}</Engrave>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:5 }}>
                <PowerLed on color={c.primary}/>
                <Engrave style={{ fontSize:9.5, color:c.primary }}>CANAL · {c.label}</Engrave>
              </div>
            </div>
            {/* ON AIR tally */}
            <div style={{ textAlign:'center', padding:'7px 11px', borderRadius:7, border:`1px solid ${stage?c.primary:'#2a2c30'}`,
              background: stage?`${c.primary}1c`:'#141517', boxShadow: stage?`0 0 16px ${c.primary}55`:'inset 0 1px 3px rgba(0,0,0,.6)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:stage?'#ff3b3b':'#3a2020', boxShadow:stage?'0 0 9px #ff3b3b':'none', animation:stage?'bpPulse 1s infinite':'none' }}></span>
                <Engrave style={{ fontFamily:'Oswald,sans-serif', fontSize:13, letterSpacing:'0.14em', color:stage?'#fff':'#5a5f68' }}>ON AIR</Engrave>
              </div>
              <Engrave style={{ fontSize:7.5, color: stage?c.primary:'#4a4f58', letterSpacing:'0.18em' }}>{stage?'PALCO':'STANDBY'}</Engrave>
            </div>
          </div>
        </Panel>

        {/* NEXT SHOW — big LED readout */}
        <Panel label="NEXT SHOW · T-MINUS">
          <div style={{ marginBottom:11 }}>
            <Engrave style={{ fontFamily:'Oswald,sans-serif', fontSize:21, color:'#e4e7ec', letterSpacing:'0.03em' }}>{ev.title.toUpperCase()}</Engrave>
            <div style={{ marginTop:3 }}><Engrave style={{ fontSize:9, color:'#6a6f78' }}>{ev.sub} · {DATA.venue}</Engrave></div>
          </div>
          <LedDisplay text={cdText} color={c.primary} size={40} label={stage?'HORAS : MIN : SEG':'DIAS : HORAS : MIN'}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
            <LedDisplay text={brl(DATA.valorShow)} color={'#10b981'} size={17}/>
            <button style={{ padding:'11px 15px', borderRadius:8, border:'1px solid #0a0b0c', cursor:'pointer', background:METAL,
              fontFamily:'Chakra Petch,sans-serif', fontWeight:600, fontSize:11, letterSpacing:'0.1em', color:'#c4c8ce',
              boxShadow:'inset 0 1px 0 rgba(255,255,255,.07)' }}>CUE ▸</button>
          </div>
        </Panel>

        {/* PIPELINE as channel faders + VU — the surprise */}
        <Panel label="PIPELINE · MIXER FINANCEIRO">
          <div style={{ display:'flex', justifyContent:'space-around', gap:8 }}>
            {[['REC',pipe.recebido,'#10b981'],['PEND',pipe.pendente,'#f59e0b'],['LATE',pipe.atrasado,'#ef4444']].map(([l,v,col],i)=>{
              const lvl = v/tot;
              return (
                <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
                  <LedDisplay text={brlK(v)} color={col} size={13}/>
                  <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
                    <VU level={Math.min(1,lvl*1.6)} height={118} tint={col}/>
                    <Fader value={Math.min(1,lvl*1.6)} color={col} height={118}/>
                  </div>
                  <Engrave style={{ fontSize:10, color:col, letterSpacing:'0.12em' }}>{l}</Engrave>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop:'1px solid #0b0c0e', marginTop:12, paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <Engrave style={{ fontSize:9, color:'#6a6f78' }}>MASTER · TOTAL</Engrave>
            <Engrave style={{ fontFamily:'Oswald,sans-serif', fontSize:16, color:'#e4e7ec' }}>{brl(tot)}</Engrave>
          </div>
        </Panel>

        {/* stats — backlit gauges */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:11 }}>
          {[['A RECEBER',brlK(DATA.stats.aReceber),c.primary],['EVENTOS',DATA.stats.eventos,'#10b981'],['CLIENTES',DATA.stats.clientes,c.accent]].map(([l,v,col],i)=>(
            <Panel key={i} screws={false} style={{ padding:'12px 8px', textAlign:'center' }}>
              <LedDisplay text={String(v)} color={col} size={16}/>
              <div style={{ marginTop:8 }}><Engrave style={{ fontSize:8, color:'#6a6f78' }}>{l}</Engrave></div>
            </Panel>
          ))}
        </div>

        {/* alerts — warning lamps */}
        <Panel label="ALERTAS DO BASTIDÃO">
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {DATA.alerts.map(a=>{
              const col = a.level==='late'?'#ef4444':'#f59e0b';
              return (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 10px', borderRadius:7,
                  background:'linear-gradient(180deg,#0c0d0f,#131416)', border:'1px solid #000', boxShadow:'inset 0 1px 4px rgba(0,0,0,.6)' }}>
                  <span style={{ width:11, height:11, borderRadius:'50%', background:col, boxShadow:`0 0 9px ${col}`, animation:'bpPulse 1.4s infinite', flexShrink:0 }}></span>
                  <div style={{ flex:1 }}>
                    <Engrave style={{ fontSize:11, color:'#d4d8de', letterSpacing:'0.06em' }}>{a.title}</Engrave>
                    <div><Engrave style={{ fontSize:8.5, color:col }}>{a.info.toUpperCase()}</Engrave></div>
                  </div>
                  <Engrave style={{ fontFamily:'Oswald,sans-serif', fontSize:14, color:col }}>{brl(a.value)}</Engrave>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* upcoming — cue list */}
        <Panel label="CUE LIST · PRÓXIMOS">
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {DATA.upcoming.map((e,i)=>(
              <div key={e.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 4px', borderBottom: i<2?'1px solid #0d0e10':'none' }}>
                <Engrave style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:c.primary, width:26 }}>{String(i+1).padStart(2,'0')}</Engrave>
                <div style={{ textAlign:'center', minWidth:30 }}>
                  <Engrave style={{ fontFamily:'Oswald,sans-serif', fontSize:15, color:'#d8dbe1' }}>{e.day}</Engrave>
                  <div><Engrave style={{ fontSize:7, color:'#5a5f68' }}>{e.mon}</Engrave></div>
                </div>
                <div style={{ flex:1 }}><Engrave style={{ fontSize:11, color:'#c4c8ce', letterSpacing:'0.04em' }}>{e.title}</Engrave>
                  <div><Engrave style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#6a6f78', letterSpacing:0 }}>{e.time} · {brl(e.value)}</Engrave></div></div>
                <PowerLed on={e.status==='confirmado'} color={e.status==='confirmado'?'#10b981':'#f59e0b'}/>
              </div>
            ))}
          </div>
        </Panel>

        <ConsoleNav c={c}/>
      </div>
    </div>
  );
}
function ConsoleNav({ c }){
  const items=[['HOME',true],['AGENDA',false],['REC',null],['MIXER',false],['PERFIL',false]];
  return (
    <div style={{ position:'sticky', bottom:0, marginTop:6, padding:'8px 12px 18px', background:'linear-gradient(0deg,#141517 65%,transparent)' }}>
      <Panel screws={false} style={{ padding:'9px 12px' }}>
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ position:'absolute', top:-9, left:'8%', width:'16%', height:2, borderRadius:2, background:c.primary, boxShadow:`0 0 10px ${c.primary}` }}></div>
          {items.map(([l,act],i)=> act===null ? (
            <div key={i} style={{ width:46, height:46, borderRadius:'50%', marginTop:-18, display:'grid', placeItems:'center',
              background:'radial-gradient(circle at 38% 32%,#34373c,#141517)', border:`2px solid ${c.primary}`,
              boxShadow:`0 0 18px ${c.primary}66, inset 0 1px 2px rgba(255,255,255,.15)` }}>
              <span style={{ width:13, height:13, borderRadius:'50%', background:'#ff3b3b', boxShadow:'0 0 8px #ff3b3b' }}></span>
            </div>
          ) : (
            <div key={i} style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <PowerLed on={act} color={act?c.primary:'#2a2c30'}/>
              <Engrave style={{ fontSize:8, color:act?c.primary:'#5a5f68' }}>{l}</Engrave>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

Object.assign(window, { ConsoleSplash, ConsoleLogin, ConsoleHome });
