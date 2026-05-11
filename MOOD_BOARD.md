# Mood Board — Backstage Pro Visual Design

## 1. CONCEITO VISUAL

**Temática**: Backstage realista de shows/eventos ao vivo  
**Vibe**: Profissional, energético, técnico, imersivo  
**Público**: Freelancers de eventos (técnicos, DJs, fotógrafos, produtores)  

---

## 2. PALETA DE CORES

### Primária (Lighting Realism)
- **Deep Teal**: `#0F3D56` — Escuridão de palco
- **Electric Cyan**: `#00D9FF` — Spotlight principal
- **Neon Purple**: `#A64AFF` — Gel de luz roxo
- **Vibrant Magenta**: `#FF006E` — Gel de luz magenta
- **Gold/Amber**: `#FFB700` — Warm light dos spots

### Secundária (Background)
- **Very Dark Blue**: `#0A1428` — Fundo do palco (preto real)
- **Dark Navy**: `#1B2A3E` — Cards/containers
- **Muted Gray**: `#6B7280` — Text secundário

### Accent (CTA)
- **Neon Green**: `#39FF14` — Botões ativos (segurança)
- **Sunset Orange**: `#FF6B35` — Warning/attention

---

## 3. BACKGROUNDS VISUAIS

### Splash Screen
**Tipo**: Foto real de palco/estúdio durante show  
**Referências Unsplash**:
- `concert-stage-lighting-from-above` (vista aérea)
- `stage-with-spotlights-and-smoke` (atmosférico)
- `empty-concert-stage-ready` (antecipação)

**Overlay**: Gradiente opaco `rgba(10, 20, 40, 0.8)` para legibilidade

**Elemento focal**: Logo centralizado com glow real

```
┌─────────────────────────────────┐
│  [REAL STAGE PHOTO BACKGROUND]  │
│  [com overlay escuro]           │
│                                 │
│         ⚡ BACKSTAGE PRO        │
│         Seu backstage digital   │
│      [Equalizador animado]      │
│      [Barra de progresso]       │
└─────────────────────────────────┘
```

---

### Login/Signup Page
**Tipo**: Foto dinâmica (show em andamento, luzes, palco)  
**Referências Unsplash**:
- `dj-booth-with-lights-and-crowd` (lado técnico)
- `concert-crowd-and-stage-lights` (energia)
- `festival-stage-night-lighting` (vibrante)

**Card**: Glassmorphism com backdrop-blur
```css
background: rgba(27, 42, 62, 0.7);
backdrop-filter: blur(20px);
border: 1px solid rgba(0, 217, 255, 0.2);
box-shadow: 0 8px 32px rgba(0, 217, 255, 0.1);
```

**Layout**:
```
┌─────────────────────────────────────────┐
│  [REAL SHOW/STAGE BACKGROUND]          │
│  [escuro no overlay]                    │
│                                         │
│        ┌──────────────────────┐        │
│        │  Bem-vindo           │        │
│        │  Email   [input]     │        │
│        │  Senha   [input]     │        │
│        │ [Entrar] [Google]    │        │
│        │ [ou entre com...]    │        │
│        │ [Google][Discord]    │        │
│        │ [Facebook][Apple]    │        │
│        │ [Criar conta]        │        │
│        └──────────────────────┘        │
└─────────────────────────────────────────┘
```

---

### Onboarding Pages
**Tipo**: Diferentes aspectos de shows/eventos
- **Step 1** (Identidade): Técnico em ação (mixer, headphones)
- **Step 2** (Categoria): Diferentes áreas (som, luz, palco, etc)
- **Step 3** (Especialidades): Close-up de equipamentos
- **Step 4** (Metas): Gráfico/estatísticas em ambiente técnico
- **Step 5** (Confirmação): Celebração (cena de show com fireworks/luz)

**Referências Unsplash**:
- `sound-engineer-at-mixer-desk`
- `lighting-technician-spotlight-control`
- `event-stage-setup-crew-working`
- `concert-fireworks-and-lights`

