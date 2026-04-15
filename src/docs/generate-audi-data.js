/**
 * generate-audi-data.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Run: node src/docs/generate-audi-data.js
 *
 * Generates all 5 Audi JSON data files:
 *   • src/data/clients/audi/dealerships.json
 *   • src/data/clients/audi/overview.json
 *   • src/data/clients/audi/claim-phase-timings.json
 *   • src/data/clients/audi/payment-transactions.json
 *   • src/data/clients/audi/contracts.json
 *
 * Mirrors the VW data layer conventions documented in AUDI_CONTEXT.md.
 * Edit the CONFIGURATION section below to customize the output.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── OUTPUT PATHS ──────────────────────────────────────────────────────────────
const OUT = path.join(__dirname, '../data/clients/audi');

// ══════════════════════════════════════════════════════════════════════════════
//  CONFIGURATION — edit this section to customise the Audi dataset
// ══════════════════════════════════════════════════════════════════════════════

// ── DEALERSHIPS ───────────────────────────────────────────────────────────────
const DEALERSHIPS = [
  // Northeast (3)
  { code: '501001', name: 'Audi Manhattan',              city: 'New York',      state: 'NY', area: 'Northeast',     region: 'Tri-State',   active: true },
  { code: '501042', name: 'Audi Paramus',                city: 'Paramus',       state: 'NJ', area: 'Northeast',     region: 'Mid-Atlantic', active: true },
  { code: '501088', name: 'Audi Summit',                 city: 'Summit',        state: 'NJ', area: 'Northeast',     region: 'Mid-Atlantic', active: true },
  // Southeast (2)
  { code: '502011', name: 'Audi Fort Lauderdale',        city: 'Fort Lauderdale', state: 'FL', area: 'Southeast',   region: 'Florida',     active: true },
  { code: '502065', name: 'Audi Atlanta',                city: 'Atlanta',       state: 'GA', area: 'Southeast',     region: 'Georgia',     active: true },
  // Midwest (2)
  { code: '503019', name: 'Audi Chicago',                city: 'Chicago',       state: 'IL', area: 'Midwest',       region: 'Great Lakes', active: true },
  { code: '503077', name: 'Audi Minneapolis',            city: 'Minneapolis',   state: 'MN', area: 'Midwest',       region: 'Upper Midwest', active: true },
  // West (2)
  { code: '504031', name: 'Audi Beverly Hills',          city: 'Beverly Hills', state: 'CA', area: 'West',          region: 'Pacific',     active: true },
  { code: '504092', name: 'Audi Seattle',                city: 'Seattle',       state: 'WA', area: 'West',          region: 'Pacific NW',  active: true },
  // South Central (1)
  { code: '505008', name: 'Audi Dallas',                 city: 'Dallas',        state: 'TX', area: 'South Central', region: 'Texas',       active: true },
];

// ── FUND TYPE MIX per dealer (Media : Hard : Events proportions) ──────────────
// Adjust to create meaningful variation across areas/dealers
const DEALER_MIX = {
  '501001': [0.62, 0.25, 0.13],  // Manhattan — urban, balanced
  '501042': [0.78, 0.14, 0.08],  // Paramus — media-heavy
  '501088': [0.80, 0.12, 0.08],  // Summit — media-heavy NE
  '502011': [0.74, 0.17, 0.09],  // Fort Lauderdale — media-oriented
  '502065': [0.68, 0.20, 0.12],  // Atlanta — balanced SE
  '503019': [0.50, 0.32, 0.18],  // Chicago — hard-cost heavy
  '503077': [0.54, 0.28, 0.18],  // Minneapolis — hard-cost heavy
  '504031': [0.48, 0.22, 0.30],  // Beverly Hills — events-heavy (luxury)
  '504092': [0.52, 0.20, 0.28],  // Seattle — events-heavy
  '505008': [0.66, 0.22, 0.12],  // Dallas — media/balanced
};

// ── DEALER submission speed multiplier (× monthly baseline) ──────────────────
const DEALER_SPEED = {
  '501001': 1.15,  // Manhattan — very fast
  '501042': 1.05,
  '501088': 0.90,
  '502011': 1.10,
  '502065': 0.95,
  '503019': 0.80,  // Chicago — slow
  '503077': 0.88,
  '504031': 1.12,
  '504092': 1.00,
  '505008': 1.08,
};

// ── BASE MONTHLY ACCRUAL per dealer (total across 3 fund types, USD) ─────────
// Audi ~70% of VW scale
const DEALER_BASE_ACCRUAL = {
  '501001': 22000,  // flagship Manhattan
  '501042': 16000,
  '501088': 14000,
  '502011': 15500,
  '502065': 13000,
  '503019': 11500,
  '503077': 10500,
  '504031': 18000,  // luxury Beverly Hills
  '504092': 14500,
  '505008': 15000,
};

// ── MONTHLY SUBMIT RATIO (submitted / accrued) ────────────────────────────────
// Burst months (>1.0) create negative difference bars + high utilization periods
const MONTH_SUBMIT = {
  '2025-01': 0.09,
  '2025-02': 0.11,
  '2025-03': 0.26,
  '2025-04': 1.22,  // BURST — Q1 backlog
  '2025-05': 0.17,
  '2025-06': 0.21,
  '2025-07': 1.16,  // BURST — H1 catch-up
  '2025-08': 0.19,
  '2025-09': 0.27,
  '2025-10': 1.28,  // BURST — Q3 close
  '2025-11': 1.09,  // BURST — year-end rush
  '2025-12': 0.33,
  '2026-01': 0.08,
  '2026-02': 0.13,
  '2026-03': 0.23,
  '2026-04': 0.31,
};

// ── FUND TYPE TIME VARIATION (multiplier per period) ─────────────────────────
// Creates different pie chart shapes for different date range selections
const TIME_FACTOR = {
  //          [mediaMult, hardMult, eventsMult]
  '2025-01': [1.70, 0.45, 0.25],  // Media-heavy early year
  '2025-02': [1.65, 0.50, 0.28],
  '2025-03': [1.55, 0.55, 0.32],
  '2025-04': [1.40, 0.65, 0.45],
  '2025-05': [1.20, 0.80, 0.65],
  '2025-06': [1.05, 0.95, 0.85],
  '2025-07': [0.95, 1.05, 1.00],  // Balanced H2
  '2025-08': [0.90, 1.10, 1.05],
  '2025-09': [0.85, 1.15, 1.10],
  '2025-10': [0.75, 1.20, 1.20],
  '2025-11': [0.65, 1.30, 1.30],
  '2025-12': [0.55, 1.45, 1.35],  // Hard/Events heavy end year
  '2026-01': [0.40, 1.85, 2.20],  // New cycle: Events dominates
  '2026-02': [0.45, 1.75, 2.10],
  '2026-03': [0.50, 1.65, 2.00],
  '2026-04': [0.55, 1.50, 2.30],  // Events surge April
};

const FUND_TYPES = ['AoA - Media Costs', 'AoA - Hard Costs', 'AoA - Events'];
const MONTHS = Object.keys(MONTH_SUBMIT).sort();

// ── CLAIM PHASE TIMINGS config per dealer (days ranges) ──────────────────────
const PHASE_PROFILE = {
  '501001': { p1: [12, 18], p2: [7, 11], p3: [4, 7]  },  // fast
  '501042': { p1: [14, 20], p2: [8, 12], p3: [5, 8]  },
  '501088': { p1: [15, 22], p2: [9, 13], p3: [5, 9]  },
  '502011': { p1: [13, 19], p2: [8, 12], p3: [5, 8]  },
  '502065': { p1: [16, 24], p2: [9, 14], p3: [6, 10] },
  '503019': { p1: [20, 30], p2: [12, 18], p3: [8, 12] }, // slow
  '503077': { p1: [18, 28], p2: [11, 16], p3: [7, 11] },
  '504031': { p1: [12, 17], p2: [7, 10], p3: [4, 7]  },  // fast luxury
  '504092': { p1: [14, 21], p2: [8, 13], p3: [5, 9]  },
  '505008': { p1: [13, 20], p2: [8, 12], p3: [5, 8]  },
};

// ══════════════════════════════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════════════════════════════
function rndInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function rndFloat(base, jitter = 0.12) {
  return base * (1 + (Math.random() * 2 - 1) * jitter);
}

// ══════════════════════════════════════════════════════════════════════════════
//  1. DEALERSHIPS
// ══════════════════════════════════════════════════════════════════════════════
function buildDealerships() {
  return DEALERSHIPS;
}

// ══════════════════════════════════════════════════════════════════════════════
//  2. OVERVIEW (main dataset)
// ══════════════════════════════════════════════════════════════════════════════
function buildOverview() {
  const records = [];

  DEALERSHIPS.forEach(dealer => {
    const mix   = DEALER_MIX[dealer.code];
    const speed = DEALER_SPEED[dealer.code];
    const base  = DEALER_BASE_ACCRUAL[dealer.code];

    MONTHS.forEach(month => {
      const tf    = TIME_FACTOR[month];
      const sr    = MONTH_SUBMIT[month] * speed;
      const total = Math.round(rndFloat(base, 0.10));

      FUND_TYPES.forEach((ft, idx) => {
        const frac    = mix[idx];
        const factor  = tf[idx];
        const accrued = Math.max(100, Math.round(total * frac * factor));

        const submitted  = Math.round(accrued * sr);
        const paid       = Math.min(Math.round(submitted * 0.91), Math.round(accrued * 0.84));
        const approved   = Math.round(paid * 1.015);
        const pending    = Math.max(0, submitted - approved);
        const expiring   = Math.round(accrued * 0.038);
        const preApp     = rndInt(1, 4);
        const claims     = rndInt(3, 9);

        records.push({
          month,
          dealershipCode: dealer.code,
          area:           dealer.area,
          fundType:       ft,
          accrued,
          submitted,
          approved,
          paid,
          pending,
          expiringThisMonth: expiring,
          preApprovalsCount: preApp,
          claimsCount:       claims,
        });
      });
    });
  });

  return records.sort((a, b) => a.month.localeCompare(b.month) || a.dealershipCode.localeCompare(b.dealershipCode));
}

// ══════════════════════════════════════════════════════════════════════════════
//  3. CLAIM PHASE TIMINGS
// ══════════════════════════════════════════════════════════════════════════════
function buildClaimPhaseTimings() {
  const records = [];
  let seq = 1;

  // Distribute claims across months (3-5 per dealer, spread across 2025-2026)
  const CLAIM_MONTHS = {
    '501001': ['2025-03', '2025-07', '2025-11', '2026-03'],
    '501042': ['2025-04', '2025-08', '2025-12'],
    '501088': ['2025-02', '2025-06', '2025-10', '2026-02'],
    '502011': ['2025-03', '2025-07', '2025-11'],
    '502065': ['2025-05', '2025-09', '2026-01'],
    '503019': ['2025-02', '2025-06', '2025-10', '2026-02'],
    '503077': ['2025-04', '2025-08', '2025-12'],
    '504031': ['2025-03', '2025-07', '2025-11', '2026-03'],
    '504092': ['2025-05', '2025-09', '2026-01'],
    '505008': ['2025-04', '2025-08', '2025-12', '2026-04'],
  };

  DEALERSHIPS.forEach(dealer => {
    const profile = PHASE_PROFILE[dealer.code];
    const claimMonths = CLAIM_MONTHS[dealer.code] || ['2025-06', '2025-10'];
    const codeShort = dealer.code.slice(-4);

    claimMonths.forEach(month => {
      records.push({
        claimId:        `AFC${codeShort}${String(seq++).padStart(3, '0')}`,
        dealershipCode: dealer.code,
        area:           dealer.area,
        month,
        phase1Days:     rndInt(profile.p1[0], profile.p1[1]),
        phase2Days:     rndInt(profile.p2[0], profile.p2[1]),
        phase3Days:     rndInt(profile.p3[0], profile.p3[1]),
      });
    });
  });

  return records;
}

// ══════════════════════════════════════════════════════════════════════════════
//  4. PAYMENT TRANSACTIONS
// ══════════════════════════════════════════════════════════════════════════════
function buildPaymentTransactions() {
  const records = [];
  let seq = 1;

  const TX_CONFIG = [
    // [dealerCode, month, submitDay, paidDay|null, amount, status]
    ['501001', '2025-10', '10', '22', 14200.00,  'Paid out'],
    ['501001', '2025-12', '05', '18', 9800.00,   'Finished'],
    ['501001', '2026-02', '14', '28', 18500.00,  'Paid out'],
    ['501001', '2026-04', '08', null, 11200.00,  'Pending'],
    ['501042', '2025-09', '15', '28', 8750.00,   'Paid out'],
    ['501042', '2025-11', '20', null, 12300.00,  'Pending'],
    ['501042', '2026-03', '11', '25', 15600.00,  'Paid out'],
    ['501088', '2025-08', '07', '19', 7400.00,   'Finished'],
    ['501088', '2025-11', '22', null, 9100.00,   'Pending'],
    ['501088', '2026-01', '16', '29', 13800.00,  'Paid out'],
    ['501088', '2026-04', '03', null, 10500.00,  'Pending'],
    ['502011', '2025-10', '12', '24', 11900.00,  'Paid out'],
    ['502011', '2025-12', '18', '31', 8600.00,   'Finished'],
    ['502011', '2026-03', '09', '22', 16200.00,  'Paid out'],
    ['502011', '2026-04', '15', null, 7800.00,   'Pending'],
    ['502065', '2025-09', '08', '21', 9300.00,   'Paid out'],
    ['502065', '2026-01', '14', '27', 12700.00,  'Paid out'],
    ['502065', '2026-04', '11', null, 8900.00,   'Pending'],
    ['503019', '2025-11', '25', null, 7200.00,   'Pending'],
    ['503019', '2026-02', '19', '03', 10400.00,  'Paid out'],
    ['503019', '2026-04', '07', null, 6800.00,   'Pending'],
    ['503077', '2025-10', '16', '29', 8100.00,   'Paid out'],
    ['503077', '2026-01', '21', '04', 11300.00,  'Paid out'],
    ['503077', '2026-04', '09', null, 7500.00,   'Pending'],
    ['504031', '2025-09', '11', '23', 19800.00,  'Paid out'],
    ['504031', '2025-11', '17', '30', 14500.00,  'Finished'],
    ['504031', '2026-02', '08', '21', 22100.00,  'Paid out'],
    ['504031', '2026-04', '13', null, 16700.00,  'Pending'],
    ['504092', '2025-10', '14', '27', 12600.00,  'Paid out'],
    ['504092', '2026-01', '19', '02', 15300.00,  'Paid out'],
    ['504092', '2026-04', '06', null, 9400.00,   'Pending'],
    ['505008', '2025-11', '09', '22', 13200.00,  'Paid out'],
    ['505008', '2026-02', '15', '28', 17800.00,  'Paid out'],
    ['505008', '2026-03', '20', null, 8300.00,   'Pending'],
    ['505008', '2026-04', '04', null, 11600.00,  'Pending'],
  ];

  const dealerArea = Object.fromEntries(DEALERSHIPS.map(d => [d.code, d.area]));

  TX_CONFIG.forEach(([code, month, submitDay, paidDay, amount, status]) => {
    const [y, m] = month.split('-');
    const nextMonth = parseInt(m) === 12
      ? `${parseInt(y) + 1}-01`
      : `${y}-${String(parseInt(m) + 1).padStart(2, '0')}`;

    records.push({
      id:             `pmt-${String(seq++).padStart(3, '0')}`,
      dealershipCode: code,
      area:           dealerArea[code],
      month,
      submitDate:     `${month}-${submitDay}`,
      paidDate:       paidDay ? `${paidDay.length === 2 && parseInt(paidDay) < parseInt(submitDay) ? nextMonth : month}-${paidDay}` : null,
      amount,
      status,
    });
  });

  return records.sort((a, b) => b.submitDate.localeCompare(a.submitDate));
}

// ══════════════════════════════════════════════════════════════════════════════
//  5. CONTRACTS
// ══════════════════════════════════════════════════════════════════════════════
function buildContracts() {
  return [
    { id: 'CTR-A001', dealershipCode: null, area: null, value: 52300.00, mediaCost: 32000.00, hardCost: 20300.00, startDate: '2025-01-15', expiresDate: '2026-01-15' },
    { id: 'CTR-A002', dealershipCode: null, area: null, value: 41800.00, mediaCost: 26000.00, hardCost: 15800.00, startDate: '2025-02-15', expiresDate: '2026-02-15' },
    { id: 'CTR-A003', dealershipCode: null, area: null, value: 68400.00, mediaCost: 40000.00, hardCost: 28400.00, startDate: '2025-03-15', expiresDate: '2026-03-15' },
    { id: 'CTR-A004', dealershipCode: null, area: null, value: 35200.00, mediaCost: 22000.00, hardCost: 13200.00, startDate: '2025-04-15', expiresDate: '2026-04-15' },
    { id: 'CTR-A005', dealershipCode: null, area: null, value: 71600.00, mediaCost: 43000.00, hardCost: 28600.00, startDate: '2025-05-15', expiresDate: '2026-05-15' },
    { id: 'CTR-A006', dealershipCode: null, area: null, value: 48900.00, mediaCost: 30000.00, hardCost: 18900.00, startDate: '2025-06-15', expiresDate: '2026-06-15' },
    { id: 'CTR-A007', dealershipCode: null, area: null, value: 63100.00, mediaCost: 38000.00, hardCost: 25100.00, startDate: '2025-07-15', expiresDate: '2026-07-15' },
    { id: 'CTR-A008', dealershipCode: null, area: null, value: 44700.00, mediaCost: 27000.00, hardCost: 17700.00, startDate: '2025-08-15', expiresDate: '2026-08-15' },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
//  WRITE OUTPUT
// ══════════════════════════════════════════════════════════════════════════════
function writeJSON(filename, data) {
  const filepath = path.join(OUT, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ ${filename} — ${Array.isArray(data) ? data.length + ' records' : 'written'}`);
}

console.log('\n🔧 Generating Audi data files...\n');

const dealerships = buildDealerships();
writeJSON('dealerships.json', dealerships);

const overview = buildOverview();
writeJSON('overview.json', overview);

const claimPhase = buildClaimPhaseTimings();
writeJSON('claim-phase-timings.json', claimPhase);

const transactions = buildPaymentTransactions();
writeJSON('payment-transactions.json', transactions);

const contracts = buildContracts();
writeJSON('contracts.json', contracts);

// ── SUMMARY ───────────────────────────────────────────────────────────────────
console.log('\n📊 Summary:');

const months = [...new Set(overview.map(r => r.month))].sort();
console.log(`  overview: ${months.length} months (${months[0]} → ${months[months.length - 1]})`);

// Fund type mix by area
const areas = [...new Set(dealerships.map(d => d.area))];
areas.forEach(area => {
  const recs = overview.filter(r => r.area === area);
  const byType = {};
  recs.forEach(r => { byType[r.fundType] = (byType[r.fundType] || 0) + r.accrued; });
  const total = Object.values(byType).reduce((s, v) => s + v, 0) || 1;
  const pcts = Object.entries(byType).map(([k, v]) => k.split(' - ')[1] + ' ' + Math.round(v / total * 100) + '%').join(' / ');
  console.log(`  ${area}: ${pcts}`);
});

// Utilization by period
function util(from, to) {
  const f = overview.filter(r => {
    const [y, m] = r.month.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d >= from && d <= to;
  });
  const reimb = f.reduce((s, r) => s + r.paid, 0);
  const avail = f.reduce((s, r) => s + Math.max(0, r.accrued - r.submitted), 0);
  const t = reimb + avail || 1;
  return Math.round(avail / t * 100) + '% avail / ' + Math.round(reimb / t * 100) + '% reimb';
}
console.log('\n  Utilization by period (donut chart variation):');
console.log('  H1 2025:', util(new Date(2025, 0, 1), new Date(2025, 5, 30)));
console.log('  Q4 2025:', util(new Date(2025, 9, 1), new Date(2025, 11, 31)));
console.log('  Q1 2026:', util(new Date(2026, 0, 1), new Date(2026, 2, 31)));

// Negative diff months
const neg = months.filter(m => {
  const recs = overview.filter(r => r.month === m);
  const acc = recs.reduce((s, r) => s + r.accrued, 0);
  const sub = recs.reduce((s, r) => s + r.submitted, 0);
  return sub > acc;
});
console.log('\n  Negative diff months (burst):', neg.join(', '));

console.log('\n✅ All Audi data files written to src/data/clients/audi/\n');
console.log('⚠️  NEXT STEP: Update FUND_TO_SPEND and FUND_COLORS in useOverviewData.ts');
console.log('   Add entries for: "AoA - Media Costs", "AoA - Hard Costs", "AoA - Events"\n');
