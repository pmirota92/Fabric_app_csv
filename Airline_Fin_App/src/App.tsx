import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  ComposedChart, Area, Line,
  AreaChart,
  BarChart, Bar, Cell, ReferenceLine,
  ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import './App.css';

// ─── Data model ─────────────────────────────────────────────────────────────

export interface Row {
  // dimensions
  quarter: string;
  month: string;
  conflict_phase: string;
  airline: string;
  country: string;
  region: string;
  airline_type: string;
  // measures – raw
  fleet_size: number;
  revenue_usd_m: number;
  fuel_cost_usd_m: number;
  fuel_cost_pct_revenue: number;
  net_profit_usd_m: number;
  profit_margin_pct: number;
  passengers_carried_m: number;
  fuel_hedging_pct: number;
  hedge_savings_usd_m: number;
  brent_crude_usd_barrel: number;
  jet_fuel_usd_barrel: number;
  daily_fuel_consumption_bbl: number;
  quarterly_fuel_bbl: number;
  // measure – derived
  operating_cost_usd_m: number;
}

// ─── CSV hook ────────────────────────────────────────────────────────────────

function parseNum(raw: Record<string, string>, key: string): number {
  return parseFloat(raw[key]?.replace(/[,$% ]/g, '') ?? '') || 0;
}

function useAirlineData() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/airline_financial_impact.csv')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => {
        const result = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        const rows: Row[] = result.data.map(raw => {
          const revenue   = parseNum(raw, 'revenue_usd_m');
          const netProfit = parseNum(raw, 'net_profit_usd_m');
          return {
            quarter:                    raw['quarter'] ?? '',
            month:                      raw['month'] ?? '',
            conflict_phase:             raw['conflict_phase'] ?? '',
            airline:                    raw['airline'] ?? '',
            country:                    raw['country'] ?? '',
            region:                     raw['region'] ?? '',
            airline_type:               raw['airline_type'] ?? '',
            fleet_size:                 parseNum(raw, 'fleet_size'),
            revenue_usd_m:              revenue,
            fuel_cost_usd_m:            parseNum(raw, 'fuel_cost_usd_m'),
            fuel_cost_pct_revenue:      parseNum(raw, 'fuel_cost_pct_revenue'),
            net_profit_usd_m:           netProfit,
            profit_margin_pct:          parseNum(raw, 'profit_margin_pct'),
            passengers_carried_m:       parseNum(raw, 'passengers_carried_m'),
            fuel_hedging_pct:           parseNum(raw, 'fuel_hedging_pct'),
            hedge_savings_usd_m:        parseNum(raw, 'hedge_savings_usd_m'),
            brent_crude_usd_barrel:     parseNum(raw, 'brent_crude_usd_barrel'),
            jet_fuel_usd_barrel:        parseNum(raw, 'jet_fuel_usd_barrel'),
            daily_fuel_consumption_bbl: parseNum(raw, 'daily_fuel_consumption_bbl'),
            quarterly_fuel_bbl:         parseNum(raw, 'quarterly_fuel_bbl'),
            operating_cost_usd_m:       revenue - netProfit,
          };
        });
        setData(rows);
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function fmtM(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) return `${(value / 1000).toFixed(1)}B`;
  return `${value.toFixed(0)}M`;
}

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ─── KPI card ────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: string;
  sentiment?: 'neutral' | 'signed';
  raw: number;
}