---

### Dashboard
**Tipo**: Workspace técnico + ambient  
**Background**: Padrão sutil (grid em perspectiva como piso de palco)

```css
background-image: 
  repeating-linear-gradient(0deg, 
    rgba(0, 217, 255, 0.05) 0px, 
    rgba(0, 217, 255, 0.05) 1px, 
    transparent 1px, 
    transparent 80px),
  repeating-linear-gradient(90deg, 
    rgba(0, 217, 255, 0.05) 0px, 
    rgba(0, 217, 255, 0.05) 1px, 
    transparent 1px, 
    transparent 80px);
```

---

## 4. COMPONENTES VISUAIS

### Buttons
**Primary** (CTA principal):
```css
background: linear-gradient(135deg, #00D9FF, #A64AFF);
border-radius: 8px;
padding: 12px 24px;
font-weight: 700;
box-shadow: 0 0 20px rgba(0, 217, 255, 0.4);
transition: all 0.3s ease;

&:hover {
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.8);
  transform: translateY(-2px);
}
```

**Secondary** (Outline):
```css
border: 2px solid #00D9FF;
background: transparent;
color: #00D9FF;
```

**Social** (OAuth):
```css
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.2);
backdrop-filter: blur(10px);
```

### Cards
```css
background: rgba(27, 42, 62, 0.6);
border: 1px solid rgba(0, 217, 255, 0.2);
border-radius: 12px;
backdrop-filter: blur(15px);
padding: 20px;
box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
```

### Inputs
```css
background: rgba(15, 61, 86, 0.4);
border: 1px solid rgba(0, 217, 255, 0.3);
border-radius: 8px;
padding: 12px;
color: #fff;
transition: border-color 0.3s;

&:focus {
  border-color: #00D9FF;
  box-shadow: 0 0 10px rgba(0, 217, 255, 0.3);
}
```

---

## 5. TIPOGRAFIA

### Headings
- **Font**: Inter Bold / IBM Plex Sans Bold
- **Size H1**: 48px (splash), 32px (login), 28px (cards)
- **Weight**: 700-900
- **Color**: Gradiente cyan → purple
  ```css
  background: linear-gradient(135deg, #00D9FF, #A64AFF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  ```

### Body
- **Font**: Inter Regular
- **Size**: 14-16px
- **Weight**: 400-500
- **Color**: `#E5E7EB` (light gray)

### Labels
- **Font**: Inter Medium
- **Size**: 13px
- **Weight**: 500
- **Color**: `#9CA3AF`

---

## 6. ANIMAÇÕES & EFEITOS

### Spotlight Effect
Simulação de spotlight se movendo (como em show)
```css
background: radial-gradient(circle at var(--x) var(--y), 
  rgba(0, 217, 255, 0.2) 0%, 
  transparent 70%);
animation: spotlight 6s ease-in-out infinite;
```

### Glow Effects
- **Cyan Glow**: `box-shadow: 0 0 20px rgba(0, 217, 255, 0.5);`
- **Purple Glow**: `box-shadow: 0 0 20px rgba(166, 74, 255, 0.5);`
- **Magenta Glow**: `box-shadow: 0 0 20px rgba(255, 0, 110, 0.5);`

### Pulse (Loading)
```css
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Slide In (Onboarding)
```css
animation: slideIn 0.5s ease-out;

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 7. ÍCONES & ICONOGRAFIA

### Equipamentos (Emoji + Custom SVG)
- 🎚️ Mixer / Equalizer
- 🎙️ Microfone
- 💡 Spotlight / Lighting
- 🔊 Speaker / Som
- 📷 Câmera
- 🎬 Video
- 🎛️ Control Booth
- 🎭 Stage
- 📡 Antenna (Wireless)
- 🎧 Headphones
- 🔌 Power / Connection

