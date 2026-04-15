# Context: VW Funds App — Audi Data Layer

Este documento foi gerado para passar contexto ao Claude Chat sobre a codebase e o data layer do app VW Funds, com o objetivo de criar a versão Audi.

---

## 1. Visão Geral do Projeto

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Recharts  
**Localização:** `vw-funds-2/src/`  
**Deploy:** Vercel (GitHub: jorgeverlindo/vw-funds)

O app é um **dashboard de gestão de fundos de marketing** para redes de concessionárias. Suporta múltiplos clientes (brands) via `ClientContext`. VW está 100% implementado. Audi tem a estrutura de arquivos criada mas todos os JSONs são arrays vazios — precisa de dados.

---

## 2. Arquitetura Multi-Cliente

### `ClientContext` (`src/app/contexts/ClientContext.tsx`)
```ts
const CLIENTS = { vw: vwConfig, audi: audiConfig };
// Estado inicial: 'vw'
// Troca via: switchClient('audi')
```

### Configuração do cliente Audi (`src/data/clients/audi/client.config.ts`)
```ts
export const audiConfig: ClientConfig = {
  clientId:             'audi',
  brandName:            'Audi',
  shortName:            'Audi',
  primaryColor:         '#BB0A14',
  accentColor:          '#6050E0',
  fundCodePrefix:       'AFC',         // claim IDs: AFC001, AFC002...
  preApprovalCodePrefix:'AFA',
  fundTypes: [
    'AoA - Media Costs',   // equivalente ao DMF - Media Costs do VW
    'AoA - Hard Costs',    // equivalente ao DMF - Hard Costs
    'AoA - Events',        // específico Audi (substituiu DMP - Hard Costs)
  ],
  userLabel: { dealer: 'Dealer', oem: 'AoA' },  // OEM = Audi of America
};
```

### Como os hooks usam o cliente
Todos os 5 hooks em `src/data/access/` fazem o mesmo padrão:
```ts
const { client } = useClient();
const raw = DATA_MAP[client.clientId] ?? [];
```
Isso garante que ao trocar para Audi, todos os gráficos e KPIs automáticamente usam os dados Audi.

---

## 3. Arquivos JSON a Criar para Audi

Estes são os 5 arquivos que precisam ser preenchidos em `src/data/clients/audi/`:

### 3a. `dealerships.json`
**Schema:**
```ts
interface DealershipRecord {
  code: string;      // código único ex: "501001"
  name: string;      // nome da concessionária
  city: string;
  state: string;     // sigla ex: "NJ"
  area: string;      // "Northeast" | "Southeast" | "Midwest" | "West" | "South Central"
  region: string;    // sub-região ex: "Mid-Atlantic"
  active: boolean;
}
```

**Exemplo VW (referência):**
```json
[
  { "code": "408252", "name": "Jack Daniels Volkswagen", "city": "Paramus", "state": "NJ", "area": "Northeast", "region": "Mid-Atlantic", "active": true },
  { "code": "402165", "name": "Volkswagen of Downtown Chicago", "city": "Chicago", "state": "IL", "area": "Midwest", "region": "Great Lakes", "active": true }
]
```

**Para Audi:** criar ~10 concessionárias reais ou fictícias da Audi nos EUA. Distribuir por 4-5 áreas. Códigos numéricos de 6 dígitos começando com "5" (ex: 501001, 502034...).

---

### 3b. `overview.json` ← O MAIS IMPORTANTE

Este é o dataset principal que alimenta todos os KPIs, gráficos de acumulação, pizza de fundos, utilization donut, spend breakdown, etc.

**Schema completo por registro:**
```ts
interface OverviewRecord {
  month: string;              // "2025-01" até "2026-04"
  dealershipCode: string;     // código do dealer
  area: string;               // denormalized — mesmo que dealerships.json
  fundType: string;           // "AoA - Media Costs" | "AoA - Hard Costs" | "AoA - Events"
  accrued: number;            // fundos acumulados este mês (USD)
  submitted: number;          // valor submetido em claims
  approved: number;           // aprovado pelo OEM (≈ submitted * 0.94)
  paid: number;               // pago efetivamente (≈ submitted * 0.91, cap = accrued * 0.84)
  pending: number;            // submitted - approved (não pago ainda)
  expiringThisMonth: number;  // fundos expirando ≈ accrued * 0.038
  preApprovalsCount: number;  // número de pré-aprovações (int, tipicamente 2-5)
  claimsCount: number;        // número de claims (int, tipicamente 4-10)
}
```

