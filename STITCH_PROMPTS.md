# 🎯 Guia: Usando Google AI Studio Stitch para Backstage Pro

## ⚡ Acesso Rápido

**1.** Abra: **https://aistudio.google.com**
**2.** Clique em: **"Build"** (botão azul) → **"Stitch"**
**3.** Cole um dos prompts abaixo
**4.** Clique em "Generate" ou "Create"
**5.** Refine o visual clicando nas partes que quer mudar
**6.** Exporte o código quando estiver satisfeito

---

## 📋 3 Prompts para Login + Onboarding

### ✅ PROMPT 1 — Tela de Login (Cola no Stitch)

```
Create a premium dark mode login screen for a professional mobile/web app called "Backstage Pro" for event industry freelancers (sound engineers, lighting designers, photographers, DJs, event producers).

Visual Requirements:
- Full screen dark background (#0A0E27 base color)
- Split screen layout: 
  * LEFT side: Full-height cinematic photo of real concert backstage with stage lights, fog effects, and performer silhouettes. Apply 40% dark overlay with gradient fading to right
  * RIGHT side: Login form on dark glass card (rgba(255,255,255,0.05) background + backdrop blur 20px + border rgba(255,255,255,0.1))
- Brand heading: "⚡ Backstage Pro" with gradient text from cyan (#00D9FF) to purple (#A64AFF), 32px bold
- Subtitle: "Para quem faz o show acontecer" — muted white, 14px, italic
- OAuth buttons: 
  * Google button with brand colors, glass style, full width, 48px height
  * Discord button with brand colors, glass style, full width, 48px height
- Divider text: "ou entre com email" — muted text with thin horizontal lines on each side
- Input fields:
  * Email input field — dark glass style with subtle border
  * Password input field — dark glass style with subtle border
  * Both should glow on focus with primary cyan color
- Login button: "Entrar" — gradient background from primary to accent color, 48px height, full width, glow shadow effect
- Bottom text: "Não tem conta? Cadastrar" — subtle link in muted color
- Background effects: Animated subtle particle effect (small dots like stage spotlights) moving slowly
- Font: Inter or SF Pro equivalent
- Overall aesthetic: Premium, nightclub energy, like Linear.app or Vercel Dashboard
- Mobile responsive: Should work well on both desktop and mobile screens
```

---

### ✅ PROMPT 2 — Onboarding Step 1: Seleção de Categoria

```
Create a premium onboarding screen for "Backstage Pro" app — Step 1 of 6: Professional category selection.

Visual Requirements:
- Full screen dark background with faint backstage concert image at 15% opacity as texture
- Progress indicator at top: 6 small dots or line segments, step 1 highlighted in primary cyan color
- Main heading: "Qual é sua área?" — 36px bold white text
- Subheading: "O app se adapta completamente à sua profissão" — 14px muted gray text
- Category grid: 2 columns, 5 rows (10 total cards)
- Each category card:
  * Dark glass card style with blur effect and transparent dark background
  * Large emoji icon centered at top (60px size)
  * Category name below emoji — 16px bold white text
  * 2-3 specialty tags below name — 10px text, pill-shaped badges with category-specific color
  * Hover state: Glowing colored border matching category accent color, slight scale increase
  * Selected state: Filled with gradient background of category color, scale 1.03, glowing shadow
  * Smooth transition animations
- Categories with their EXACT colors and emojis:
  * 🎙️ Técnico de Som — accent color #39FF14 (neon green) — tags: Gigs, Estúdio, Ao Vivo
  * 💡 Iluminação — accent color #A64AFF (purple) — tags: Palco, Iluminação, Criatividade
  * 📷 Fotografia — accent color #FF6B35 (orange) — tags: Retratos, Eventos, Produtos
  * 🎬 Vídeo — accent color #FF006E (magenta) — tags: Gravação, Edição, Produção
  * 🎧 DJ — accent color #00D9FF (cyan) — tags: Gigs, Produção, Mixing
  * 📍 Produção — accent color #FFB700 (gold) — tags: Organização, Timeline, Orçamento
  * 🎭 Cenografia — accent color #A64AFF (purple) — tags: Design, Construção, Arte
  * 👔 Hospedagem — accent color #00D9FF (cyan) — tags: Guests, Acomodação, Conforto
  * 🔒 Segurança — accent color #FF3333 (red) — tags: Vigilância, Turnos, Posicionamento
  * 👨 Camarim — accent color #A64AFF (purple) — tags: Makeup, Prep, VIP
- Button at bottom: "Continuar" — gradient from primary to accent, 48px height, full width, disabled until a category is selected
- Overall aesthetic: App Store quality, premium, makes user feel the app was built specifically for their profession
- Mobile responsive: Should display well on all screen sizes
```