function Kpi({ label, value, sentiment = 'neutral', raw }: KpiProps) {
  const color = sentiment === 'signed'
    ? raw >= 0 ? '#107c10' : '#c50f1f'
    : '#242424';
  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Slicer ──────────────────────────────────────────────────────────────────

interface SlicerProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

function Slicer({ label, value, options, onChange }: SlicerProps) {
  return (
    <div className="slicer-item">
      <label className="slicer-label">{label}</label>
      <select className="slicer-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Wszystkie</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Shared chart helpers ────────────────────────────────────────────────────

const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 4, border: '1px solid #e0e0e0' };
const TOOLTIP_LABEL = { fontSize: 12, fontWeight: 600, marginBottom: 4 };
const AXIS_TICK     = { fontSize: 11, fill: '#616161' };

// ─── Chart 1: Revenue vs Operating Cost ──────────────────────────────────────

function RevenueVsCostChart({ filtered }: { filtered: Row[] }) {
  const chartData = useMemo(() => {
    const byQ = new Map<string, { revenue: number; opCost: number }>();
    for (const r of filtered) {
      const p = byQ.get(r.quarter) ?? { revenue: 0, opCost: 0 };
      p.revenue += r.revenue_usd_m;
      p.opCost  += r.operating_cost_usd_m;
      byQ.set(r.quarter, p);
    }
    return [...byQ.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, v]) => ({ quarter, revenue: v.revenue, opCost: v.opCost }));
  }, [filtered]);

  const tickInterval = Math.max(0, Math.floor(chartData.length / 10) - 1);

  return (
    <section className="card">
      <h2>Kiedy koszty pożarły przychody</h2>
      <p className="chart-caption">
        Przestrzeń między polem (przychód) a linią (koszty operacyjne) to wypracowany zysk.
        Dostrzeż, jak COVID-19 niemal ją zamknął — a następnie jak powolne i asymetryczne
        było odbicie w stosunku do skali upadku.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="quarter" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} interval={tickInterval} />
          <YAxis tickFormatter={fmtM} tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            formatter={(val, name) => [fmtM(val as number), name === 'revenue' ? 'Przychód' : 'Koszty operacyjne']}
            labelStyle={TOOLTIP_LABEL} contentStyle={TOOLTIP_STYLE}
          />
          <Legend
            formatter={name => name === 'revenue' ? 'Przychód' : 'Koszty operacyjne'}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#0f6cbd" strokeWidth={2}
            fill="rgba(15,108,189,0.10)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Line type="monotone" dataKey="opCost" stroke="#e8734a" strokeWidth={2}
            dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}

// ─── Chart 2: Net Profit by Airline ──────────────────────────────────────────

function NetProfitByAirlineChart({ filtered }: { filtered: Row[] }) {
  const chartData = useMemo(() => {
    const byA = new Map<string, number>();
    for (const r of filtered) {
      byA.set(r.airline, (byA.get(r.airline) ?? 0) + r.net_profit_usd_m);
    }
    return [...byA.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([airline, netProfit]) => ({ airline, netProfit }));
  }, [filtered]);

  const manyBars = chartData.length > 8;

  return (
    <section className="card">
      <h2>Kto przetrwał, kto poniósł straty</h2>
      <p className="chart-caption">
        Sortowanie malejące ujawnia rozpiętość wyników między przewoźnikami.
        Przełącz slicer Rok na 2020 lub 2021, by zobaczyć, jak pandemia
        przesunęła niemal cały sektor w czerwoną strefę — i które linie
        mimo wszystko utrzymały zysk.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: manyBars ? 56 : 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="airline"
            tick={{ ...AXIS_TICK, ...(manyBars ? { angle: -40, textAnchor: 'end' } : {}) }}
            tickLine={false} axisLine={{ stroke: '#e0e0e0' }} interval={0}
          />
          <YAxis tickFormatter={fmtM} tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            formatter={val => [fmtM(val as number), 'Wynik netto']}
            labelStyle={TOOLTIP_LABEL} contentStyle={TOOLTIP_STYLE}
          />
          <ReferenceLine y={0} stroke="#c8c8c8" strokeWidth={1.5} />
          <Bar dataKey="netProfit" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {chartData.map((e, i) => (
              <Cell key={i} fill={e.netProfit >= 0 ? '#107c10' : '#c50f1f'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

// ─── Chart 3: Stacked cost breakdown (fuel vs other) ─────────────────────────

function CostBreakdownChart({ filtered }: { filtered: Row[] }) {
  const chartData = useMemo(() => {
    const byQ = new Map<string, { fuel: number; other: number }>();
    for (const r of filtered) {
      const p = byQ.get(r.quarter) ?? { fuel: 0, other: 0 };
      p.fuel  += r.fuel_cost_usd_m;
      p.other += Math.max(0, r.operating_cost_usd_m - r.fuel_cost_usd_m);
      byQ.set(r.quarter, p);
    }
    return [...byQ.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, v]) => ({ quarter, fuel: v.fuel, other: v.other }));
  }, [filtered]);

  const tickInterval = Math.max(0, Math.floor(chartData.length / 10) - 1);

  return (
    <section className="card">
      <h2>Anatomia kosztu: paliwo vs reszta</h2>
      <p className="chart-caption">
        Po 2021 roku dolna (paliwowa) warstwa rozrastała się szybciej niż górna —
        skok cen ropy Brent bezpośrednio powiększył koszty tych linii,
        które nie zabezpieczyły się hedgingiem. Obserwuj, jak proporcja
        obu warstw zmienia się między latami kryzysu a latami stabilizacji.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="quarter" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} interval={tickInterval} />
          <YAxis tickFormatter={fmtM} tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            formatter={(val, name) => [fmtM(val as number), name === 'fuel' ? 'Paliwo' : 'Pozostałe koszty']}
            labelStyle={TOOLTIP_LABEL} contentStyle={TOOLTIP_STYLE}
          />
          <Legend
            formatter={name => name === 'fuel' ? 'Paliwo' : 'Pozostałe koszty'}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Area stackId="costs" type="monotone" dataKey="fuel"
            stroke="#e8734a" strokeWidth={1.5} fill="rgba(232,115,74,0.55)"
            dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area stackId="costs" type="monotone" dataKey="other"
            stroke="#6264a7" strokeWidth={1.5} fill="rgba(98,100,167,0.45)"
            dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}

// ─── Chart 4: Bubble — fuel efficiency vs net margin ─────────────────────────

const BUBBLE_COLORS = [
  '#0f6cbd', '#107c10', '#e8734a', '#6264a7', '#c19c00',
  '#038387', '#ca5010', '#8764b8', '#00b7c3', '#498205',
  '#bf7074', '#006f94', '#d13438', '#69797e',
];

interface BubbleDatum {
  airline: string;
  fuelPct: number;
  margin: number;
  passengers: number;
}

function BubbleTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: BubbleDatum }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 4, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, margin: '0 0 6px' }}>{d.airline}</p>
      <p style={{ margin: '2px 0', color: '#616161' }}>
        Udział paliwa: <strong style={{ color: '#242424' }}>{d.fuelPct.toFixed(1)}%</strong>
      </p>
      <p style={{ margin: '2px 0', color: '#616161' }}>
        Marża netto:{' '}
        <strong style={{ color: d.margin >= 0 ? '#107c10' : '#c50f1f' }}>{d.margin.toFixed(1)}%</strong>
      </p>
      <p style={{ margin: '2px 0', color: '#616161' }}>
        Pasażerowie: <strong style={{ color: '#242424' }}>{d.passengers.toFixed(1)}M</strong>
      </p>
    </div>
  );
}