**Exemplo de 3 registros (mesmo dealer, mesmo mês, 3 tipos de fundo):**
```json
{ "month": "2025-01", "dealershipCode": "501001", "area": "Northeast", "fundType": "AoA - Media Costs",
  "accrued": 9800, "submitted": 882, "approved": 829, "paid": 803, "pending": 79,
  "expiringThisMonth": 372, "preApprovalsCount": 3, "claimsCount": 5 },
{ "month": "2025-01", "dealershipCode": "501001", "area": "Northeast", "fundType": "AoA - Hard Costs",
  "accrued": 2800, "submitted": 252, "approved": 237, "paid": 229, "pending": 23,
  "expiringThisMonth": 106, "preApprovalsCount": 2, "claimsCount": 4 },
{ "month": "2025-01", "dealershipCode": "501001", "area": "Northeast", "fundType": "AoA - Events",
  "accrued": 1400, "submitted": 126, "approved": 118, "paid": 115, "pending": 11,
  "expiringThisMonth": 53, "preApprovalsCount": 1, "claimsCount": 3 }
```

**Regras de geração (CRÍTICAS para que os gráficos funcionem bem):**

#### Fund lifecycle — variação de utilização por mês
O `submitted/accrued` ratio varia ao longo do ciclo para que o **donut "Fund Utilization"** mostre formas diferentes em períodos diferentes:
```
2025-01: submitRatio = 0.09  → ~89% available (ciclo novo, pouco submetido)
2025-02: 0.11
2025-03: 0.26
2025-04: 1.22  ← BURST (submissão de backlog Q1 — submitted > accrued → barra negativa no gráfico accruals)
2025-05: 0.17
2025-06: 0.21
2025-07: 1.16  ← BURST (catch-up H1)
2025-08: 0.19
2025-09: 0.27
2025-10: 1.28  ← BURST (close Q3)
2025-11: 1.09  ← BURST (year-end rush)
2025-12: 0.33
2026-01: 0.08  → ~91% available (novo ciclo começa)
2026-02: 0.13
2026-03: 0.23
2026-04: 0.31
```
Nos meses de BURST: `submitted > accrued` (claim backlog dos meses anteriores).  
`paid = min(submitted * 0.91, accrued * 0.84)` — cap para paid não exceder accrual.

#### Diversidade por dealer (para que filtrar por dealer/área mude os gráficos)
Cada dealer deve ter um **fund type mix diferente** (redistribuir o total accrued):
- Dealers urbanos NE: mais Media (70%+ AoA-Media)
- Dealers Midwest: mais Hard Costs (45-55% Media, 30%+ Hard)
- Dealers West: mais Events (15-20% Events)
- Alguns dealers: perfil invertido para criar contraste

#### Diversidade de submission speed por dealer
Multiplicador sobre o submitRatio mensal (1.0 = padrão):
- Fast submitters (1.10-1.20): dealers maiores, estabelecidos
- Slow submitters (0.80-0.90): dealers menores, atrasados

#### Escala de accrued por dealer
Audi tem dealers menores que VW. Sugestão de range: $6.000-$25.000/dealer/mês por fundType (VW usou $3.000-$22.000).

**Exemplo de variação real (VW como referência):**
```
Dealer 408252 (Jack Daniels NE, fast):    Media 70% / Hard 20% / DMP 10%
Dealer 402165 (Chicago, Midwest, slow):   Media 48% / Hard 32% / DMP 20%
Dealer 414072 (Denver, West, medium):     Media 44% / Hard 24% / DMP 32%
```

#### Variação por período para o gráfico Funds Pie
O **fund type mix deve variar ao longo do tempo** (para que filtrar por período mude o pie chart):
```
2025 H1: Media-heavy (ex: Media 85%, Hard 10%, Events 5%)
2025 H2: balanced (Media 65%, Hard 25%, Events 10%)
2026 Q1: Events/Hard-heavy (Media 35%, Hard 40%, Events 25%)
```
Para implementar: multiplicar accrued de cada fundType por um fator mensal. Exemplo:
```
H1 2025:  mediaFactor=1.6, hardFactor=0.5, eventsFactor=0.3
H2 2025:  todos=1.0
Q1 2026:  mediaFactor=0.4, hardFactor=1.8, eventsFactor=2.2
Apr 2026: mediaFactor=0.6, hardFactor=1.2, eventsFactor=2.8
```

**Volume total sugerido:** 10 dealers × 3 fundTypes × 16 meses = 480 registros

---

### 3c. `claim-phase-timings.json`

Alimenta: **Time in Claim phase**, **Time in Payment phase**, **Submission Phase Stacked Bar**, **Longest Payment Time** (OEM).

