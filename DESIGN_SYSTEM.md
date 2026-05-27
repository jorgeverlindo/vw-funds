# Constellation UX App — Design System

> Tokens extraídos do codebase (`src/styles/theme.css`, `src/app/reports/tokens.ts`, componentes inline).  
> Use este arquivo como referência canônica para qualquer ilustração, flow diagram ou novo componente.

---

## 1. Brand Identity

### Logo / Mark
O símbolo da marca é formado por **três arcos concêntricos** (outer, middle, inner), com cores e opacidades distintas.

| Arco   | Cor hex  | Opacidade ativa | Opacidade inativa |
|--------|----------|-----------------|-------------------|
| Outer  | `#473bab` | 92%             | 22%               |
| Middle | `#6356e1` | 82%             | 18%               |
| Inner  | `#8c86fc` | 72%             | 12%               |

**Rail (sidebar vertical esquerda)**

| Token               | Valor     |
|---------------------|-----------|
| `--rail-bg`         | `#1E1A42` |
| `--rail-active`     | `#2F2775` |
| `--rail-icon`       | `#ACABFF` |

---

## 2. Color Palette

### 2.1 Brand Purple (primária)

| Nome              | Hex / RGBA                    | Uso                                      |
|-------------------|-------------------------------|------------------------------------------|
| `brand-accent`    | `#473BAB`                     | CTA principal, links ativos, bordas focus |
| `brand-accent-hover` | `#3D3295`                  | Hover de botões primários                |
| `brand-mid`       | `#6356E1`                     | Gradiente, ícones secundários            |
| `brand-light`     | `#8c86fc`                     | Terceiro arco, estados sutis             |
| `brand-pale`      | `#ACABFF`                     | Ícones do rail, texto em fundo escuro    |
| `brand-4`         | `rgba(71,59,171, 0.04)`       | Hover superfície mínimo                  |
| `brand-6`         | `rgba(71,59,171, 0.06)`       | Background de chip selecionado           |
| `brand-8`         | `rgba(71,59,171, 0.08)`       | Background de badge / tag                |
| `brand-12`        | `rgba(71,59,171, 0.12)`       | Border de card selecionado               |
| `brand-14`        | `rgba(71,59,171, 0.14)`       | Hover de item de lista                   |
| `brand-18`        | `rgba(71,59,171, 0.18)`       | Border de upload chip                    |
| `brand-35`        | `rgba(71,59,171, 0.35)`       | Border de card focado                    |
| `brand-secondary` | `rgba(99,86,225, 0.08–0.50)`  | Variante mais luminosa para focus rings  |

**Gradiente primário (botões CTA)**
```
linear-gradient(135deg, #473bab 0%, #6356e1 100%)
linear-gradient(99deg, #473bab 0%, #6356e1 100%)
linear-gradient(99.77deg, #473bab 37.41%, #ACABFF 55.08%)  ← texto hero
```

---

### 2.2 Neutros (escala de texto / UI)

| Nome         | Hex        | Uso                                    |
|--------------|------------|----------------------------------------|
| `ink-900`    | `#1F1D25`  | Texto principal, títulos               |
| `ink-800`    | `#111014`  | Texto máximo contraste                 |
| `ink-600`    | `#686576`  | Texto secundário, labels               |
| `ink-400`    | `#9C99A9`  | Placeholder, texto muted               |
| `ink-200`    | `#C4C1D0`  | Dividers, bordas sutis                 |
| `surface-50` | `#FAFAFB`  | Background de inputs                   |
| `surface-100`| `#F9FAFA`  | Background de dropdowns                |
| `surface-200`| `#F5F4F8`  | Background de chips / rows             |
| `surface-300`| `#F4F5F6`  | Background de accordions               |
| `surface-400`| `#ECEDF0`  | Hover de accordion header              |
| `surface-500`| `#E4E5E9`  | Active de accordion header             |

**Bordas padrão**

