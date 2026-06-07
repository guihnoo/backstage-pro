/* ============================================================
   DIRECTION 3 — FESTIVAL HOLOGRÁFICO
   Volumetric haze, aurora, particles, iridescent foil type,
   a glowing countdown orb with rotating light beams.
   ============================================================ */

function HoloAtmos({ c, stage }){
  const parts = React.useMemo(()=>Array.from({length:16},()=>({
    left: Math.random()*100, size: 1.5+Math.random()*3, dur: 7+Math.random()*9, delay:-Math.random()*16, op:0.2+Math.random()*0.5
  })),[]);
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(130% 90% at 50% 0%, #141a3e 0%, #0a0e27 50%, #06081a 100%)' }}></div>
      {/* aurora blobs */}
      <div className="bp-aurora" style={{ position:'absolute', top:'-15%', left:'-10%', width:340, height:340, borderRadius:'50%',
        background:`radial-gradient(circle, ${c.primary}${stage?'44':'2a'}, transparent 65%)`, filter:'blur(40px)' }}></div>
      <div className="bp-aurora2" style={{ position:'absolute', top:'20%', right:'-20%', width:320, height:320, borderRadius:'50%',
        background:`radial-gradient(circle, ${c.accent}${stage?'3a':'24'}, transparent 65%)`, filter:'blur(45px)' }}></div>
      <div className="bp-aurora" style={{ position:'absolute', bottom:'-10%', left:'20%', width:300, height:300, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,122,217,.16), transparent 65%)', filter:'blur(50px)', animationDelay:'-6s' }}></div>
      {/* drifting spotlight */}
      <div className="bp-holospot" style={{ position:'absolute', top:'-20%', left:'30%', width:300, height:520,
        background:`conic-gradient(from 180deg at 50% 0%, transparent 78deg, ${c.primary}1c 90deg, transparent 102deg)`, filter:'blur(6px)' }}></div>
      {/* particles */}
      {parts.map((p,i)=>(
        <div key={i} style={{ position:'absolute', bottom:-10, left:`${p.left}%`, width:p.size, height:p.size, borderRadius:'50%',
          background:'#fff', opacity:p.op, boxShadow:`0 0 6px ${c.primary}`, animation:`bpFloat ${p.dur/(stage?1.6:1)}s linear ${p.delay}s infinite` }}></div>
      ))}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 80% at 50% 120%, transparent 60%, rgba(6,8,26,.7))' }}></div>
    </div>
  );
}

function Foil({ children, size, weight=700, style }){
  return <span style={{ fontFamily:'Unbounded, sans-serif', fontWeight:weight, fontSize:size, letterSpacing:'-0.01em', lineHeight:1.02,
    background:'linear-gradient(100deg,#fff 10%, #b8c6ff 30%, #ff9ee0 50%, #8af0ff 70%, #fff 92%)',
    backgroundSize:'220% 100%', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent',
    animation:'bpFoil 6s linear infinite', ...style }}>{children}</span>;
}

function HoloGlass({ c, children, style, irid }){
  return (
    <div style={{ position:'relative', borderRadius:22, padding: irid?1.4:0, background: irid?`conic-gradient(from 140deg, ${c.primary}, ${c.accent}, #ff7ad9, ${c.primary})`:'transparent', ...style }}>
      <div style={{ position:'relative', borderRadius: irid?20.6:22, padding:17, overflow:'hidden',
        background:'linear-gradient(155deg, rgba(255,255,255,.08), rgba(255,255,255,.025))',
        border: irid?'none':'1px solid rgba(255,255,255,.12)',
        boxShadow:`inset 0 1px 0 rgba(255,255,255,.18), 0 18px 40px -22px #000`, backdropFilter:'blur(18px)' }}>
        {children}
      </div>
    </div>
  );
}