### Status Icons (Lucide)
- `Zap` — Lightning (power, energy)
- `CheckCircle2` — Success
- `AlertCircle` — Warning
- `Clock` — Time/Schedule
- `Calendar` — Events
- `DollarSign` — Revenue
- `BarChart3` — Analytics

---

## 8. REFERÊNCIAS INSPIRACIONAIS

### Websites
- **Vercel** (`vercel.com`) — Glassmorphism + gradientes
- **Framer** (`framer.com`) — Animações suaves
- **Spline** (`spline.design`) — 3D realista
- **Linear** (`linear.app`) — Minimalismo com efeitos

### Apps/Platforms
- **Discord** — Dark theme + glow effects
- **Spotify** — Gradientes vibrantes
- **DJay** — Interface de DJ (reference técnica)
- **Serato** — Profissional audio visual

### Design Patterns
- **Glassmorphism** — Cards translúcidos
- **Neumorphism** — Buttons com depth (usar com moderação)
- **Dark Mode** — Contraste alto
- **Gradient Overlays** — Colorful + profissional

---

## 9. ESTRUTURA VISUAL POR PÁGINA

### Splash Screen (2 segundos)
```
[Fundo: Foto real de palco em movimento]
[Overlay opaco: rgba(10, 20, 40, 0.8)]
[Logo com glow cyan]
[Texto animado "Backstage Pro"]
[Equalizador 16 barras coloridas]
[Barra de progresso gradient]
```

### Login Page
```
[Fundo: Show/DJ/Concert foto]
[Overlay: rgba(15, 61, 86, 0.7)]
[Card glassmorphic centralizado]
  - Logo + "Bem-vindo"
  - Email input
  - Senha input com eye toggle
  - Botão entrar (cyan → purple gradient)
  - Divider "ou entre com"
  - 4 botões OAuth (Google, Discord, Facebook, Apple)
  - Link "Criar conta"
[Subtle glow efeito ao redor do card]
```

### Onboarding (5 Steps)
```
[Fundo: Diferentes fotos de shows/eventos]
[Card com step indicator (barras progressivas)]
[Conteúdo dinâmico conforme step]
[Botões: Anterior (só se step > 1), Próximo]
[Step 5: Confirmação com animação de celebração]
```

### Dashboard
```
[Fundo: Grid em perspectiva + ambient lighting]
[Header com user profile + logout]
[Sidebar com navegação]
[Main content: Cards com dados do usuário]
[Todos com glassmorphism + glow sutil]
```

---

## 10. CORES ESPECÍFICAS PARA USAR

```
Primary Cyan:      #00D9FF  (rgb: 0, 217, 255)
Primary Purple:    #A64AFF  (rgb: 166, 74, 255)
Primary Magenta:   #FF006E  (rgb: 255, 0, 110)
Accent Gold:       #FFB700  (rgb: 255, 183, 0)
Success Green:     #39FF14  (rgb: 57, 255, 20)
Warning Orange:    #FF6B35  (rgb: 255, 107, 53)

Dark BG:           #0A1428  (rgb: 10, 20, 40)
Card BG:           #1B2A3E  (rgb: 27, 42, 62)
Muted Text:        #6B7280  (rgb: 107, 114, 128)
Light Text:        #E5E7EB  (rgb: 229, 231, 235)
```

---

## 11. PRÓXIMOS PASSOS

1. **Coletar referências visuais** → Salvar imagens Unsplash
2. **Criar componentes Tailwind** → Button, Card, Input com estilos
3. **Implementar backgrounds** → URLs reais Unsplash
4. **Testar animações** → Framer Motion com efeitos
5. **Validar com usuário** → Ajustar cores/efeitos conforme feedback
6. **Implementar no código** → Aplicar CSS e componentes
7. **Dashboard design** → Layouts de dados e gráficos

---

**Próximo**: Quer que eu comece a implementar essa paleta no código? Ou prefere refinar mais algo aqui primeiro? 🎨