**Schema:**
```ts
interface ClaimPhaseRecord {
  claimId: string;       // "AFC" + dealerCode + sequencial (ex: "AFC501001")
  dealershipCode: string;
  area: string;
  month: string;         // "2025-01" — para date range filter
  phase1Days: number;    // Submission → Pre-Approval (range: 10-30 dias)
  phase2Days: number;    // Pre-Approval → Final Approval (range: 6-18 dias)
  phase3Days: number;    // Final Approval → Payment (range: 4-12 dias)
}
```

**Exemplo:**
```json
{ "claimId": "AFC501001", "dealershipCode": "501001", "area": "Northeast",
  "month": "2025-03", "phase1Days": 16, "phase2Days": 9, "phase3Days": 6 }
```

**Regras:**
- ~3-5 registros por dealer (distribuídos por meses diferentes do mesmo dealer)
- Dealers lentos: phase*Days maiores
- Dealers rápidos: phase*Days menores
- Total: ~40-60 registros para cobrir todos os dealers + meses 2025-01 → 2026-04
- Chart limita automaticamente a top 10 (já implementado no hook)

---

### 3d. `payment-transactions.json`

Alimenta a tabela **Payment Status**.

**Schema:**
```ts
interface PaymentTransaction {
  id: string;            // "pmt-001", "pmt-002"...
  dealershipCode: string;
  area: string;
  month: string;         // "2025-11"
  submitDate: string;    // "2025-11-12" ISO
  paidDate: string|null; // null se Pending
  amount: number;        // USD, ex: 13065.90
  status: 'Paid out' | 'Pending' | 'Finished';
}
```

**Exemplo:**
```json
[
  { "id": "pmt-001", "dealershipCode": "501001", "area": "Northeast",
    "month": "2025-11", "submitDate": "2025-11-12", "paidDate": "2025-11-22",
    "amount": 11200.50, "status": "Paid out" },
  { "id": "pmt-002", "dealershipCode": "502034", "area": "Southeast",
    "month": "2026-02", "submitDate": "2026-02-10", "paidDate": null,
    "amount": 8750.00, "status": "Pending" }
]
```

**Regras:**
- ~4 registros por dealer, distribuídos de 2025 a 2026-04
- Mix de status: ~60% Paid out, 30% Pending, 10% Finished
- Paid out e Finished: têm paidDate; Pending: paidDate = null
- Total: ~40-56 registros

---

### 3e. `contracts.json`

Alimenta o **Budget Forecast Card**.

**Schema:**
```ts
interface ContractRecord {
  id: string;                    // "CTR-001"
  dealershipCode: string|null;   // null = aplica a todos dealers
  area: string|null;             // null = aplica a todas áreas
  value: number;                 // USD total do contrato
  mediaCost: number;             // porção media cost
  hardCost: number;              // porção hard cost
  startDate: string;             // "2025-01-15"
  expiresDate: string;           // "2026-01-15"
}
```

**Exemplo VW (referência):**
```json
{ "id": "CTR-001", "dealershipCode": null, "area": null,
  "value": 59445.21, "mediaCost": 35000.00, "hardCost": 24445.21,
  "startDate": "2025-01-15", "expiresDate": "2026-01-15" }
```

**Regras:** 6-10 contratos anuais escalonados. `value` entre $30K-$80K. `mediaCost + hardCost = value`. Iniciar em meses diferentes de 2025, todos expirando 12 meses depois. Para Audi, a terceira categoria é Events (use hardCost como proxy — o campo é hardCost no schema).

---

## 4. Como os Hooks Usam os Dados

### `useOverviewData` — o hook central
```ts
// Filtra por: dateFrom, dateTo, area, dealershipCode
// Computa:
// - kpis: { currentBalance, availableFunds, approvedYTD, pendingInReview, ... }
// - monthlyChart: [{ month, accruals, submitted, difference }] — accruals vs submitted
// - rooftopChart: top 10 dealers por accrued
// - fundSplitViews: { funds, available, approved, pending, expiring } — para pie charts
// - utilizationData: { available%, reimbursed% } — para donut chart
// - spendBreakdown: por categoria (mapeia fundType → categoria)
```

**IMPORTANTE — mapeamento fundType → spend category (em `useOverviewData.ts`):**
```ts
const FUND_TO_SPEND = {
  'DMF - Media Costs': { category: 'MEDIA - OTHER', color: '#A8A8F8' },
  'DMP - Hard Costs':  { category: 'MEDIA - CPO',   color: '#6050E0' },
  'DMF - Hard Costs':  { category: 'HARD',           color: 'rgba(247, 134, 100, 0.9)' },
};
```
Para Audi, este mapeamento precisará ser atualizado para:
```ts
'AoA - Media Costs': { category: 'MEDIA', color: '#...' },
'AoA - Hard Costs':  { category: 'HARD',  color: '#...' },
'AoA - Events':      { category: 'EVENTS', color: '#...' },
```