/* glowing countdown orb */
function HoloOrb({ c, cd, stage }){
  const big = stage ? `${cd.p(cd.hours)}:${cd.p(cd.mins)}:${cd.p(cd.secs)}` : `${cd.days}d ${cd.p(cd.hours)}h`;
  return (
    <div style={{ position:'relative', width:206, height:206, margin:'4px auto 0' }}>
      {/* rotating beams */}
      <div style={{ position:'absolute', inset:-24, borderRadius:'50%', animation:'bpSpin 14s linear infinite',
        background:`conic-gradient(${c.primary}00, ${c.primary}44, ${c.accent}00, ${c.accent}3a, ${c.primary}00)`, filter:'blur(10px)', opacity:stage?1:.7 }}></div>
      {/* halo */}
      <div style={{ position:'absolute', inset:6, borderRadius:'50%', background:`radial-gradient(circle, ${c.primary}22, transparent 70%)`,
        boxShadow:`0 0 60px ${c.primary}${stage?'66':'3a'}`, animation:'bpBreath 3s ease-in-out infinite' }}></div>
      {/* ring */}
      <div style={{ position:'absolute', inset:18, borderRadius:'50%', border:`1.5px solid ${c.primary}66`, boxShadow:`inset 0 0 30px ${c.primary}33` }}></div>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontFamily:'Spline Sans Mono, monospace', fontWeight:600, fontSize:stage?34:38, color:'#fff', textShadow:`0 0 22px ${c.primary}`, letterSpacing:'0.01em' }}>{big}</div>
        <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:11, color:c.primary, letterSpacing:'0.22em', marginTop:6 }}>{stage?'AO VIVO EM':'CONTAGEM'}</div>
        {!stage && <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:10.5, color:'#aab2d8', marginTop:8 }}>{cd.p(cd.mins)}m {cd.p(cd.secs)}s</div>}
      </div>
    </div>
  );
}

/* ---------- SPLASH ---------- */
function HoloSplash({ c }){
  return (
    <div style={{ position:'absolute', inset:0 }}>
      <HoloAtmos c={c} stage={true}/>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ position:'relative', width:110, height:110, borderRadius:'50%', marginBottom:30, display:'grid', placeItems:'center',
          background:`conic-gradient(from 120deg, ${c.primary}, ${c.accent}, #ff7ad9, ${c.primary})`, boxShadow:`0 0 60px ${c.primary}77`, animation:'bpBreath 2.6s ease-in-out infinite' }}>
          <div style={{ width:92, height:92, borderRadius:'50%', background:'#0a0e27', display:'grid', placeItems:'center' }}>
            <span style={{ fontFamily:'Unbounded,sans-serif', fontWeight:800, fontSize:44, color:'#fff', textShadow:`0 0 20px ${c.primary}` }}>B</span>
          </div>
        </div>
        <Foil size={38} weight={800} style={{ textAlign:'center' }}>Backstage</Foil>
        <Foil size={38} weight={800} style={{ textAlign:'center', marginTop:-2 }}>Pro</Foil>
        <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:11, color:'#9aa4d4', letterSpacing:'0.3em', marginTop:18 }}>A LUZ ANTES DO SHOW</div>
        <div style={{ width:160, height:3, borderRadius:3, background:'rgba(255,255,255,.1)', marginTop:30, overflow:'hidden' }}>
          <div style={{ height:'100%', width:'50%', borderRadius:3, background:`linear-gradient(90deg,${c.primary},${c.accent})`, boxShadow:`0 0 14px ${c.primary}`, animation:'bpLoad 2.2s ease-in-out infinite' }}></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- LOGIN ---------- */
