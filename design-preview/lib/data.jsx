/* ============================================================
   Backstage Pro — Shared data, hooks & chrome
   Exposed on window for the three direction files.
   ============================================================ */

// ---- Categories (mirrors src/lib/categoryConfig.js) ----
const CATEGORIES = {
  dj:           { id:'dj',           emoji:'🎧', label:'DJ / Música',     short:'DJ',         primary:'#00D9FF', accent:'#A64AFF', motivation:'A batida é seu ritmo. Você move multidões.' },
  audio:        { id:'audio',        emoji:'🎙️', label:'Técnico de Som',  short:'Som',        primary:'#39FF14', accent:'#00D9FF', motivation:'Sem som, não há show. Você é a alma do evento.' },
  lighting:     { id:'lighting',     emoji:'💡', label:'Iluminação',      short:'Luz',        primary:'#A64AFF', accent:'#FFB700', motivation:'Luz define o clima. Você pinta o palco.' },
  photo:        { id:'photo',        emoji:'📷', label:'Fotografia',      short:'Foto',       primary:'#FF6B35', accent:'#00D9FF', motivation:'Você congela os melhores momentos.' },
  video:        { id:'video',        emoji:'🎬', label:'Vídeo',           short:'Vídeo',      primary:'#FF006E', accent:'#00D9FF', motivation:'Você transforma momentos em obras visuais.' },
  production:   { id:'production',   emoji:'📋', label:'Produção',        short:'Produção',   primary:'#FFB700', accent:'#00D9FF', motivation:'Caos organizado é sua arte.' },
  scenography:  { id:'scenography',  emoji:'🎭', label:'Cenografia',      short:'Cenografia', primary:'#A64AFF', accent:'#FF6B35', motivation:'Você cria universos. O palco é sua tela.' },
  security:     { id:'security',     emoji:'🔒', label:'Segurança',       short:'Segurança',  primary:'#FF3B3B', accent:'#00D9FF', motivation:'Confiança é sua moeda.' },
  hospitality:  { id:'hospitality',  emoji:'🍽️', label:'Camarim',         short:'Camarim',    primary:'#00D9FF', accent:'#FFB700', motivation:'Conforto é seu compromisso.' },
};
const CATEGORY_LIST = Object.values(CATEGORIES);

// ---- Per-category hero event copy ----
const EVENT_BY_CAT = {
  dj:          { title:'Sunset Rooftop',      sub:'Set principal · 3h' },
  audio:       { title:'Festival Aurora',     sub:'PA + Monitor · Main Stage' },
  lighting:    { title:'Gala Lumière',        sub:'Moving heads + LED wall' },
  photo:       { title:'Casamento V. Helena', sub:'Cobertura completa · 8h' },
  video:       { title:'TechSummit 2026',     sub:'Multicâmera + streaming' },
  production:  { title:'Arena Live',          sub:'Coordenação geral' },
  scenography: { title:'Teatro Municipal',    sub:'Cenário ato II' },
  security:    { title:'Festival Aurora',     sub:'Crowd control · Setor B' },
  hospitality: { title:'Backstage VIP',       sub:'Camarim 3 artistas' },
};

// ---- Mock dataset (shared across directions) ----
const DATA = {
  user: { name:'Marcos', greetingNight:'Boa noite' },
  venue: 'Arena Vibe · São Paulo',
  stats: { aReceber: 6800, eventos: 12, clientes: 8 },
  pipeline: { recebido: 9200, pendente: 4100, atrasado: 1350 },
  valorShow: 2400,
  alerts: [
    { id:1, level:'late',    title:'Casamento V. Helena', value:1350, info:'atrasado 6 dias' },
    { id:2, level:'pending', title:'Corporativo TechSummit', value:800, info:'vence em 2 dias' },
  ],
  upcoming: [
    { id:1, day:'08', mon:'JUN', title:'Sunset Rooftop',  time:'18:00', value:2400, status:'confirmado' },
    { id:2, day:'12', mon:'JUN', title:'TechSummit 2026',  time:'09:00', value:3200, status:'confirmado' },
    { id:3, day:'15', mon:'JUN', title:'Casamento Helena', time:'16:00', value:4100, status:'pendente' },
  ],
};

function brl(n){ return 'R$ ' + Number(n).toLocaleString('pt-BR'); }
function brlK(n){ return 'R$ ' + (n/1000).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}) + 'k'; }