function BubbleChart({ filtered }: { filtered: Row[] }) {
  const chartData = useMemo<BubbleDatum[]>(() => {
    const acc = new Map<string, { rev: number; fuel: number; profit: number; pax: number }>();
    for (const r of filtered) {
      const p = acc.get(r.airline) ?? { rev: 0, fuel: 0, profit: 0, pax: 0 };
      p.rev    += r.revenue_usd_m;
      p.fuel   += r.fuel_cost_usd_m;
      p.profit += r.net_profit_usd_m;
      p.pax    += r.passengers_carried_m;
      acc.set(r.airline, p);
    }
    return [...acc.entries()].map(([airline, v]) => ({
      airline,
      fuelPct:    v.rev > 0 ? (v.fuel   / v.rev) * 100 : 0,
      margin:     v.rev > 0 ? (v.profit / v.rev) * 100 : 0,
      passengers: v.pax,
    }));
  }, [filtered]);

  return (
    <section className="card">
      <h2>Efektywność paliwowa a długoterminowa marża</h2>
      <p className="chart-caption">
        Korelacja jest czytelna: linie kontrolujące udział kosztu paliwa w przychodach
        koncentrują się w górnej lewej ćwiartce — wyższa efektywność paliwowa idzie
        w parze z wyższą marżą. Duże bąble poniżej osi Y to niepokojący wzorzec:
        masowy ruch pasażerski bez rentowności.
        <br />
        <span style={{ fontStyle: 'italic' }}>
          Oś X: udział kosztu paliwa w przychodach (zastępuje niedostępny load factor).
          Wielkość bąbla = łączna liczba pasażerów.
        </span>
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 12, right: 24, bottom: 28, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number" dataKey="fuelPct" name="Udział paliwa" unit="%"
            domain={['auto', 'auto']} tick={AXIS_TICK} tickLine={false}
            axisLine={{ stroke: '#e0e0e0' }}
            label={{ value: 'Udział kosztu paliwa w przychodach (%)', position: 'insideBottom', offset: -18, fontSize: 11, fill: '#616161' }}
          />
          <YAxis
            type="number" dataKey="margin" name="Marża netto" unit="%"
            domain={['auto', 'auto']} tick={AXIS_TICK} tickLine={false}
            axisLine={false} width={52}
          />
          <ZAxis type="number" dataKey="passengers" range={[40, 500]} name="Pasażerowie" />
          <ReferenceLine y={0} stroke="#c8c8c8" strokeWidth={1.5} strokeDasharray="4 3" />
          <Tooltip content={<BubbleTooltip />} />
          <Scatter data={chartData} isAnimationActive={false}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BUBBLE_COLORS[i % BUBBLE_COLORS.length]} fillOpacity={0.75} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </section>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { data, loading, error } = useAirlineData();

  const [year, setYear]       = useState('');
  const [region, setRegion]   = useState('');
  const [airline, setAirline] = useState('');

  const years    = useMemo(() => [...new Set(data.map(r => r.quarter.slice(0, 4)))].sort(), [data]);
  const regions  = useMemo(() => [...new Set(data.map(r => r.region))].sort(),              [data]);
  const airlines = useMemo(() => [...new Set(data.map(r => r.airline))].sort(),             [data]);

  const filtered = useMemo(() => data.filter(r => {
    if (year    && !r.quarter.startsWith(year)) return false;
    if (region  && r.region  !== region)        return false;
    if (airline && r.airline !== airline)       return false;
    return true;
  }), [data, year, region, airline]);

  const hasFilters = year || region || airline;

  const revenue   = useMemo(() => filtered.reduce((s, r) => s + r.revenue_usd_m,       0), [filtered]);
  const opCost    = useMemo(() => filtered.reduce((s, r) => s + r.operating_cost_usd_m, 0), [filtered]);
  const netProfit = useMemo(() => filtered.reduce((s, r) => s + r.net_profit_usd_m,     0), [filtered]);
  const margin    = revenue !== 0 ? (netProfit / revenue) * 100 : 0;

  return (
    <div className="report-root">

      {/* ── Header ── */}
      <header className="report-header">
        <h1>Airline Financial Impact</h1>
        <p className="report-meta">2019–2024 · linie lotnicze · kwartalne dane finansowe</p>
        <p className="thesis">
          Kryzysy lat 2020–2023 ujawniły, że w lotnictwie przetrwanie zależy nie od
          wielkości floty, lecz od dyscypliny kosztowej — a szczególnie od zdolności
          do kontroli wydatków paliwowych w niestabilnym otoczeniu cenowym.
        </p>
      </header>

      {loading && <p className="report-loading">Wczytywanie danych…</p>}
      {error   && <p className="report-error">Błąd: {error}</p>}

      {!loading && !error && (<>

        {/* ── Slicers ── */}
        <div className="slicer-bar">
          <Slicer label="Rok"        value={year}    options={years}    onChange={setYear}    />
          <Slicer label="Region"     value={region}  options={regions}  onChange={setRegion}  />
          <Slicer label="Przewoźnik" value={airline} options={airlines} onChange={setAirline} />
          <div className="slicer-meta">
            <span>{filtered.length.toLocaleString()} / {data.length.toLocaleString()} rekordów</span>
            {hasFilters && (
              <button className="slicer-clear" onClick={() => { setYear(''); setRegion(''); setAirline(''); }}>
                Wyczyść filtry
              </button>
            )}
          </div>
        </div>

        {/* ── KPI ── */}
        <div className="kpi-grid">
          <Kpi label="Przychód"          value={fmtM(revenue)}   raw={revenue}   sentiment="neutral" />
          <Kpi label="Koszty operacyjne" value={fmtM(opCost)}    raw={opCost}    sentiment="neutral" />
          <Kpi label="Wynik netto"       value={fmtM(netProfit)} raw={netProfit} sentiment="signed"  />
          <Kpi label="Marża netto"       value={fmtPct(margin)}  raw={margin}    sentiment="signed"  />
        </div>

        {/* ── Charts — narrative arc: czas → kogo → dlaczego → wniosek ── */}
        <RevenueVsCostChart      filtered={filtered} />
        <NetProfitByAirlineChart filtered={filtered} />
        <CostBreakdownChart      filtered={filtered} />
        <BubbleChart             filtered={filtered} />

      </>)}
    </div>
  );
}
