/* ============================================================
   DIRECTION 1 — NEON BASTIDOR
   Refined stage: perspective floor, smoke, DMX cables,
   mixing-console glass. Category color infects everything.
   ============================================================ */

function NeonAtmos({ c, stage }){
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      {/* base */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 80% at 50% -10%, #11131c 0%, #07080d 55%, #050609 100%)' }}></div>
      {/* spotlight wash in category color */}
      <div style={{ position:'absolute', top:'-12%', left:'50%', transform:'translateX(-50%)', width:520, height:520,
        background:`radial-gradient(circle, ${c.primary}${stage?'2e':'1c'} 0%, transparent 62%)`, filter:'blur(8px)',
        transition:'all .6s' }}></div>
      {/* smoke */}
      <div className="bp-smoke" style={{ position:'absolute', bottom:-60, left:-40, width:280, height:280,
        background:`radial-gradient(circle, ${c.accent}14, transparent 65%)`, filter:'blur(26px)' }}></div>
      <div className="bp-smoke2" style={{ position:'absolute', top:160, right:-60, width:240, height:240,
        background:`radial-gradient(circle, ${c.primary}12, transparent 65%)`, filter:'blur(30px)' }}></div>
      {/* perspective stage floor */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:300, opacity:stage?0.6:0.4, transition:'opacity .6s',
        background:`repeating-linear-gradient(90deg, ${c.primary}22 0 1px, transparent 1px 46px), repeating-linear-gradient(0deg, ${c.primary}1c 0 1px, transparent 1px 46px)`,
        transform:'perspective(420px) rotateX(62deg)', transformOrigin:'bottom', maskImage:'linear-gradient(0deg, #000 10%, transparent 75%)', WebkitMaskImage:'linear-gradient(0deg, #000 10%, transparent 75%)' }}></div>
      {/* DMX cable lines */}
      <div style={{ position:'absolute', top:0, left:'18%', width:1, height:'100%', background:`linear-gradient(180deg, transparent, ${c.accent}30, transparent)` }}></div>
      <div style={{ position:'absolute', top:0, right:'24%', width:1, height:'100%', background:`linear-gradient(180deg, transparent, ${c.primary}26, transparent)` }}></div>
      {/* scanline texture */}
      <div style={{ position:'absolute', inset:0, opacity:0.5, background:'repeating-linear-gradient(0deg, rgba(255,255,255,.015) 0 1px, transparent 1px 3px)' }}></div>
    </div>
  );
}

function NeonGlass({ c, children, style, glow }){
  return (
    <div style={{ position:'relative', borderRadius:18, padding:16, overflow:'hidden',
      background:'linear-gradient(160deg, rgba(22,25,35,.72), rgba(12,14,20,.66))',
      border:`1px solid ${c.primary}26`,
      boxShadow:`inset 0 1px 0 rgba(255,255,255,.05), 0 14px 30px -18px #000${glow?`, 0 0 26px ${c.primary}22`:''}`,
      backdropFilter:'blur(14px)', ...style }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:.5,
        background:'repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 1px, transparent 1px 3px)' }}></div>
      <div style={{ position:'relative' }}>{children}</div>
    </div>
  );
}

function NeonWave({ c, active }){
  const lv = useLevels(22, 120, active);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:30 }}>
      {lv.map((v,i)=>(
        <div key={i} style={{ flex:1, height:`${18+v*82}%`, borderRadius:2,
          background:`linear-gradient(180deg, ${c.primary}, ${c.accent})`, opacity:.4+v*.6,
          boxShadow:`0 0 6px ${c.primary}55` }}></div>
      ))}
    </div>
  );
}