| Nome          | Valor                    |
|---------------|--------------------------|
| `border-soft` | `rgba(0,0,0, 0.06)`      |
| `border-base` | `rgba(0,0,0, 0.10)`      |
| `border-mid`  | `rgba(0,0,0, 0.12)`      |
| `border-strong`| `rgba(0,0,0, 0.30)`     |

---

### 2.3 Status Colors

| Estado       | Foreground  | Background soft | Border            |
|--------------|-------------|-----------------|-------------------|
| **Success**  | `#2E9C5E`   | `#E2F4EC`       | `rgba(13,122,95,0.35)` |
| **Error**    | `#D2323F`   | `rgba(210,50,63,0.08)` | `rgba(210,50,63,0.20)` |
| **Warning**  | `#E17613`   | `rgba(225,118,19,0.08)` | — |
| **Info**     | `#0288D1`   | `rgba(2,136,209,0.08)` | — |
| **Purple tag**| `#473BAB`  | `rgba(71,59,171,0.08)` | `rgba(71,59,171,0.18)` |

---

### 2.4 Brand Colors por OEM (offer cards)

| Marca    | Hex        |
|----------|------------|
| Honda    | `#CC0000`  |
| BMW      | `#0066CC`  |
| Audi     | `#BB0A21`  |
| VW       | `#001E50`  |
| Toyota   | `#EB0A1E`  |
| Default  | `#473bab`  |

---

## 3. Typography

### 3.1 Font Families

| Token       | Stack                                                      | Uso                              |
|-------------|------------------------------------------------------------|----------------------------------|
| `Roboto`    | `'Roboto', sans-serif`                                     | Toda a UI do agent pane e cards  |
| `Inter`     | `'Inter', -apple-system, BlinkMacSystemFont, system-ui`   | Corpo de texto, tabelas, reports |
| `Poppins`   | `'Poppins', -apple-system, BlinkMacSystemFont, sans-serif` | Títulos de seção, hero text      |

> **Regra prática**: Roboto é a fonte padrão de toda a área do agente. Inter é usada nos dashboards e relatórios. Poppins aparece nos labels de seção e headings de marketing.

### 3.2 Escala tipográfica (usada nos componentes)

| Tamanho | px  | Uso típico                                      |
|---------|-----|-------------------------------------------------|
| `xs2`   | 7px | Metadados de ad preview, anotações mínimas      |
| `xs1`   | 8px | Timestamps, notas de confiança em extraction    |
| `xs`    | 9px | Labels de grupo em dropdowns                    |
| `sm`    | 10px| Labels uppercase de formulário (`ACCOUNT`, `OEM`) |
| `sm+`   | 10.5px | Subtítulo de template card                  |
| `base`  | 11px | Corpo de card, conteúdo de chip               |
| `base+` | 11.5px | Títulos de card header, chip label           |
| `md`    | 12px | Conteúdo principal de cards, botões de ação   |
| `md+`   | 13px | Botões primários, texto de action bar         |
| `lg`    | 14px | Texto de chat bubble, copy do agente          |
| `xl`    | 16px | Subtítulos de seção, headings de painel       |
| `2xl`   | 18px | Títulos de módulo                             |
| `3xl`   | 20px | Welcome text, hero small                      |
| `4xl`   | 40px | Section title em reports                      |

### 3.3 Font Weights

| Token      | Valor | Uso                               |
|------------|-------|-----------------------------------|
| `regular`  | 400   | Corpo de texto, placeholders      |
| `medium`   | 500   | Subtítulos, botões                |
| `semibold` | 600   | Títulos de card, labels uppercase |
| `bold`     | 700   | Valores numéricos, preços         |

### 3.4 Letter Spacing

| Contexto                    | Valor              |
|-----------------------------|--------------------|
| Labels uppercase de form    | `0.06em`           |
| Labels uppercase micro      | `0.08em`           |
| Títulos hero (Poppins)      | `-0.035em`         |
| Corpo normal                | `0.17px` (aprox)   |
| Botão primário              | `0.46px`           |
| Chips / badges              | `0.3px`            |

---

## 4. Spacing

### 4.1 Escala base