**Cores dos fund types para pie chart (em `useOverviewData.ts`):**
```ts
const FUND_COLORS = {
  'DMF - Media Costs': '#6050E0',
  'DMF - Hard Costs':  'rgba(247, 134, 100, 0.9)',
  'DMP - Hard Costs':  '#51B994',
};
// Para Audi: definir cores para 'AoA - Media Costs', 'AoA - Hard Costs', 'AoA - Events'
```

---

## 5. Estrutura de Arquivos Audi (o que criar)

```
src/data/clients/audi/
├── client.config.ts          ✅ já existe (completo)
├── dealerships.json          ❌ array vazio → CRIAR 10 dealers
├── overview.json             ❌ array vazio → CRIAR 480 registros
├── claim-phase-timings.json  ❌ array vazio → CRIAR ~50 registros
├── payment-transactions.json ❌ array vazio → CRIAR ~45 registros
└── contracts.json            ❌ array vazio → CRIAR 8 contratos
```

---

## 6. Modificações Necessárias no Código (além dos dados)

### 6a. `useOverviewData.ts` — atualizar mapeamentos de cores
Adicionar os fund types da Audi nos dois maps:
```ts
const FUND_TO_SPEND = {
  // ... VW entries mantidos ...
  'AoA - Media Costs': { category: 'MEDIA',  color: '#BB0A14' },    // vermelho Audi
  'AoA - Hard Costs':  { category: 'HARD',   color: 'rgba(187, 10, 20, 0.6)' },
  'AoA - Events':      { category: 'EVENTS', color: '#E8E8E8' },
};

const FUND_COLORS = {
  // ... VW entries mantidos ...
  'AoA - Media Costs': '#BB0A14',
  'AoA - Hard Costs':  'rgba(187, 10, 20, 0.6)',
  'AoA - Events':      '#888888',
};
```

### 6b. UI de troca de cliente
Adicionar um seletor de cliente (botão ou toggle) que chame `switchClient('audi')` / `switchClient('vw')`. Pode ser no `TopNavBar` ou no `AppSidebar`. O contexto já está pronto — só falta a UI.

---

## 7. Padrão de Geração dos Dados (algoritmo)

Para gerar o `overview.json` da Audi, o mesmo algoritmo usado no VW funciona:

```js
// Pseudocódigo do script gerador
for (dealer of dealers) {
  for (month of months_2025_01_to_2026_04) {
    const totalAccrued = baseAccrual[dealer] * randomVariation(0.85, 1.15);
    const mix = fundTypeMix[dealer];  // ex: [0.65, 0.25, 0.10] para Media/Hard/Events
    const timeFactor = timeVariation[month];  // ex: mediaFactor, hardFactor, eventsFactor

    for (fundType of ['AoA - Media Costs', 'AoA - Hard Costs', 'AoA - Events']) {
      const accrued = Math.round(totalAccrued * mix[ft] * timeFactor[ft]);
      const sr = submitRatio[month] * dealerSpeed[dealer];
      const submitted = Math.round(accrued * sr);
      const paid = Math.min(Math.round(submitted * 0.91), Math.round(accrued * 0.84));
      // ... resto dos campos
    }
  }
}
```

O script completo de geração está em: `src/docs/generate-audi-data.js`

---

## 8. Referência Rápida — Valores VW para Calibrar Audi

| Métrica | VW (default range Apr'25-Apr'26) |
|---|---|
| Current Balance | ~$1,180,832 |
| Available Funds | ~$896,657 |
| Approved YTD | ~$859,827 |
| Dealers | 14 (5 áreas) |
| Fund types | DMF-Media / DMF-Hard / DMP-Hard |
| Registros overview.json | 672 (14 dealers × 3 types × 16 meses) |
| Burst months | Apr, Jul, Oct, Nov 2025 |

Para Audi: calibrar em ~70% do volume VW (Audi é menor).

---

## 9. Checklist de Implementação

- [ ] Criar `dealerships.json` (10 dealers, 4-5 áreas)
- [ ] Criar `overview.json` (480 registros com lifecycle + diversidade)
- [ ] Criar `claim-phase-timings.json` (~50 registros)
- [ ] Criar `payment-transactions.json` (~45 registros)
- [ ] Criar `contracts.json` (8 contratos)
- [ ] Atualizar `FUND_TO_SPEND` e `FUND_COLORS` em `useOverviewData.ts`
- [ ] Adicionar UI de troca de cliente (TopNavBar ou Sidebar)
- [ ] Testar: `switchClient('audi')` → todos os charts carregam dados Audi

---

_Gerado automaticamente a partir do codebase em 2026-04-15_