/* ---------- SPLASH ---------- */
function NeonSplash({ c }){
  const lv = useLevels(16, 110, true);
  return (
    <div style={{ position:'absolute', inset:0, background:'#050609', display:'grid', placeItems:'center' }}>
      <NeonAtmos c={c} stage={true}/>
      <div style={{ position:'relative', textAlign:'center', padding:24 }}>
        <div style={{ position:'relative', width:104, height:104, margin:'0 auto 26px', borderRadius:28, display:'grid', placeItems:'center',
          background:`conic-gradient(from 210deg, ${c.primary}, ${c.accent}, ${c.primary})`,
          boxShadow:`0 0 50px ${c.primary}66, inset 0 2px 6px rgba(255,255,255,.3)`, animation:'bpBreath 2.4s ease-in-out infinite' }}>
          <span style={{ fontFamily:'Anton, sans-serif', fontSize:54, color:'#06070a', lineHeight:1 }}>B</span>
        </div>
        <div style={{ fontFamily:'Anton, sans-serif', fontSize:42, letterSpacing:'0.01em', color:'#fff', lineHeight:.92 }}>BACKSTAGE</div>
        <div style={{ fontFamily:'Anton, sans-serif', fontSize:42, letterSpacing:'0.34em', marginLeft:'0.34em',
          background:`linear-gradient(90deg, ${c.primary}, ${c.accent})`, WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent' }}>PRO</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11.5, color:'#7c8494', letterSpacing:'0.32em', marginTop:14 }}>SEU BACKSTAGE DIGITAL</div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:3, height:34, marginTop:30 }}>
          {lv.map((v,i)=>(<div key={i} style={{ width:4, height:`${20+v*80}%`, borderRadius:2, background:`linear-gradient(180deg,${c.primary},${c.accent})`, boxShadow:`0 0 8px ${c.primary}` }}></div>))}
        </div>
        <div style={{ width:180, height:3, borderRadius:3, background:'#1a1d27', margin:'24px auto 0', overflow:'hidden' }}>
          <div style={{ height:'100%', width:'46%', borderRadius:3, background:`linear-gradient(90deg,${c.primary},${c.accent})`, boxShadow:`0 0 12px ${c.primary}`, animation:'bpLoad 2.2s ease-in-out infinite' }}></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- LOGIN ---------- */
function NeonLogin({ c }){
  return (
    <div style={{ position:'absolute', inset:0, background:'#050609' }}>
      <NeonAtmos c={c} stage={false}/>
      {/* photo slot behind glass */}
      <image-slot id="neon-login-photo" shape="rect" fit="cover" placeholder="📷 arraste uma foto de palco"
        style={{ position:'absolute', top:0, left:0, right:0, height:'46%', opacity:0.32 }}></image-slot>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(5,6,9,.4) 0%, rgba(5,6,9,.86) 52%, #050609 78%)' }}></div>
      {/* spotlight cone */}
      <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', width:0, height:0,
        borderLeft:'120px solid transparent', borderRight:'120px solid transparent', borderTop:`360px solid ${c.primary}10`, filter:'blur(8px)' }}></div>

      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 22px 40px' }}>
        <div style={{ width:62, height:62, borderRadius:18, display:'grid', placeItems:'center', marginBottom:18,
          background:`conic-gradient(from 210deg, ${c.primary}, ${c.accent})`, boxShadow:`0 0 34px ${c.primary}66` }}>
          <span style={{ fontFamily:'Anton, sans-serif', fontSize:32, color:'#06070a' }}>B</span>
        </div>
        <div style={{ fontFamily:'Archivo, sans-serif', fontWeight:800, fontSize:30, color:'#fff', letterSpacing:'-0.02em', lineHeight:1 }}>Bem-vindo<br/>de volta.</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, color:'#8a91a1', marginTop:10, letterSpacing:'0.02em' }}>O palco está esperando por você.</div>

        <NeonGlass c={c} glow style={{ marginTop:22, padding:18 }}>
          <NeonField c={c} label="E-MAIL" value="marcos@backstage.pro"/>
          <div style={{ height:12 }}></div>
          <NeonField c={c} label="SENHA" value="••••••••••" eye/>
          <button style={{ marginTop:18, width:'100%', padding:'15px', borderRadius:13, border:'none', cursor:'pointer',
            fontFamily:'Archivo, sans-serif', fontWeight:800, fontSize:15, letterSpacing:'0.04em', color:'#06070a',
            background:`linear-gradient(135deg, ${c.primary}, ${c.accent})`, boxShadow:`0 0 26px ${c.primary}55`, textTransform:'uppercase' }}>
            Entrar no Backstage
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px 0 14px' }}>
            <div style={{ flex:1, height:1, background:'#23262f' }}></div>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#5f6678', letterSpacing:'0.1em' }}>OU ENTRE COM</span>
            <div style={{ flex:1, height:1, background:'#23262f' }}></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {['Google','Apple'].map(p=>(
              <button key={p} style={{ padding:'12px', borderRadius:11, cursor:'pointer',
                fontFamily:'JetBrains Mono, monospace', fontWeight:600, fontSize:12.5, color:'#cfd4de',
                background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', backdropFilter:'blur(6px)' }}>{p}</button>
            ))}
          </div>
        </NeonGlass>
        <div style={{ textAlign:'center', marginTop:18, fontFamily:'JetBrains Mono, monospace', fontSize:12, color:'#8a91a1' }}>
          Novo por aqui? <span style={{ color:c.primary, fontWeight:600 }}>Criar conta</span>
        </div>
      </div>
    </div>
  );
}
function NeonField({ c, label, value, eye }){
  return (
    <div>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#6b7283', letterSpacing:'0.1em', marginBottom:7 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 14px', borderRadius:12,
        background:'rgba(8,10,16,.6)', border:`1px solid ${c.primary}33`, boxShadow:`0 0 0 3px ${c.primary}0d` }}>
        <span style={{ flex:1, fontFamily:'JetBrains Mono, monospace', fontSize:14, color:'#e8ebf0' }}>{value}</span>
        {eye && <span style={{ color:'#6b7283', fontSize:15 }}>👁</span>}
      </div>
    </div>
  );
}