| Token | px  | Uso típico                          |
|-------|-----|-------------------------------------|
| `1`   | 4px | Gap mínimo entre ícone e texto      |
| `2`   | 8px | Padding interno de chip/badge       |
| `3`   | 12px| Padding horizontal de input pequeno |
| `4`   | 16px| Padding de painel lateral           |
| `5`   | 20px| Padding de accordion                |
| `6`   | 24px| Gap entre seções                    |
| `8`   | 32px| Margem de card do agente (ml-[32px])|

### 4.2 Padding de componentes

| Componente              | Padding                        |
|-------------------------|--------------------------------|
| Card do agente          | `px-[14px] py-[12px]`          |
| Card header             | `px-[14px] pt-[10px] pb-[8px]` |
| Card footer             | `px-[14px] pb-[12px]`          |
| Accordion header        | `px-5 py-[11px]` (min-h: 44px) |
| Accordion content       | `px-4 pb-4 pt-1`               |
| Input de formulário     | `px-[10px] py-[7px]`           |
| Botão primário (pill)   | `px-[14–16px] py-[7–8px]`      |
| Chip de status          | `px-[8px] py-[4px]`            |
| Dropdown item           | `px-[10px] py-[6–7px]`         |
| Tooltip                 | `px-[8px] py-[4px]`            |
| Chat bubble (user)      | `px-[12px] py-[10px]`          |
| Auto-apply bar          | `px-[14px] py-[8px]`           |

---

## 5. Border Radius

| Token       | Valor   | Uso                                     |
|-------------|---------|-----------------------------------------|
| `pill`      | `9999px` (rounded-full) | Botões primários, chips, badges |
| `card`      | `14px`  | Cards do agente (principais)            |
| `card-sm`   | `12px`  | Chat bubbles                            |
| `card-xs`   | `10px`  | Dropdowns, menus                        |
| `input`     | `8px`   | Inputs, selects, inline chips           |
| `icon-wrap` | `6px`   | Wrapper de ícone pequeno                |
| `tag`       | `4px`   | Tags de formato de template             |
| `progress`  | `9999px`| Barra de progresso (auto-apply)         |
| `avatar`    | `9999px`| Avatares                                |
| `accordion` | `12px`  | Container de accordion section (`rounded-xl`) |
| `modal`     | `16px`  | Dialogs, modais                         |
| `panel`     | `16px`  | Painel do agente (`rounded-2xl`)        |

---

## 6. Shadows & Elevation

| Nível         | CSS Value                              | Uso                           |
|---------------|----------------------------------------|-------------------------------|
| `card`        | `0 2px 12px rgba(0,0,0,0.06)`         | Cards do agente               |
| `dropdown`    | `0 2px 12px rgba(0,0,0,0.06)` + border| Dropdowns, menus              |
| `dropdown-lg` | `shadow-xl` + border                   | Menus portalizados            |
| `panel`       | `shadow-sm` + `border rgba(0,0,0,0.04)`| Painel lateral do agente     |
| `tooltip`     | `shadow-md`                            | Tooltips                      |
| `modal`       | `shadow-2xl`                           | Modais / dialogs              |
| `none`        | —                                      | Accordion, chips              |

---

## 7. Componentes — Tokens Específicos

### 7.1 Cards do Agente

Todo card de proposta do agente segue este padrão:

```
Container:
  background:    #ffffff
  border:        1px solid rgba(0,0,0,0.10)
  border-radius: 14px
  box-shadow:    0 2px 12px rgba(0,0,0,0.06)
  margin-left:   32px   ← recuo alinhado ao avatar
  margin-top:    4px

Header:
  background:    #fafafa
  border-bottom: 1px solid rgba(0,0,0,0.06)
  padding:       14px top/sides, 10px top, 8px bottom
  font-size:     11.5px
  font-weight:   600
  color:         #473bab  ← para cards de ação
  color:         #686576  ← para cards de review
  icon-wrap:     18×18px, border-radius: 9999px, gradient brand

Content area:
  padding:       14px × 12px
  gap between rows: 10–14px

Footer / action row:
  padding:       14px × 10–12px
  border-top:    1px solid rgba(0,0,0,0.06)
  button:        pill, gradient brand, font-size 12–13px, font-weight 500
```

