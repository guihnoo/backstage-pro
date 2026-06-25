# Backstage Pro — Roteiro Instagram Stories / Carrossel / Reels

Material em `export/` (PNG 1080×1920) ou preview em `stories.html`.

**Link:** https://backstage-pro-beta.vercel.app

---

## Carrossel (8 slides — ordem sugerida)

| # | Arquivo | Texto na legenda (opcional) |
|---|---------|----------------------------|
| 1 | `01-capa` | Você é técnico de eventos? Conheça o Backstage Pro 🎭 |
| 2 | `02-agenda` | Agenda visual com status de pagamento + Google Calendar |
| 3 | `03-modo-palco` | Modo Palco: check-in GPS, countdown e alertas no dia do show |
| 4 | `04-financeiro` | Meta mensal, pipeline e cobrança sem planilha |
| 5 | `05-clientes` | CRM: empresa/pessoa, histórico de cachês, WhatsApp |
| 6 | `06-ia-mentor` | IA Mentor com contexto dos seus números reais |
| 7 | `07-fechamento` | Horas → despesas → NF-e com IA → PDF de fechamento |
| 8 | `08-cta` | Grátis · PWA · Link na bio |

**Hashtags sugeridas:** `#tecnicoDeSom #iluminacao #fotografiadeeventos #videomaker #dj #eventos #backstage #produtora #tecnicoDeEventos #appparatecnicos`

---

## Stories (sequência 15–30s cada)

Reposte cada PNG como story. Entre slides, use sticker **"Deslize"** ou **"Link"** no último.

1. Capa — pausa 3s no logo
2. Agenda — "Nunca perca um show"
3. Modo Palco — "No dia do evento, tudo na palma"
4. Financeiro — "Sabe quanto falta pra meta?"
5. Clientes — "CRM sem complicação"
6. IA — "Pergunte à IA sobre sua carreira"
7. Fechamento — "Do palco ao pagamento"
8. CTA — sticker de link → vercel.app

---

## Roteiro Reels / vídeo (45–60s)

| Tempo | Visual | Narração / texto na tela |
|-------|--------|--------------------------|
| 0–5s | Capa animada | "Técnico de eventos? Esse app é pra você." |
| 5–12s | Agenda + calendário | "Agenda visual, Google Calendar, status de pagamento em cada show." |
| 12–18s | Modo Palco | "No dia do show: countdown, GPS, alertas." |
| 18–25s | Financeiro | "Meta do mês, a receber, despesas — sem Excel." |
| 25–32s | Clientes | "Clientes, histórico de cachês, cobrança no Zap." |
| 32–40s | IA Mentor | "IA que entende iluminação, som, foto, vídeo…" |
| 40–50s | Fechamento + CTA | "Grátis. Instala como app. Link na bio." |

**Música:** beat eletrônico / festival (sem copyright — usar biblioteca do Instagram ou Epidemic Sound).

**Ferramentas gratuitas:** CapCut, Canva (importar PNGs), InShot.

---

## Como regenerar as imagens

```bash
node marketing/instagram-stories/export-stories.mjs
```

Preview no browser: abrir `marketing/instagram-stories/stories.html`.

---

## Variações por categoria (ideia futura)

Duplicar slides trocando cores no HTML:
- **Áudio:** `#39FF14` + `#00D9FF`
- **Foto:** `#FF6B35` + `#00D9FF`
- **Vídeo:** tons vermelho/cyan do `categoryConfig.js`