---

### ✅ PROMPT 3 — Onboarding Step 2: Confirmação de Categoria com Background Temático

```
Create an onboarding confirmation screen for "Backstage Pro" — Step 2 after selecting "Técnico de Som" category.

Visual Requirements:
- Full-screen background: Real concert/studio photo showing mixing board, stage lights, sound engineer working (20% opacity dark overlay)
- Screen should feel immersive and themed to the sound engineering profession
- Header area:
  * Category emoji + name: "🎙️ Técnico de Som" — large, bold, with primary color neon green (#39FF14)
  * Main heading: "Perfeito! Vamos configurar seu perfil" — 28px white, bold
  * Subheading: "Conte-nos mais sobre sua especialidade" — 14px muted gray
- Content card: Dark glass card in the center (rgba(255,255,255,0.05) + blur + border)
- Multi-select specialties section:
  * Heading: "Suas especialidades:" — 14px, text-muted
  * Specialty options as toggle buttons (can select multiple):
    - Gigs ao vivo
    - Estúdio
    - Teatro
    - Corporativo
    - Casamentos
    - DJ Support
  * Each option: dark glass button, glows with neon green (#39FF14) when selected, smooth transition
- Bottom section:
  * "Próximo" button — full width, gradient primary to accent, 48px
  * Subtle back link: "← Voltar"
- Color scheme throughout: Neon green (#39FF14) and cyan (#00D9FF) as accents
- Animation: Smooth fade-in effect when loading this screen, specialty buttons have hover/click animations
- Overall aesthetic: Cinematic, professional, feels like entering the sound engineering world
- Mobile responsive: Full-screen experience on mobile, properly spaced
```

---

## 🎬 Como o Stitch Funciona

1. **Cole o prompt completo** na caixa de texto
2. **Clique em "Generate"** — Stitch gera o HTML/CSS interativo
3. **Teste no navegador** — você vê o resultado em tempo real
4. **Refine clicando** — clique em qualquer elemento que queira ajustar:
   - "A cor dessa câmara deveria ser mais cyan"
   - "Faz o border brilhar mais"
   - "A fonte da headingdeveria ser maior"
   - "Coloca um blur effect no fundo"
   - Stitch entende e refina automaticamente
5. **Exporte o código** — botão "Export" → escolha React ou HTML+CSS
6. **Compartilhe comigo** — cole o código no chat, eu integro com Supabase

---

## 💡 Dicas para Melhor Resultado

✅ **Seja específico** — cores exatas (#39FF14), tamanhos (36px), margens
✅ **Descreva efeitos** — "glow shadow", "backdrop blur 20px", "smooth transition"
✅ **Mencione inspiração** — "like Linear.app", "Vercel Dashboard quality"
✅ **Refine iterativamente** — não precisa estar perfeito na primeira

---

## 📦 Próximos Passos (Meu Trabalho)

Após você exportar o código do Stitch:

1. ✅ Eu converto HTML → React/JSX com componentes reutilizáveis
2. ✅ Conecta com `authContext.jsx` (OAuth real)
3. ✅ Conecta com `eventCategories.js` (dados das 10 categorias)
4. ✅ Adiciona Framer Motion (animações entre steps)
5. ✅ Salva no Supabase automaticamente
6. ✅ Sistema de CSS variables dinâmicos por categoria

Resultado: Um app com identidade visual premium integrada com dados reais.

---

## 🚀 Comece Agora!

1. Abra: https://aistudio.google.com
2. Clique: Build → Stitch
3. Cole o **PROMPT 1** (Login)
4. Gere e refine
5. Exporte e manda comigo
6. Repete com **PROMPT 2** e **PROMPT 3**

Bora lá! 🎙️⚡