### 7.2 Chips de Status (ConfirmedChip)

```
background:   rgba(46,156,94, 0.10)   ← verde suave
border:       1px solid rgba(46,156,94, 0.25)
border-radius: 9999px
padding:      4px 10px
color:        #2E9C5E
font-size:    11px
font-weight:  500
icon:         Check (lucide), size 11, strokeWidth 2
```

### 7.3 ProactiveAutoApplyBar

```
Container:
  background:   #f8f7ff        ← roxo muito suave
  border-top:   1px solid rgba(71,59,171, 0.10)
  padding:      8px 14px

Label:
  font-size:    10px
  color:        #686576
  font-family:  Roboto

"Edit manually" button:
  font-size:    10px
  color:        #473bab
  font-weight:  500
  hover:        #6356e1

Progress bar track:
  height:       3px
  background:   rgba(71,59,171, 0.12)
  border-radius: 9999px

Progress bar fill:
  background:   linear-gradient(90deg, #473bab, #6356e1)
  transition:   none (animado via rAF)
```

### 7.4 Chip Seletores (ProactiveQuestionsCard / TaskOwners)

**Estado normal:**
```
background:    #ffffff
border:        1px solid rgba(0,0,0,0.12)
border-radius: 9999px
padding:       5px 10px
color:         #686576
font-size:     11.5px
font-weight:   500
hover border:  #473bab
hover color:   #473bab
```

**Estado selecionado:**
```
background:    #473bab
border:        1px solid #473bab
color:         #ffffff
```

### 7.5 Inputs de Formulário

```
background:    #fafafb
border:        1px solid rgba(0,0,0,0.12)
border-radius: 8px
padding:       7px 10px
font-size:     12px
color:         #1f1d25
font-family:   Roboto

focus:
  border-color: #473bab
  ring:         1px rgba(71,59,171,0.15)

error:
  border-color: #D2323F

placeholder:
  color: #9C99A9
```

### 7.6 Botões

**Primário (CTA pill)**
```
background:    linear-gradient(135deg, #473bab 0%, #6356e1 100%)
border-radius: 9999px
padding:       8px 14–16px
color:         #ffffff
font-size:     12–13px
font-weight:   500
letter-spacing: 0.46px
hover:         opacity 90%
disabled:      opacity 40%, cursor not-allowed
```

**Secundário (ghost)**
```
background:    transparent
border-radius: 9999px
padding:       8px 14px
color:         #686576
hover:         background rgba(0,0,0,0.05)
font-size:     13px
```

**Ação inline (link-style)**
```
background:    transparent
color:         #686576
hover color:   #1f1d25
font-size:     12px
font-weight:   400
icon:          ExternalLink, size 13, strokeWidth 1.75
```

### 7.7 Accordion Section

```
Container:
  background:    #F4F5F6
  border-radius: 12px
  overflow:      hidden

Header (interactive):
  padding:       px-5 py-[11px]
  min-height:    44px
  cursor:        pointer
  hover bg:      #ECEDF0
  active bg:     #E4E5E9
  transition:    colors

Header (null state):
  cursor:        default

Chevron:
  size:          16px
  strokeWidth:   2
  color:         #9C99A9 (text-gray-400)

Title:
  font-size:     14px
  font-weight:   600
  color:         #1f1d25

Count:
  font-size:     13px
  color:         #9C99A9
  font-weight:   400

Expandable content:
  padding:       px-4 pb-4 pt-1
  animation:     height + opacity, 200ms, cubic-bezier(0.4,0,0.2,1)
```

### 7.8 Avatar / AvatarInitials

```
Tamanhos: 14px, 16px, 18px, 20px, 22px, 28px, 32px
Shape:    circle (border-radius: 9999px)
Font:     Roboto, weight 700, uppercase initials
Cores de background por pessoa (definidas em PROJECT_OWNERS):
  Jorge Verlindo:  #473bab
  Luke Theobald:   #0d7a5f
  Jenny Park:      #b45309
  etc.
```