function HoloLogin({ c }){
  return (
    <div style={{ position:'absolute', inset:0 }}>
      <HoloAtmos c={c} stage={false}/>
      <image-slot id="holo-login-photo" shape="rounded" radius="0" fit="cover" placeholder="📷 foto de festival"
        style={{ position:'absolute', top:0, left:0, right:0, height:'42%', opacity:0.3 }}></image-slot>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(10,14,39,.3) 0%, rgba(10,14,39,.85) 55%, #0a0e27 80%)' }}></div>

      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 22px 38px' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', display:'grid', placeItems:'center', marginBottom:20,
          background:`conic-gradient(from 120deg, ${c.primary}, ${c.accent}, #ff7ad9, ${c.primary})`, boxShadow:`0 0 36px ${c.primary}66` }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'#0a0e27', display:'grid', placeItems:'center' }}>
            <span style={{ fontFamily:'Unbounded,sans-serif', fontWeight:800, fontSize:26, color:'#fff' }}>B</span></div>
        </div>
        <Foil size={32} weight={800}>Entre na luz.</Foil>
        <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:12, color:'#aab2d8', marginTop:10 }}>Seu próximo show já está brilhando.</div>

        <HoloGlass c={c} irid style={{ marginTop:24 }}>
          <HoloField c={c} label="E-MAIL" value="marcos@backstage.pro"/>
          <div style={{ height:14 }}></div>
          <HoloField c={c} label="SENHA" value="••••••••••" eye/>
          <button style={{ marginTop:20, width:'100%', padding:'16px', borderRadius:15, border:'none', cursor:'pointer',
            fontFamily:'Unbounded, sans-serif', fontWeight:700, fontSize:14, color:'#0a0e27',
            background:`linear-gradient(110deg, ${c.primary}, ${c.accent})`, boxShadow:`0 0 30px ${c.primary}66` }}>
            Acender o palco
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'18px 0 14px' }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,.12)' }}></div>
            <span style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:10, color:'#7e88b4', letterSpacing:'0.12em' }}>OU</span>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,.12)' }}></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
            {['Google','Apple'].map(p=>(
              <button key={p} style={{ padding:'13px', borderRadius:13, cursor:'pointer', fontFamily:'Spline Sans Mono, monospace', fontWeight:500, fontSize:12.5,
                color:'#dfe4fb', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.14)', backdropFilter:'blur(6px)' }}>{p}</button>
            ))}
          </div>
        </HoloGlass>
        <div style={{ textAlign:'center', marginTop:18, fontFamily:'Spline Sans Mono, monospace', fontSize:12, color:'#aab2d8' }}>
          Primeira vez? <span style={{ color:c.primary, fontWeight:600 }}>Criar conta</span>
        </div>
      </div>
    </div>
  );
}
function HoloField({ c, label, value, eye }){
  return (
    <div>
      <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:10, color:'#8089b4', letterSpacing:'0.12em', marginBottom:8 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 15px', borderRadius:14,
        background:'rgba(255,255,255,.05)', border:`1px solid ${c.primary}40`, boxShadow:`inset 0 0 16px ${c.primary}14` }}>
        <span style={{ flex:1, fontFamily:'Spline Sans Mono, monospace', fontSize:14, color:'#eef1ff' }}>{value}</span>
        {eye && <span style={{ color:'#8089b4', fontSize:15 }}>👁</span>}
      </div>
    </div>
  );
}