// ---- Countdown hook. Stage mode => event today (hours away). Else => 2 days. ----
function useCountdown(stage){
  const target = React.useMemo(()=>{
    const t = new Date();
    if(stage){ t.setHours(t.getHours()+4, t.getMinutes(), 12, 0); }
    else { t.setDate(t.getDate()+2); t.setHours(t.getHours()+5); }
    return t.getTime();
  }, [stage]);
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(()=>{ const i=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(i); },[]);
  let d = Math.max(0, target - now);
  const days = Math.floor(d/86400000); d-=days*86400000;
  const hours= Math.floor(d/3600000);  d-=hours*3600000;
  const mins = Math.floor(d/60000);    d-=mins*60000;
  const secs = Math.floor(d/1000);
  const p = (x)=>String(x).padStart(2,'0');
  return { days, hours, mins, secs, p, isToday: stage };
}

// ---- Fake live audio levels (8 bars) ----
function useLevels(n, speed, active){
  const [v, setV] = React.useState(()=>Array.from({length:n},()=>Math.random()));
  React.useEffect(()=>{
    const i=setInterval(()=>setV(Array.from({length:n},()=>active?0.25+Math.random()*0.75:0.12+Math.random()*0.3)), speed||140);
    return ()=>clearInterval(i);
  },[n,speed,active]);
  return v;
}