### 7.9 ChannelChip (plataformas)

```
background:    rgba(71,59,171, 0.08)
border:        1px solid rgba(71,59,171, 0.18)
border-radius: 9999px
padding:       3px 8px
color:         #473bab
font-size:     10–11px
font-weight:   500
icon:          14×14px, margin-right 4px
remove btn:    ×, color #9C99A9, hover #dc2626
```

### 7.10 ToolChip (indicador de ferramenta executada)

```
background:    rgba(71,59,171,0.06)
border:        1px solid rgba(71,59,171,0.14)
border-radius: 9999px
padding:       3px 10px
color:         #473bab
font-size:     11px
font-weight:   500
icon:          lucide, size 11
```

---

## 8. Gradientes catalogados

| Nome                  | Value                                                                 | Uso                         |
|-----------------------|-----------------------------------------------------------------------|-----------------------------|
| `brand-cta`           | `linear-gradient(135deg, #473bab 0%, #6356e1 100%)`                 | Botões CTA, header icons    |
| `brand-cta-alt`       | `linear-gradient(99deg, #473bab 0%, #6356e1 100%)`                  | Botões em contexts de card  |
| `brand-text-hero`     | `linear-gradient(99.77deg, #473bab 37.41%, #ACABFF 55.08%)`         | Texto "Welcome, Jorge"      |
| `brand-text-focus`    | `linear-gradient(90deg, #473bab, #ACABFF)`                           | Focus label animado         |
| `auto-apply-bar`      | `linear-gradient(90deg, #473bab, #6356e1)`                           | Barra de progresso proativo |
| `ad-preview-bottom`   | `linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.62) 100%)` | Overlay de offer card     |
| `ad-preview-bg`       | `linear-gradient(145deg, #e9e9e9 0%, #d6d6d6 100%)`                 | Background de ad preview    |
| `rail-bg`             | `#1E1A42` (sólida)                                                   | Sidebar vertical            |

---

## 9. Animações

### 9.1 Transições de UI

| Contexto                  | Duration | Easing                       |
|---------------------------|----------|------------------------------|
| Hover de botão/item       | —        | `transition-colors`          |
| Accordion expand/collapse | 200ms    | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Agent pane slide-in       | 300ms    | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Card fade-in (motion)     | —        | `{ opacity: 0, y: 6 }` → `{ opacity: 1, y: 0 }` |
| Dropdown menu             | 120ms    | `{ opacity: 0, y: 4, scale: 0.97 }` → normal |
| Stagger de offer rows     | 100ms delay entre items, 0.26s por item | easeOut |
| Stagger de template rows  | 100ms delay, 28ms initial delay | easeOut |
| Chevron rotate            | 180ms    | default                      |

### 9.2 Constellation Arc Animation (loading)

Sequência de pulso dos três arcos da marca durante o streaming:
```
outer  → acende (92% opacity)
middle → acende (82%)
inner  → acende (72%)
pausa → tudo apaga
→ acende tudo junto
→ apaga tudo
→ acende tudo
→ apaga tudo
→ wave: outer → middle → inner → apaga
→ acende tudo → apaga → loop (total ~3.8s)
```

### 9.3 Auto-Apply Progress Bar

```
Duração:    2000ms
Método:     requestAnimationFrame (linear, sem easing)
Fill:       linear-gradient(90deg, #473bab, #6356e1)
Width:      0% → 100% em 2s
transition: none (atualizado frame a frame)
```

---

## 10. Layout

### 10.1 Agent Pane

```
width:         400px (flex-none)
height:        100%
background:    #ffffff
border-radius: 16px
border:        1px solid rgba(0,0,0,0.04)
shadow:        shadow-sm
padding:       pt-[12px] px-[16px]
slide-in:      translateX(100%) → translateX(0), 300ms
```

### 10.2 Message list (chat area)

```
margin-left do card do agente: 32px (ml-[32px])
gap entre mensagens:           ~4–8px de mt
avatar do agente:              22×22px, rounded-full
```

