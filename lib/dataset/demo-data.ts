import type { DatasetRow, ParsedDataset } from './types';
import { normalizeRows } from './infer';

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const CATEGORIES = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books'];
const CHANNELS = ['Online', 'Retail', 'Wholesale'];
const REP_TIERS = ['Junior', 'Mid', 'Senior'];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildDemoDataset(): ParsedDataset {
  const rand = seededRand(42);
  const rows: DatasetRow[] = [];
  const startDate = new Date('2024-01-01').getTime();
  const DAY = 86400000;

  for (let i = 0; i < 120; i++) {
    const date = new Date(startDate + i * DAY);
    const region = REGIONS[Math.floor(rand() * REGIONS.length)];
    const category = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
    const channel = CHANNELS[Math.floor(rand() * CHANNELS.length)];
    const tier = REP_TIERS[Math.floor(rand() * REP_TIERS.length)];
    const units = Math.max(1, Math.round(rand() * 90 + 10));
    const unitPrice = Math.round((rand() * 180 + 20) * 100) / 100;
    const revenue = Math.round(units * unitPrice * 100) / 100;
    const discount = rand() < 0.4 ? Math.round(rand() * 25 * 100) / 100 : 0;
    const satisfaction = Math.max(1, Math.min(5, Math.round((rand() * 2 + 3) * 10) / 10));
    const repTier = tier;

    rows.push({
      date: date.toISOString().slice(0, 10),
      region,
      category,
      channel,
      units_sold: units,
      unit_price: unitPrice,
      revenue,
      discount_pct: discount,
      customer_satisfaction: satisfaction,
      rep_tier: repTier,
    });
  }

  rows[7].region = null;
  rows[15].unit_price = null;
  rows[22].customer_satisfaction = null;
  rows[30].category = null;
  rows[45].revenue = null;
  rows[3].units_sold = 520;
  rows[50].revenue = 12500;
  rows[70].units_sold = 480;

  const columns = ['date', 'region', 'category', 'channel', 'units_sold', 'unit_price', 'revenue', 'discount_pct', 'customer_satisfaction', 'rep_tier'];
  const normalized = normalizeRows(rows, columns);

  return {
    name: 'sales_demo_2024',
    rows: normalized,
    columns,
    source: 'demo',
    uploadedAt: Date.now(),
  };
}
