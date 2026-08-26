"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import {
  SECTION_NAMES,
  SECTIONS,
  type DataRow,
  type Section,
} from "@/lib/data";
import { areaScore, formatScore, overallScore, rowScore } from "@/lib/scores";

type Props =
  | { view: "overview"; section?: never; customer?: string; kpi?: never }
  | { view: "area"; section: Section; customer?: string; kpi?: string };

const SECTION_COLORS: Record<Section, string> = {
  cm: "#f27a35",
  vm: "#eed33f",
  tm: "#b9df8b",
  im: "#2cc18d",
};

const SCORE_SCALE = [
  ["0", "#6f7471"],
  ["1", "#ef5b45"],
  ["2", "#f08a3c"],
  ["3", "#eed33f"],
  ["4", "#b9df8b"],
  ["5", "#2cc18d"],
] as const;

const SCORE_COLORS = Object.fromEntries(SCORE_SCALE) as Record<string, string>;

function displayValue(value: string) {
  const numericText = value.trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(numericText)) return value;
  const numericValue = Number(numericText);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

function useRows() {
  const [rows, setRows] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/data", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unknown data error");
        return payload as DataRow[];
      })
      .then(setRows)
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return { rows, loading, error };
}

function SectionIcon({ section }: { section: Section }) {
  const common = {
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (section === "cm") {
    return (
      <svg {...common}>
        <path d="M24 5 39 11v11c0 10-6.3 17.3-15 21-8.7-3.7-15-11-15-21V11L24 5Z" />
        <path d="m17 24 4.5 4.5L32 18" />
      </svg>
    );
  }
  if (section === "vm") {
    return (
      <svg {...common}>
        <path d="M8 21V9h12M28 9h12v12M40 29v10H28M20 39H8V29" />
        <circle cx="24" cy="24" r="7" />
        <path d="m29 29 7 7M24 19v10M19 24h10" />
      </svg>
    );
  }
  if (section === "tm") {
    return (
      <svg {...common}>
        <path d="M7 10h34v24H7zM16 41h16M24 34v7" />
        <path d="m15 25 5-5 4 4 8-9 3 3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M19 17 14 12a6 6 0 0 0-8 8l7 7a6 6 0 0 0 8 0l3-3" />
      <path d="m29 31 5 5a6 6 0 0 0 8-8l-7-7a6 6 0 0 0-8 0l-3 3M17 31l14-14" />
    </svg>
  );
}

function Arrow({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      className={direction === "left" ? "rotate-180" : ""}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ScoreScale() {
  return (
    <div className="score-scale" aria-label="Returned KPI maturity score scale from zero to five">
      <span className="score-scale__label">KPI maturity score</span>
      <div className="score-scale__ticks">
        {SCORE_SCALE.map(([score, color]) => (
          <span key={score} className="score-scale__tick" style={{ "--tick": color } as CSSProperties}>
            <i />
            {score}
          </span>
        ))}
      </div>
    </div>
  );
}

function Overview({ customer }: { customer?: string }) {
  const { rows, loading, error } = useRows();
  const customers = useMemo(
    () => [...new Set(rows.map((row) => row.customerName))].sort(),
    [rows],
  );
  const selectedCustomer = customer && customers.includes(customer) ? customer : undefined;
  const total = overallScore(rows, selectedCustomer);
  const availableAreas = SECTIONS.filter((section) => areaScore(rows, section, selectedCustomer) !== undefined).length;

  function changeScope(value: string) {
    window.location.href = value ? `/?customer=${encodeURIComponent(value)}` : "/";
  }

  return (
    <main className="shell overview-shell">
      <header className="micro-header">
        <span>Incorta security dashboard</span>
        {!loading && !error ? (
          <label className="entity-filter">
            <span>Scope</span>
            <select value={selectedCustomer ?? ""} onChange={(event) => changeScope(event.target.value)}>
              <option value="">All entities</option>
              {customers.map((entity) => <option key={entity} value={entity}>{entity}</option>)}
            </select>
          </label>
        ) : null}
      </header>

      <Status loading={loading} error={error} />
      {!loading && !error ? (
        <>
          <section className="overview-heading">
            <div>
              <h1>Overall Security Performance</h1>
              <p>{selectedCustomer ? `Entity: ${selectedCustomer}` : "All entities"}</p>
            </div>
            <div className="overall-score" aria-label={`Overall score ${formatScore(total)}`}>
              <strong>{formatScore(total)}</strong>
              <span>{total === undefined ? "No scored areas available" : `${availableAreas} of 4 areas available`}</span>
            </div>
          </section>

          <nav className="management-grid" aria-label="Management areas">
            {SECTIONS.map((section) => {
              const score = areaScore(rows, section, selectedCustomer);
              const href = `/area/${section}${selectedCustomer ? `?customer=${encodeURIComponent(selectedCustomer)}` : ""}`;
              return (
                <Link
                  href={href}
                  key={section}
                  className="management-lane"
                  style={{ "--section": SECTION_COLORS[section] } as CSSProperties}
                >
                  <div className="management-lane__top">
                    <SectionIcon section={section} />
                    <span>{SECTION_NAMES[section]}</span>
                    <Arrow />
                  </div>
                  <i className="management-lane__line" />
                  <strong>{formatScore(score)}</strong>
                  {score === undefined ? <small>No scored data available</small> : selectedCustomer ? <small>Average of available KPIs</small> : null}
                </Link>
              );
            })}
          </nav>

          <footer className="overview-footer">
            <ScoreScale />
          </footer>
        </>
      ) : null}
    </main>
  );
}

function AreaNav({ active, customer, pending = false }: { active: Section; customer?: string; pending?: boolean }) {
  const suffix = customer ? `?customer=${encodeURIComponent(customer)}` : "";
  return (
    <header className="area-nav">
      <Link className="return-link" href={customer ? `/?customer=${encodeURIComponent(customer)}` : "/"}>
        <Arrow direction="left" />
        <span>Overview</span>
      </Link>
      <nav aria-label="Management sections">
        {SECTIONS.map((section) => pending ? (
          <span key={section} aria-disabled="true">{section.toUpperCase()}</span>
        ) : (
          <Link
            key={section}
            href={`/area/${section}${suffix}`}
            aria-current={active === section ? "page" : undefined}
          >
            {section.toUpperCase()}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function Status({ loading, error }: { loading: boolean; error: string }) {
  if (loading) {
    return (
      <div className="status-panel" role="status">
        <i className="loading-line" />
        Loading returned rows…
      </div>
    );
  }
  if (error) {
    return (
      <div className="status-panel status-panel--error" role="alert">
        <strong>Data could not be loaded.</strong>
        <span>{error}</span>
      </div>
    );
  }
  return null;
}

function HeatmapPage({ section, rows }: { section: Section; rows: DataRow[] }) {
  const prefix = section.toUpperCase();
  const sectionRows = useMemo(
    () => rows.filter((row) => row.stats.toUpperCase().startsWith(prefix)),
    [prefix, rows],
  );
  const entities = useMemo(
    () => [...new Set(sectionRows.map((row) => row.customerName))].sort(),
    [sectionRows],
  );
  const codes = useMemo(
    () => [...new Set(sectionRows.map((row) => row.stats))].sort((a, b) => a.localeCompare(b)),
    [sectionRows],
  );
  const total = areaScore(rows, section);

  return (
    <>
      <section className="area-heading">
        <div>
          <h1>{SECTION_NAMES[section]} entity heatmap</h1>
          <p>Returned KPI scores by entity. Select an entity to continue to its exact raw values.</p>
        </div>
        <div className="entity-score">
          <strong>{formatScore(total)}</strong>
          {total === undefined ? <span>No scored entities available</span> : null}
        </div>
      </section>

      <section className="heatmap-field" aria-label={`${SECTION_NAMES[section]} entity selection`}>
        <div className="heatmap-field__header">
          <span>Entities and KPI scores returned for {prefix}</span>
          <span>Available scores only</span>
        </div>
        {entities.length ? (
          <div className="score-matrix" role="table" aria-label={`${prefix} KPI maturity scores`}>
            <div
              className="score-matrix__row score-matrix__row--header"
              role="row"
              style={{ gridTemplateColumns: `minmax(150px, 1.35fr) repeat(${codes.length}, minmax(72px, 1fr))` }}
            >
              <span role="columnheader">Entity</span>
              {codes.map((code) => <span role="columnheader" key={code}>{code}</span>)}
            </div>
            {entities.map((entity) => (
              <div
                className="score-matrix__row"
                role="row"
                key={entity}
                style={{ gridTemplateColumns: `minmax(150px, 1.35fr) repeat(${codes.length}, minmax(72px, 1fr))` }}
              >
                <div className="score-matrix__entity" role="rowheader">
                  <Link href={`/area/${section}?customer=${encodeURIComponent(entity)}`}>
                    <strong>{entity}</strong>
                    <small>View KPIs</small>
                    <Arrow />
                  </Link>
                </div>
                {codes.map((code) => {
                  const score = sectionRows.find((row) => row.customerName === entity && row.stats === code)?.score;
                  return (
                    <span
                      className="score-matrix__cell"
                      data-scored={score ? "true" : "false"}
                      key={code}
                      role="cell"
                      title={score ? `${entity} · ${code} · score ${score} of 5` : `${entity} · ${code} · no score returned`}
                      style={{ "--score-tone": SCORE_COLORS[score ?? ""] ?? "#6f7471" } as CSSProperties}
                    >
                      {score ?? "—"}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-field">
            <span>—</span>
            <strong>No {prefix} entities returned</strong>
            <p>This area will populate from matching Excel rows.</p>
          </div>
        )}
      </section>
      <div className="heatmap-scale"><ScoreScale /></div>
    </>
  );
}

function KpiPage({ section, customer, rows }: { section: Section; customer: string; rows: DataRow[] }) {
  const prefix = section.toUpperCase();
  const kpis = rows
    .filter((row) => row.customerName === customer && row.stats.toUpperCase().startsWith(prefix))
    .sort((a, b) => a.stats.localeCompare(b.stats));
  const total = areaScore(rows, section, customer);
  const scoredKpis = kpis.filter((row) => rowScore(row) !== undefined).length;

  return (
    <>
      <section className="entity-heading">
        <div>
          <h1>{SECTION_NAMES[section]} Management</h1>
          <p>{customer}</p>
        </div>
        <div className="entity-score">
          <strong>{formatScore(total)}</strong>
          <span>{total === undefined ? "No scored KPIs available" : `Average of ${scoredKpis} available KPI${scoredKpis === 1 ? "" : "s"}`}</span>
        </div>
      </section>
      <div className="entity-actions">
        <Link href={`/area/${section}`}><Arrow direction="left" />Choose another entity</Link>
      </div>

      {kpis.length ? (
        <section className="kpi-grid" aria-label={`${prefix} KPIs for ${customer}`}>
          {kpis.map((row) => (
            <Link
              key={row.stats}
              href={`/area/${section}?customer=${encodeURIComponent(customer)}&kpi=${encodeURIComponent(row.stats)}`}
              className="kpi-item"
            >
              <span className="kpi-item__code">{row.stats}</span>
              <span className="kpi-item__score">
                {row.score ? <>Score <b>{row.score} / 5</b></> : "Score not returned"}
              </span>
              <strong>{displayValue(row.value)}</strong>
              <i />
              <small>Open detail</small>
              <Arrow />
            </Link>
          ))}
        </section>
      ) : (
        <div className="empty-kpis">
          <strong>No {prefix} KPI rows returned for {customer}</strong>
          <p>The selected entity is preserved while this management area remains empty.</p>
        </div>
      )}
    </>
  );
}

function Drilldown({ section, customer, kpi, rows }: { section: Section; customer: string; kpi: string; rows: DataRow[] }) {
  const row = rows.find((item) => item.customerName === customer && item.stats === kpi);
  return (
    <>
      <section className="drill-heading">
        <div>
          <h1>{kpi}</h1>
          <p>{customer} · {SECTION_NAMES[section]} Management</p>
        </div>
        <Link href={`/area/${section}?customer=${encodeURIComponent(customer)}`}>
          <Arrow direction="left" />Back to KPIs
        </Link>
      </section>
      <section className="drill-stage">
        <div className="raw-reading">
          <span>Raw Excel value</span>
          <strong>{row?.value ?? "—"}</strong>
          <small>{row ? "Displayed exactly as returned" : "No matching row returned"}</small>
        </div>
        <div className="score-reading">
          <span>Returned KPI score</span>
          <strong>{row?.score ?? "—"}{row?.score ? <small> / 5</small> : null}</strong>
          <small>{row?.score ? "Displayed exactly as returned" : "No score returned"}</small>
        </div>
        <div className="detail-placeholder">
          <span>Detail view reserved</span>
          <strong>Chart or table will be added later</strong>
          <p>No series or supporting values are generated in this version.</p>
        </div>
      </section>
    </>
  );
}

function Area({ section, customer, kpi }: { section: Section; customer?: string; kpi?: string }) {
  const { rows, loading, error } = useRows();

  const returnedCustomers = new Set(rows.map((row) => row.customerName));
  const selectedCustomer = customer && returnedCustomers.has(customer) ? customer : undefined;
  const selectedKpi = selectedCustomer && kpi && rows.some(
    (row) =>
      row.customerName === selectedCustomer &&
      row.stats === kpi &&
      row.stats.toUpperCase().startsWith(section.toUpperCase()),
  ) ? kpi : undefined;

  return (
    <main className="shell area-shell" style={{ "--section": SECTION_COLORS[section] } as CSSProperties}>
      <AreaNav active={section} customer={selectedCustomer} pending={loading || Boolean(error)} />
      <Status loading={loading} error={error} />
      {!loading && !error && selectedKpi && selectedCustomer ? (
        <Drilldown section={section} customer={selectedCustomer} kpi={selectedKpi} rows={rows} />
      ) : !loading && !error && selectedCustomer ? (
        <KpiPage section={section} customer={selectedCustomer} rows={rows} />
      ) : !loading && !error ? (
        <HeatmapPage section={section} rows={rows} />
      ) : null}
    </main>
  );
}

export default function Dashboard(props: Props) {
  if (props.view === "overview") return <Overview customer={props.customer} />;
  return <Area section={props.section} customer={props.customer} kpi={props.kpi} />;
}