/* =================== Phone shell =================== */
function PhoneShell({ accent, screens, active, onChange, children, name, tagline }){
  const [time,setTime] = React.useState('21:47');
  React.useEffect(()=>{
    const f=()=>{ const d=new Date(); setTime(String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')); };
    f(); const i=setInterval(f,10000); return ()=>clearInterval(i);
  },[]);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'Archivo, sans-serif', fontWeight:800, fontSize:19, letterSpacing:'-0.01em', color:'#fff' }}>{name}</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'#7a8190', marginTop:3, letterSpacing:'0.02em' }}>{tagline}</div>
      </div>
      <div style={{ position:'relative', width:393, height:812, borderRadius:54, padding:11,
        background:'linear-gradient(160deg,#23262e,#0c0d11 60%)',
        boxShadow:'0 0 0 2px #000, 0 30px 70px -20px rgba(0,0,0,.8), inset 0 1px 2px rgba(255,255,255,.12)' }}>
        <div style={{ position:'relative', width:'100%', height:'100%', borderRadius:44, overflow:'hidden', background:'#000', isolation:'isolate' }}>
          {/* status bar */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:50, zIndex:60, display:'flex', alignItems:'center',
            justifyContent:'space-between', padding:'0 30px 0 34px', pointerEvents:'none' }}>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:600, fontSize:14, color:'#fff', letterSpacing:'0.02em', textShadow:'0 1px 4px rgba(0,0,0,.6)' }}>{time}</span>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <Signal/><Wifi/><Battery accent={accent}/>
            </div>
          </div>
          {/* dynamic island */}
          <div style={{ position:'absolute', top:11, left:'50%', transform:'translateX(-50%)', width:118, height:33, background:'#000', borderRadius:20, zIndex:70 }}></div>
          {/* screen */}
          <div className="bp-screen" style={{ position:'absolute', inset:0, overflowY:'auto', overflowX:'hidden' }}>{children}</div>
        </div>
      </div>
      {/* screen switcher */}
      <div style={{ display:'flex', gap:4, padding:4, borderRadius:14, background:'#15171d', border:'1px solid #24262f' }}>
        {screens.map(s=>{
          const on = s.id===active;
          return (
            <button key={s.id} onClick={()=>onChange(s.id)} style={{
              fontFamily:'JetBrains Mono, monospace', fontSize:12, fontWeight:600, letterSpacing:'0.04em',
              textTransform:'uppercase', padding:'8px 16px', borderRadius:10, border:'none', cursor:'pointer',
              color: on?'#0a0b0e':'#8b92a0', background: on?accent:'transparent',
              boxShadow: on?`0 0 18px ${accent}66`:'none', transition:'all .2s' }}>{s.label}</button>
          );
        })}
      </div>
    </div>
  );
}
function Signal(){ return (<svg width="18" height="12" viewBox="0 0 18 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>); }
function Wifi(){ return (<svg width="17" height="12" viewBox="0 0 17 12" fill="#fff"><path d="M8.5 11.5 11 8.6a3.7 3.7 0 0 0-5 0l2.5 2.9Z"/><path d="M8.5 4.2c2 0 3.9.75 5.3 2.1l1.6-1.8A10 10 0 0 0 8.5 1.7 10 10 0 0 0 1.6 4.5l1.6 1.8A7.5 7.5 0 0 1 8.5 4.2Z" opacity=".95"/></svg>); }
function Battery({accent}){ return (<svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="#fff" strokeOpacity=".4"/><rect x="2" y="2" width="16" height="9" rx="2" fill={accent||'#fff'}/><rect x="24" y="4" width="2" height="5" rx="1" fill="#fff" fillOpacity=".4"/></svg>); }

/* =================== Global control bar =================== */
function ControlBar({ categoryId, setCategoryId, stage, setStage }){
  const cat = CATEGORIES[categoryId];
  return (
    <div style={{ position:'sticky', top:0, zIndex:200, background:'rgba(10,11,14,.86)', backdropFilter:'blur(20px)',
      borderBottom:'1px solid #1c1e26', padding:'16px 24px' }}>
      <div style={{ maxWidth:1500, margin:'0 auto', display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:13 }}>
          <div style={{ width:38, height:38, borderRadius:11, display:'grid', placeItems:'center',
            background:`conic-gradient(from 200deg, ${cat.primary}, ${cat.accent}, ${cat.primary})`, boxShadow:`0 0 22px ${cat.primary}55` }}>
            <span style={{ fontFamily:'Anton, sans-serif', fontSize:20, color:'#06070a' }}>B</span>
          </div>
          <div>
            <div style={{ fontFamily:'Archivo, sans-serif', fontWeight:800, fontSize:16, color:'#fff', letterSpacing:'-0.01em' }}>Backstage&nbsp;Pro</div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10.5, color:'#6c7382', letterSpacing:'0.05em' }}>3 DIREÇÕES · HOME + LOGIN + SPLASH</div>
          </div>
        </div>

        <div style={{ flex:1, minWidth:200 }}></div>

        {/* category infector */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10.5, color:'#6c7382', letterSpacing:'0.08em', textTransform:'uppercase' }}>Categoria</span>
          <div style={{ display:'flex', gap:6, overflowX:'auto', maxWidth:430, padding:'2px' }} className="bp-catrow">
            {CATEGORY_LIST.map(c=>{
              const on = c.id===categoryId;
              return (
                <button key={c.id} onClick={()=>setCategoryId(c.id)} title={c.label} style={{
                  display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap', cursor:'pointer',
                  fontFamily:'JetBrains Mono, monospace', fontSize:12, fontWeight:600,
                  padding:'7px 12px', borderRadius:10, transition:'all .18s',
                  border:`1px solid ${on?c.primary:'#262934'}`,
                  background: on?`${c.primary}1f`:'#16181f',
                  color: on?'#fff':'#8b92a0' }}>
                  <span style={{ width:9, height:9, borderRadius:'50%', background:c.primary, boxShadow:on?`0 0 10px ${c.primary}`:'none' }}></span>
                  {c.short}
                </button>
              );
            })}
          </div>
        </div>

        {/* stage toggle */}
        <div style={{ display:'flex', gap:4, padding:4, borderRadius:13, background:'#16181f', border:'1px solid #262934' }}>
          {[{k:false,l:'Bastidores'},{k:true,l:'Modo Palco'}].map(o=>{
            const on = stage===o.k;
            return (
              <button key={String(o.k)} onClick={()=>setStage(o.k)} style={{
                display:'flex', alignItems:'center', gap:7,
                fontFamily:'Archivo, sans-serif', fontWeight:700, fontSize:13, letterSpacing:'0.01em',
                padding:'8px 16px', borderRadius:10, border:'none', cursor:'pointer', transition:'all .2s',
                color: on?(o.k?'#06070a':'#fff'):'#8b92a0',
                background: on?(o.k?cat.primary:'#262934'):'transparent',
                boxShadow: on&&o.k?`0 0 20px ${cat.primary}77`:'none' }}>
                {o.k && <span style={{ width:8, height:8, borderRadius:'50%', background:on?'#06070a':cat.primary,
                  animation: on?'bpPulse 1s infinite':'none' }}></span>}
                {o.l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CATEGORIES, CATEGORY_LIST, EVENT_BY_CAT, DATA, brl, brlK, useCountdown, useLevels, PhoneShell, ControlBar });