### 10.3 Grid de Offer Cards

```
display:               grid
grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))
gap:                   16px
```

### 10.4 Breakpoints (Tailwind default)

| Token | px    |
|-------|-------|
| `sm`  | 640px |
| `md`  | 768px |
| `lg`  | 1024px|
| `xl`  | 1280px|
| `2xl` | 1536px|

---

## 11. Iconografia

**Biblioteca**: [Lucide React](https://lucide.dev)  
**Tamanhos usados**: 9, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24px  
**strokeWidth padrão**: `1.5` (UI geral) / `2` (ações) / `2.5` (estados ativos) / `3` (mínimo em badges)  
**Cor padrão**: `currentColor` (herda do pai)

| Ícone          | Uso                                      |
|----------------|------------------------------------------|
| `ChevronRight` | Accordion fechado                        |
| `ChevronDown`  | Accordion aberto, selects                |
| `ChevronLeft`  | Voltar / fechar painel                   |
| `Plus`         | Novo projeto (header do card setup)      |
| `Check`        | Selecionado, confirmado                  |
| `X`            | Fechar, remover                          |
| `Trash2`       | Deletar offer/template de proposta       |
| `Eye`          | Preview de template                      |
| `ExternalLink` | "Details ↗" no accordion                |
| `Search`       | Search de histórico de threads           |
| `Download`     | Download de asset                        |
| `Share2`       | Compartilhar                             |
| `FileText`     | Arquivo anexado no chat                  |
| `Tag`          | Categoria / tipo de offer                |
| `Copy`         | Copiar texto                             |
| `ThumbsUp/Down`| Feedback de resposta do agente           |

---

## 12. CSS Custom Properties (variáveis globais)

```css
/* Brand */
--brand-accent:       #473BAB;
--brand-accent-hover: #3D3295;
--rail-bg:            #1E1A42;
--rail-active:        #2F2775;
--rail-icon:          #ACABFF;

/* Semantic (light mode) */
--background:         #ffffff;
--foreground:         #111014;
--border:             rgba(0, 0, 0, 0.1);
--input-background:   #f3f3f5;
--muted:              #ececf0;
--muted-foreground:   #717182;
--destructive:        #d4183d;
--radius:             0.625rem;   /* 10px */
--radius-sm:          calc(var(--radius) - 4px);   /* 6px */
--radius-md:          calc(var(--radius) - 2px);   /* 8px */
--radius-lg:          var(--radius);               /* 10px */
--radius-xl:          calc(var(--radius) + 4px);   /* 14px */
```

---

## 13. Resumo rápido — tokens para o FigJam Flow

Para criar o flow diagram do agente, use estes tokens diretamente:

| Elemento do diagram        | Cor fill          | Cor border             | Texto          | Radius |
|----------------------------|-------------------|------------------------|----------------|--------|
| **Nó de decisão (diamond)**| `#F4F5F6`         | `rgba(0,0,0,0.12)`     | `#1F1D25` 12px | 8px    |
| **Card do agente (rect)**  | `#ffffff`         | `rgba(0,0,0,0.10)`     | `#1F1D25` 11.5px| 14px  |
| **Auto-apply (rect)**      | `#f8f7ff`         | `rgba(71,59,171,0.10)` | `#473bab` 10px | 14px   |
| **Fim de flow (circle)**   | gradient brand    | —                      | branco 12px    | 9999px |
| **Seta de continuação**    | `rgba(71,59,171,0.35)` | —                 | `#473bab` 10px | —      |
| **Seta de user confirm**   | `#2E9C5E`         | —                      | `#2E9C5E` 10px | —      |
| **Label de step**          | transparent       | —                      | `#686576` 10px uppercase | — |
| **Badge de scope**         | `rgba(71,59,171,0.08)` | `rgba(71,59,171,0.18)` | `#473bab` 10px | 9999px |
| **Stop node**              | `#F4F5F6`         | `rgba(0,0,0,0.10)`     | `#9C99A9` 11px | 9999px |