/* ---------- HOME ---------- */
function NeonHome({ c, stage }){
  const cd = useCountdown(stage);
  const ev = EVENT_BY_CAT[c.id] || EVENT_BY_CAT.dj;
  const pipe = DATA.pipeline; const tot = pipe.recebido+pipe.pendente+pipe.atrasado;
  return (
    <div style={{ position:'absolute', inset:0, background:'#050609' }}>
      <NeonAtmos c={c} stage={stage}/>
      <div style={{ position:'relative', paddingBottom:96 }}>
        {/* header — infects with category color */}
        <div style={{ position:'relative', padding:'58px 20px 20px', overflow:'hidden',
          background: stage
            ? `linear-gradient(165deg, ${c.primary}33, ${c.accent}14 45%, transparent 80%)`
            : `linear-gradient(180deg, ${c.primary}12, transparent 70%)`, transition:'background .6s' }}>
          <div style={{ position:'absolute', top:50, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${c.primary}, transparent)`,
            opacity:stage?1:.5, animation:stage?'bpPulse 1.6s infinite':'none' }}></div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              {stage && <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, marginBottom:8,
                background:`${c.primary}22`, border:`1px solid ${c.primary}`, animation:'bpPulse 1.2s infinite' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:c.primary, boxShadow:`0 0 8px ${c.primary}` }}></span>
                <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, fontWeight:700, color:c.primary, letterSpacing:'0.12em' }}>MODO PALCO ATIVO</span>
              </div>}
              <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'#7c8494', letterSpacing:'0.04em' }}>SÁB, 8 DE JUNHO</div>
              <div style={{ fontFamily:'Archivo, sans-serif', fontWeight:800, fontSize:26, color:'#fff', letterSpacing:'-0.02em', marginTop:3 }}>{DATA.user.greetingNight}, {DATA.user.name}</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:8, padding:'4px 10px', borderRadius:8,
                background:`${c.primary}16`, border:`1px solid ${c.primary}30` }}>
                <span>{c.emoji}</span>
                <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, fontWeight:600, color:c.primary, letterSpacing:'0.04em' }}>{c.label}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {['🔔','⚙️'].map((x,i)=>(<div key={i} style={{ width:38, height:38, borderRadius:11, display:'grid', placeItems:'center',
                background:'rgba(22,25,35,.7)', border:'1px solid #23262f', fontSize:15 }}>{x}</div>))}
            </div>
          </div>
        </div>

        <div style={{ padding:'4px 18px 0', display:'flex', flexDirection:'column', gap:14 }}>
          {/* PRÓXIMO SHOW */}
          <NeonGlass c={c} glow style={{ padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10.5, color:c.primary, letterSpacing:'0.16em', fontWeight:700 }}>● PRÓXIMO SHOW</span>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10.5, color:'#7c8494', letterSpacing:'0.04em' }}>{stage?'HOJE':'EM 2 DIAS'}</span>
            </div>
            <div style={{ fontFamily:'Archivo, sans-serif', fontWeight:800, fontSize:23, color:'#fff', letterSpacing:'-0.02em' }}>{ev.title}</div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11.5, color:'#9aa1b1', marginTop:4 }}>{ev.sub}</div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11.5, color:'#7c8494', marginTop:3 }}>📍 {DATA.venue}</div>
            {/* countdown */}
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              {[['DIAS',cd.p(cd.days)],['HORAS',cd.p(cd.hours)],['MIN',cd.p(cd.mins)],['SEG',cd.p(cd.secs)]].map(([l,v],i)=>(
                <div key={i} style={{ flex:1, textAlign:'center', padding:'12px 4px', borderRadius:12,
                  background:'rgba(8,10,16,.66)', border:`1px solid ${c.primary}22` }}>
                  <div style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:700, fontSize:26, color:'#fff', lineHeight:1,
                    textShadow:`0 0 16px ${c.primary}${stage?'aa':'55'}` }}>{v}</div>
                  <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#6b7283', letterSpacing:'0.12em', marginTop:6 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14 }}><NeonWave c={c} active={stage}/></div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
              <span style={{ fontFamily:'Archivo, sans-serif', fontWeight:800, fontSize:18, color:c.primary }}>{brl(DATA.valorShow)}</span>
              <button style={{ padding:'10px 16px', borderRadius:11, border:'none', cursor:'pointer',
                fontFamily:'JetBrains Mono, monospace', fontWeight:700, fontSize:12, color:'#06070a',
                background:`linear-gradient(135deg,${c.primary},${c.accent})`, boxShadow:`0 0 18px ${c.primary}55` }}>VER DETALHES →</button>
            </div>
          </NeonGlass>

          {/* quick stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            {[['A RECEBER',brlK(DATA.stats.aReceber)],['EVENTOS',DATA.stats.eventos],['CLIENTES',DATA.stats.clientes]].map(([l,v],i)=>(
              <NeonGlass key={i} c={c} style={{ padding:'14px 10px' }}>
                <div style={{ fontFamily:'Archivo, sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>{v}</div>
                <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#7c8494', letterSpacing:'0.08em', marginTop:5 }}>{l}</div>
              </NeonGlass>
            ))}
          </div>

          {/* pipeline */}
          <NeonGlass c={c} style={{ padding:16 }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10.5, color:'#9aa1b1', letterSpacing:'0.12em', fontWeight:700, marginBottom:13 }}>PIPELINE FINANCEIRO</div>
            <div style={{ display:'flex', height:14, borderRadius:8, overflow:'hidden', gap:2 }}>
              <div style={{ width:`${pipe.recebido/tot*100}%`, background:'linear-gradient(90deg,#10b981,#34d399)', boxShadow:'0 0 12px #10b98166' }}></div>
              <div style={{ width:`${pipe.pendente/tot*100}%`, background:'linear-gradient(90deg,#f59e0b,#fbbf24)', boxShadow:'0 0 12px #f59e0b66' }}></div>
              <div style={{ width:`${pipe.atrasado/tot*100}%`, background:'linear-gradient(90deg,#ef4444,#f87171)', boxShadow:'0 0 12px #ef444466' }}></div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:13 }}>
              {[['Recebido','#34d399',pipe.recebido],['Pendente','#fbbf24',pipe.pendente],['Atrasado','#f87171',pipe.atrasado]].map(([l,col,v],i)=>(
                <div key={i}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:7, height:7, borderRadius:2, background:col }}></span>
                    <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9.5, color:'#8a91a1' }}>{l}</span></div>
                  <div style={{ fontFamily:'Archivo, sans-serif', fontWeight:700, fontSize:13.5, color:'#e8ebf0', marginTop:4 }}>{brlK(v)}</div>
                </div>
              ))}
            </div>
          </NeonGlass>

          {/* alerts */}
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {DATA.alerts.map(a=>{
              const col = a.level==='late'?'#f87171':'#fbbf24';
              return (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:13,
                  background:`${col}10`, border:`1px solid ${col}33` }}>
                  <span style={{ fontSize:17 }}>{a.level==='late'?'🚨':'⏳'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Archivo, sans-serif', fontWeight:700, fontSize:13.5, color:'#fff' }}>{a.title}</div>
                    <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10.5, color:col, marginTop:2 }}>{a.info}</div>
                  </div>
                  <span style={{ fontFamily:'Archivo, sans-serif', fontWeight:800, fontSize:14, color:col }}>{brl(a.value)}</span>
                </div>
              );
            })}
          </div>

          {/* upcoming */}
          <div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10.5, color:'#7c8494', letterSpacing:'0.12em', fontWeight:700, margin:'4px 2px 10px' }}>PRÓXIMOS EVENTOS</div>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {DATA.upcoming.map(e=>(
                <NeonGlass key={e.id} c={c} style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:13 }}>
                    <div style={{ textAlign:'center', minWidth:40 }}>
                      <div style={{ fontFamily:'Archivo, sans-serif', fontWeight:800, fontSize:19, color:c.primary, lineHeight:1 }}>{e.day}</div>
                      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#7c8494', letterSpacing:'0.1em', marginTop:2 }}>{e.mon}</div>
                    </div>
                    <div style={{ width:1, height:30, background:'#23262f' }}></div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'Archivo, sans-serif', fontWeight:700, fontSize:14, color:'#fff' }}>{e.title}</div>
                      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10.5, color:'#8a91a1', marginTop:2 }}>🕐 {e.time} · {brl(e.value)}</div>
                    </div>
                    <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:e.status==='confirmado'?'#34d399':'#fbbf24',
                      padding:'3px 8px', borderRadius:6, background:e.status==='confirmado'?'#10b98115':'#f59e0b15', border:`1px solid ${e.status==='confirmado'?'#10b98140':'#f59e0b40'}` }}>{e.status}</span>
                  </div>
                </NeonGlass>
              ))}
            </div>
          </div>
        </div>

        {/* bottom nav */}
        <NeonNav c={c}/>
      </div>
    </div>
  );
}
function NeonNav({ c }){
  const items=[['Home','▦',true],['Agenda','▤',false],['+','',null],['Financeiro','◫',false],['Perfil','◉',false]];
  return (
    <div style={{ position:'sticky', bottom:0, marginTop:8, padding:'10px 14px 22px',
      background:'linear-gradient(0deg, #050609 60%, transparent)', backdropFilter:'blur(8px)' }}>
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px', borderRadius:20,
        background:'rgba(16,18,26,.9)', border:'1px solid #23262f' }}>
        <div style={{ position:'absolute', top:-1, left:'10%', width:'18%', height:2, borderRadius:2, background:c.primary, boxShadow:`0 0 12px ${c.primary}`, transition:'all .3s' }}></div>
        {items.map(([l,ic,act],i)=> act===null ? (
          <div key={i} style={{ width:50, height:50, borderRadius:16, marginTop:-22, display:'grid', placeItems:'center',
            background:`linear-gradient(135deg,${c.primary},${c.accent})`, boxShadow:`0 0 22px ${c.primary}66`,
            fontFamily:'Archivo,sans-serif', fontWeight:800, fontSize:26, color:'#06070a' }}>+</div>
        ) : (
          <div key={i} style={{ textAlign:'center' }}>
            <div style={{ fontSize:17, color:act?c.primary:'#5f6678' }}>{ic}</div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8.5, color:act?c.primary:'#5f6678', marginTop:3, letterSpacing:'0.04em' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { NeonSplash, NeonLogin, NeonHome });