/* ---------- HOME ---------- */
function HoloHome({ c, stage }){
  const cd = useCountdown(stage);
  const ev = EVENT_BY_CAT[c.id] || EVENT_BY_CAT.dj;
  const pipe = DATA.pipeline; const tot = pipe.recebido+pipe.pendente+pipe.atrasado;
  return (
    <div style={{ position:'absolute', inset:0 }}>
      <HoloAtmos c={c} stage={stage}/>
      <div style={{ position:'relative', paddingBottom:96 }}>
        {/* header */}
        <div style={{ padding:'58px 20px 12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              {stage && <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 11px', borderRadius:20, marginBottom:9,
                background:`${c.primary}26`, border:`1px solid ${c.primary}88`, boxShadow:`0 0 18px ${c.primary}44` }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:c.primary, boxShadow:`0 0 8px ${c.primary}`, animation:'bpPulse 1.1s infinite' }}></span>
                <span style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:10, fontWeight:600, color:'#fff', letterSpacing:'0.1em' }}>MODO PALCO</span>
              </div>}
              <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:11, color:'#8089b4', letterSpacing:'0.06em' }}>SÁB, 8 DE JUNHO</div>
              <Foil size={25} weight={700} style={{ display:'block', marginTop:4 }}>{DATA.user.greetingNight}, {DATA.user.name}</Foil>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, marginTop:10, padding:'5px 12px', borderRadius:20,
                background:`${c.primary}1a`, border:`1px solid ${c.primary}44` }}>
                <span>{c.emoji}</span>
                <span style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:11, color:c.primary, letterSpacing:'0.04em' }}>{c.label}</span>
              </div>
            </div>
            <div style={{ width:42, height:42, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:16,
              background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.14)' }}>🔔</div>
          </div>
        </div>

        <div style={{ padding:'8px 18px 0', display:'flex', flexDirection:'column', gap:15 }}>
          {/* orb hero */}
          <HoloGlass c={c} irid style={{}}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:10.5, color:c.primary, letterSpacing:'0.16em' }}>✦ PRÓXIMO SHOW</span>
              <span style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:10.5, color:'#8089b4' }}>{stage?'HOJE':'EM 2 DIAS'}</span>
            </div>
            <HoloOrb c={c} cd={cd} stage={stage}/>
            <div style={{ textAlign:'center', marginTop:8 }}>
              <Foil size={22} weight={700}>{ev.title}</Foil>
              <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:11, color:'#aab2d8', marginTop:5 }}>{ev.sub}</div>
              <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:11, color:'#8089b4', marginTop:2 }}>📍 {DATA.venue}</div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16 }}>
              <span style={{ fontFamily:'Unbounded,sans-serif', fontWeight:700, fontSize:17, color:'#fff' }}>{brl(DATA.valorShow)}</span>
              <button style={{ padding:'11px 17px', borderRadius:13, border:'none', cursor:'pointer', fontFamily:'Unbounded,sans-serif', fontWeight:600, fontSize:12, color:'#0a0e27',
                background:`linear-gradient(110deg,${c.primary},${c.accent})`, boxShadow:`0 0 20px ${c.primary}55` }}>Detalhes →</button>
            </div>
          </HoloGlass>

          {/* stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:11 }}>
            {[['A RECEBER',brlK(DATA.stats.aReceber)],['EVENTOS',DATA.stats.eventos],['CLIENTES',DATA.stats.clientes]].map(([l,v],i)=>(
              <HoloGlass key={i} c={c} style={{ padding:0 }}>
                <div style={{ padding:'2px' }}>
                  <div style={{ fontFamily:'Unbounded,sans-serif', fontWeight:700, fontSize:18, color:'#fff' }}>{v}</div>
                  <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:8.5, color:'#8089b4', letterSpacing:'0.06em', marginTop:5 }}>{l}</div>
                </div>
              </HoloGlass>
            ))}
          </div>

          {/* pipeline — luminous bar */}
          <HoloGlass c={c}>
            <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:10.5, color:'#aab2d8', letterSpacing:'0.1em', marginBottom:13 }}>PIPELINE FINANCEIRO</div>
            <div style={{ display:'flex', height:16, borderRadius:10, overflow:'hidden', gap:3 }}>
              <div style={{ width:`${pipe.recebido/tot*100}%`, background:'linear-gradient(90deg,#10b981,#5eead4)', boxShadow:'0 0 16px #10b981aa' }}></div>
              <div style={{ width:`${pipe.pendente/tot*100}%`, background:'linear-gradient(90deg,#f59e0b,#fcd34d)', boxShadow:'0 0 16px #f59e0baa' }}></div>
              <div style={{ width:`${pipe.atrasado/tot*100}%`, background:'linear-gradient(90deg,#ef4444,#fb7185)', boxShadow:'0 0 16px #ef4444aa' }}></div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
              {[['Recebido','#5eead4',pipe.recebido],['Pendente','#fcd34d',pipe.pendente],['Atrasado','#fb7185',pipe.atrasado]].map(([l,col,v],i)=>(
                <div key={i}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:col, boxShadow:`0 0 8px ${col}` }}></span>
                    <span style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:9.5, color:'#aab2d8' }}>{l}</span></div>
                  <div style={{ fontFamily:'Unbounded,sans-serif', fontWeight:600, fontSize:13, color:'#fff', marginTop:5 }}>{brlK(v)}</div>
                </div>
              ))}
            </div>
          </HoloGlass>

          {/* alerts */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {DATA.alerts.map(a=>{
              const col = a.level==='late'?'#fb7185':'#fcd34d';
              return (
                <div key={a.id} style={{ position:'relative', display:'flex', alignItems:'center', gap:12, padding:'14px 15px', borderRadius:16,
                  background:'rgba(255,255,255,.05)', border:`1px solid ${col}40`, boxShadow:`0 0 22px ${col}1c, inset 0 1px 0 rgba(255,255,255,.1)`, backdropFilter:'blur(12px)' }}>
                  <span style={{ fontSize:17 }}>{a.level==='late'?'🚨':'⏳'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Unbounded,sans-serif', fontWeight:600, fontSize:12.5, color:'#fff' }}>{a.title}</div>
                    <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:10.5, color:col, marginTop:3 }}>{a.info}</div>
                  </div>
                  <span style={{ fontFamily:'Unbounded,sans-serif', fontWeight:700, fontSize:13, color:col }}>{brl(a.value)}</span>
                </div>
              );
            })}
          </div>

          {/* upcoming */}
          <div>
            <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:10.5, color:'#8089b4', letterSpacing:'0.1em', margin:'4px 2px 11px' }}>PRÓXIMOS EVENTOS</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {DATA.upcoming.map(e=>(
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 15px', borderRadius:16,
                  background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', backdropFilter:'blur(12px)' }}>
                  <div style={{ textAlign:'center', minWidth:40 }}>
                    <div style={{ fontFamily:'Unbounded,sans-serif', fontWeight:700, fontSize:18, color:c.primary, lineHeight:1 }}>{e.day}</div>
                    <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:8.5, color:'#8089b4', letterSpacing:'0.08em', marginTop:3 }}>{e.mon}</div>
                  </div>
                  <div style={{ width:1, height:30, background:'rgba(255,255,255,.12)' }}></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Unbounded,sans-serif', fontWeight:600, fontSize:13, color:'#fff' }}>{e.title}</div>
                    <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:10, color:'#aab2d8', marginTop:3 }}>🕐 {e.time} · {brl(e.value)}</div>
                  </div>
                  <span style={{ width:9, height:9, borderRadius:'50%', background:e.status==='confirmado'?'#5eead4':'#fcd34d', boxShadow:`0 0 8px ${e.status==='confirmado'?'#5eead4':'#fcd34d'}` }}></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <HoloNav c={c}/>
      </div>
    </div>
  );
}
function HoloNav({ c }){
  const items=[['Home','✦',true],['Agenda','◷',false],['+',''],['Pipeline','◈',false],['Perfil','◉',false]];
  return (
    <div style={{ position:'sticky', bottom:0, marginTop:8, padding:'10px 16px 22px', background:'linear-gradient(0deg,#06081a 55%,transparent)' }}>
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderRadius:24,
        background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.14)', backdropFilter:'blur(16px)', boxShadow:'inset 0 1px 0 rgba(255,255,255,.2)' }}>
        <div style={{ position:'absolute', top:-1, left:'9%', width:'18%', height:2, borderRadius:2, background:c.primary, boxShadow:`0 0 14px ${c.primary}` }}></div>
        {items.map(([l,ic,act],i)=> act===undefined && l==='+' ? (
          <div key={i} style={{ width:50, height:50, borderRadius:'50%', marginTop:-22, display:'grid', placeItems:'center',
            background:`conic-gradient(from 120deg,${c.primary},${c.accent},#ff7ad9,${c.primary})`, boxShadow:`0 0 24px ${c.primary}66`,
            fontFamily:'Unbounded,sans-serif', fontWeight:700, fontSize:24, color:'#0a0e27' }}>+</div>
        ) : (
          <div key={i} style={{ textAlign:'center' }}>
            <div style={{ fontSize:16, color:act?c.primary:'#6a73a0', textShadow:act?`0 0 10px ${c.primary}`:'none' }}>{ic}</div>
            <div style={{ fontFamily:'Spline Sans Mono, monospace', fontSize:8.5, color:act?c.primary:'#6a73a0', marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { HoloSplash, HoloLogin, HoloHome });
