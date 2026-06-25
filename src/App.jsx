import { useEffect, useMemo, useState } from "react";
import distributors from "./data/distributors.json";
import "./styles.css";

const columns = [
  { key: "sno", label: "SNO", compact: true },
  { key: "industry", label: "Industry" },
  { key: "companyName", label: "Company" },
  { key: "websiteUrl", label: "Website" },
  { key: "description", label: "Description", wide: true },
  { key: "contactNumber", label: "Contact" },
  { key: "emailId", label: "Email" },
  { key: "cityOfCompany", label: "City" },
  { key: "stateRegion", label: "State" },
  { key: "country", label: "Country" },
  { key: "timezone", label: "Timezone" },
  { key: "yearFounded", label: "Founded" },
  { key: "noOfEmployees", label: "Employees" },
  { key: "annualRevenue", label: "Revenue" },
  { key: "fbCompanyPage", label: "Facebook" },
  { key: "linkedInCompanyPage", label: "LinkedIn" },
  { key: "twitter", label: "Twitter" },
  { key: "postalCode", label: "Postal" },
  { key: "streetAddress", label: "Street Address" },
];

const defaultVisible = new Set([
  "sno",
  "industry",
  "companyName",
  "websiteUrl",
  "description",
  "contactNumber",
  "emailId",
  "cityOfCompany",
  "stateRegion",
  "country",
  "yearFounded",
]);

function uniqueValues(rows, key) {
  return [...new Set(rows.map((row) => String(row[key] || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function hasValue(value) {
  return String(value || "").trim().length > 0;
}

function getYearRange(rows) {
  const years = rows.map((r) => parseNumber(r.yearFounded)).filter((n) => n && n > 1500);
  return {
    min: years.length ? Math.min(...years) : "",
    max: years.length ? Math.max(...years) : "",
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(rows) {
  const csvColumns = columns.filter((col) => col.key !== "websiteLink");
  const content = [
    csvColumns.map((col) => csvEscape(col.label)).join(","),
    ...rows.map((row) => csvColumns.map((col) => csvEscape(row[col.key])).join(",")),
  ].join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "filtered-distributors.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function normalizeUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.startsWith("http") ? text : `https://${text}`;
}

function StatCard({ label, value, helper }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function MobileRecordCard({ row, onCopy }) {
  const location = [row.cityOfCompany, row.stateRegion, row.country].filter(Boolean).join(", ");
  const website = normalizeUrl(row.websiteLink || row.websiteUrl);
  const linkedIn = normalizeUrl(row.linkedInCompanyPage);
  const facebook = normalizeUrl(row.fbCompanyPage);

  return (
    <article className="record-card">
      <div className="record-card-head">
        <div>
          <span className="record-id">#{row.sno || "—"}</span>
          <h3>{row.companyName || "Unnamed Company"}</h3>
        </div>
        <span className="industry-badge">{row.industry || "Unknown"}</span>
      </div>

      {row.description && <p className="record-desc">{row.description}</p>}

      <dl className="record-meta">
        <div>
          <dt>Location</dt>
          <dd>{location || "—"}</dd>
        </div>
        <div>
          <dt>Founded</dt>
          <dd>{row.yearFounded || "—"}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>
            <button className="copyable" onClick={() => onCopy(row.contactNumber)}>
              {row.contactNumber || "—"}
            </button>
          </dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{row.emailId ? <a href={`mailto:${row.emailId}`}>{row.emailId}</a> : "—"}</dd>
        </div>
      </dl>

      <div className="record-actions">
        {website && (
          <a className="action-link" href={website} target="_blank" rel="noreferrer">
            Website
          </a>
        )}
        {linkedIn && (
          <a className="action-link" href={linkedIn} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        )}
        {facebook && (
          <a className="action-link" href={facebook} target="_blank" rel="noreferrer">
            Facebook
          </a>
        )}
      </div>
    </article>
  );
}

function App() {
  const allRows = distributors;
  const yearRange = useMemo(() => getYearRange(allRows), [allRows]);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("");
  const [contactFilter, setContactFilter] = useState("all");
  const [emailFilter, setEmailFilter] = useState("all");
  const [socialFilter, setSocialFilter] = useState("all");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [employeesMin, setEmployeesMin] = useState("");
  const [employeesMax, setEmployeesMax] = useState("");
  const [revenueMin, setRevenueMin] = useState("");
  const [revenueMax, setRevenueMax] = useState("");
  const [sortKey, setSortKey] = useState("sno");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisible);

  useEffect(() => {
    document.body.classList.toggle("drawer-open", showFilterDrawer);

    function handleEscape(event) {
      if (event.key === "Escape") setShowFilterDrawer(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.classList.remove("drawer-open");
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showFilterDrawer]);

  const industries = useMemo(() => uniqueValues(allRows, "industry"), [allRows]);
  const countries = useMemo(() => uniqueValues(allRows, "country"), [allRows]);
  const states = useMemo(() => uniqueValues(allRows, "stateRegion"), [allRows]);
  const cities = useMemo(() => uniqueValues(allRows, "cityOfCompany"), [allRows]);
  const timezones = useMemo(() => uniqueValues(allRows, "timezone"), [allRows]);

  const activeFilterCount = [
    query,
    industry,
    country,
    stateRegion,
    city,
    timezone,
    contactFilter !== "all" ? contactFilter : "",
    emailFilter !== "all" ? emailFilter : "",
    socialFilter !== "all" ? socialFilter : "",
    yearMin,
    yearMax,
    employeesMin,
    employeesMax,
    revenueMin,
    revenueMax,
  ].filter(Boolean).length;

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const textKeys = columns.map((col) => col.key).concat(["linkedInBio", "websiteLink"]);

    const result = allRows.filter((row) => {
      if (q) {
        const haystack = textKeys.map((key) => row[key] || "").join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (industry && row.industry !== industry) return false;
      if (country && row.country !== country) return false;
      if (stateRegion && row.stateRegion !== stateRegion) return false;
      if (city && row.cityOfCompany !== city) return false;
      if (timezone && row.timezone !== timezone) return false;

      if (contactFilter === "with" && !hasValue(row.contactNumber)) return false;
      if (contactFilter === "without" && hasValue(row.contactNumber)) return false;

      if (emailFilter === "with" && !hasValue(row.emailId)) return false;
      if (emailFilter === "without" && hasValue(row.emailId)) return false;

      const hasSocial = hasValue(row.fbCompanyPage) || hasValue(row.linkedInCompanyPage) || hasValue(row.twitter);
      if (socialFilter === "with" && !hasSocial) return false;
      if (socialFilter === "without" && hasSocial) return false;

      const year = parseNumber(row.yearFounded);
      if (yearMin && (!year || year < Number(yearMin))) return false;
      if (yearMax && (!year || year > Number(yearMax))) return false;

      const employees = parseNumber(row.noOfEmployees);
      if (employeesMin && (!employees || employees < Number(employeesMin))) return false;
      if (employeesMax && (!employees || employees > Number(employeesMax))) return false;

      const revenue = parseNumber(row.annualRevenue);
      if (revenueMin && (!revenue || revenue < Number(revenueMin))) return false;
      if (revenueMax && (!revenue || revenue > Number(revenueMax))) return false;

      return true;
    });

    result.sort((a, b) => {
      const aNumber = parseNumber(a[sortKey]);
      const bNumber = parseNumber(b[sortKey]);
      let comparison = 0;
      if (aNumber !== null && bNumber !== null) {
        comparison = aNumber - bNumber;
      } else {
        comparison = String(a[sortKey] || "").localeCompare(String(b[sortKey] || ""), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    allRows,
    query,
    industry,
    country,
    stateRegion,
    city,
    timezone,
    contactFilter,
    emailFilter,
    socialFilter,
    yearMin,
    yearMax,
    employeesMin,
    employeesMax,
    revenueMin,
    revenueMax,
    sortKey,
    sortDirection,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(() => {
    return {
      total: allRows.length,
      visible: filteredRows.length,
      industries: uniqueValues(allRows, "industry").length,
      withWebsites: allRows.filter((row) => hasValue(row.websiteUrl)).length,
      withEmails: allRows.filter((row) => hasValue(row.emailId)).length,
      withContacts: allRows.filter((row) => hasValue(row.contactNumber)).length,
    };
  }, [allRows, filteredRows.length]);

  const topIndustries = useMemo(() => {
    const counts = new Map();
    filteredRows.forEach((row) => counts.set(row.industry || "Unknown", (counts.get(row.industry || "Unknown") || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filteredRows]);

  function resetFilters() {
    setQuery("");
    setIndustry("");
    setCountry("");
    setStateRegion("");
    setCity("");
    setTimezone("");
    setContactFilter("all");
    setEmailFilter("all");
    setSocialFilter("all");
    setYearMin("");
    setYearMax("");
    setEmployeesMin("");
    setEmployeesMax("");
    setRevenueMin("");
    setRevenueMax("");
    setPage(1);
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(1);
  }

  function toggleColumn(key) {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function copyText(text) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">React Distributor Directory</span>
          <h1>Amazon Wholesale Distributors</h1>
          <p>
            A clean responsive dashboard for searching, filtering, inspecting, and exporting distributor records converted from your Excel sheet.
          </p>
          <div className="hero-actions">
            <button onClick={() => downloadCsv(filteredRows)} className="primary-btn">Export Filtered CSV</button>
            <button onClick={resetFilters} className="ghost-btn">Reset Filters</button>
          </div>
        </div>
        <div className="hero-panel">
          <strong>{stats.visible.toLocaleString()}</strong>
          <span>matching records</span>
          <small>out of {stats.total.toLocaleString()} total rows</small>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Total Rows" value={stats.total.toLocaleString()} helper="Imported from Excel" />
        <StatCard label="Industries" value={stats.industries.toLocaleString()} helper="Unique categories" />
        <StatCard label="With Websites" value={stats.withWebsites.toLocaleString()} helper="Website URL present" />
        <StatCard label="With Emails" value={stats.withEmails.toLocaleString()} helper="Email field present" />
        <StatCard label="With Contacts" value={stats.withContacts.toLocaleString()} helper="Phone field present" />
      </section>

      <div className="filter-launch-bar">
        <div className="filter-launch-copy">
          <strong>Find the right distributor faster</strong>
          <span>Open the side filter menu to narrow results by industry, location, contact, year, employees, revenue, and columns.</span>
        </div>
        <div className="filter-launch-actions">
          <button className="primary-btn" onClick={() => setShowFilterDrawer(true)}>
            {`Open Filters${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
          </button>
          <button className="ghost-btn light" onClick={resetFilters}>Reset</button>
        </div>
      </div>

      <div
        className={`filter-backdrop ${showFilterDrawer ? "show" : ""}`}
        onClick={() => setShowFilterDrawer(false)}
        aria-hidden="true"
      />

      <main className="workspace">
        <aside
          className={`filter-card filter-drawer ${showFilterDrawer ? "filters-open" : ""}`}
          aria-hidden={!showFilterDrawer}
        >
          <div className="section-head drawer-head">
            <div>
              <h2>Filters</h2>
              <p>Use quick and advanced filters together.</p>
            </div>
            <div className="filter-head-actions">
              <button className="tiny-btn" onClick={() => setShowAdvanced((value) => !value)}>
                {showAdvanced ? "Hide Advanced" : "Show Advanced"}
              </button>
              <button className="close-btn" onClick={() => setShowFilterDrawer(false)} aria-label="Close filters">×</button>
            </div>
          </div>

          <Field label="Global Search">
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="company, website, email, city..." />
          </Field>

          <div className="two-col">
            <Field label="Industry">
              <select value={industry} onChange={(e) => { setIndustry(e.target.value); setPage(1); }}>
                <option value="">All Industries</option>
                {industries.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Country">
              <select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }}>
                <option value="">All Countries</option>
                {countries.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
          </div>

          {showAdvanced && (
            <>
              <div className="two-col">
                <Field label="State / Region">
                  <select value={stateRegion} onChange={(e) => { setStateRegion(e.target.value); setPage(1); }}>
                    <option value="">All States</option>
                    {states.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="City">
                  <select value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }}>
                    <option value="">All Cities</option>
                    {cities.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Timezone">
                <select value={timezone} onChange={(e) => { setTimezone(e.target.value); setPage(1); }}>
                  <option value="">All Timezones</option>
                  {timezones.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>

              <div className="three-col">
                <Field label="Contact">
                  <select value={contactFilter} onChange={(e) => { setContactFilter(e.target.value); setPage(1); }}>
                    <option value="all">All</option>
                    <option value="with">With Contact</option>
                    <option value="without">Without Contact</option>
                  </select>
                </Field>
                <Field label="Email">
                  <select value={emailFilter} onChange={(e) => { setEmailFilter(e.target.value); setPage(1); }}>
                    <option value="all">All</option>
                    <option value="with">With Email</option>
                    <option value="without">Without Email</option>
                  </select>
                </Field>
                <Field label="Social">
                  <select value={socialFilter} onChange={(e) => { setSocialFilter(e.target.value); setPage(1); }}>
                    <option value="all">All</option>
                    <option value="with">With Social</option>
                    <option value="without">Without Social</option>
                  </select>
                </Field>
              </div>

              <div className="two-col">
                <Field label="Founded From">
                  <input type="number" min="1500" placeholder={yearRange.min || "min"} value={yearMin} onChange={(e) => { setYearMin(e.target.value); setPage(1); }} />
                </Field>
                <Field label="Founded To">
                  <input type="number" min="1500" placeholder={yearRange.max || "max"} value={yearMax} onChange={(e) => { setYearMax(e.target.value); setPage(1); }} />
                </Field>
              </div>

              <div className="two-col">
                <Field label="Employees Min">
                  <input type="number" min="0" value={employeesMin} onChange={(e) => { setEmployeesMin(e.target.value); setPage(1); }} />
                </Field>
                <Field label="Employees Max">
                  <input type="number" min="0" value={employeesMax} onChange={(e) => { setEmployeesMax(e.target.value); setPage(1); }} />
                </Field>
              </div>

              <div className="two-col">
                <Field label="Revenue Min">
                  <input type="number" min="0" value={revenueMin} onChange={(e) => { setRevenueMin(e.target.value); setPage(1); }} />
                </Field>
                <Field label="Revenue Max">
                  <input type="number" min="0" value={revenueMax} onChange={(e) => { setRevenueMax(e.target.value); setPage(1); }} />
                </Field>
              </div>
            </>
          )}

          <div className="section-head compact">
            <h3>Visible Columns</h3>
          </div>
          <div className="column-list">
            {columns.map((col) => (
              <label key={col.key} className="check-row">
                <input type="checkbox" checked={visibleColumns.has(col.key)} onChange={() => toggleColumn(col.key)} />
                <span>{col.label}</span>
              </label>
            ))}
          </div>

          <div className="drawer-footer">
            <button className="ghost-btn light" onClick={resetFilters}>Reset All</button>
            <button className="primary-btn solid" onClick={() => setShowFilterDrawer(false)}>Show Results</button>
          </div>
        </aside>

        <section className="table-card">
          <div className="table-toolbar">
            <div>
              <h2>Distributor Records</h2>
              <p>{filteredRows.length.toLocaleString()} result(s), page {safePage} of {totalPages}</p>
            </div>
            <div className="toolbar-controls">
              <label>
                Rows
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {[10, 25, 50, 100, 250].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <button className="ghost-btn small" onClick={() => downloadCsv(filteredRows)}>Export</button>
            </div>
          </div>

          <div className="industry-summary">
            {topIndustries.map(([name, count]) => (
              <Pill key={name}>{name}: {count.toLocaleString()}</Pill>
            ))}
          </div>

          <div className="mobile-results">
            {paginatedRows.map((row) => (
              <MobileRecordCard key={`${row.sno}-${row.companyName}-card`} row={row} onCopy={copyText} />
            ))}
            {paginatedRows.length === 0 && <div className="empty-state">No records found. Try removing some filters.</div>}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.filter((col) => visibleColumns.has(col.key)).map((col) => (
                    <th key={col.key} className={col.wide ? "wide" : col.compact ? "compact" : ""}>
                      <button onClick={() => handleSort(col.key)}>
                        {col.label}
                        {sortKey === col.key && <span>{sortDirection === "asc" ? " ↑" : " ↓"}</span>}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={`${row.sno}-${row.companyName}`}>
                    {columns.filter((col) => visibleColumns.has(col.key)).map((col) => {
                      const value = row[col.key];
                      if (col.key === "websiteUrl" && value) {
                        return <td key={col.key}><a href={normalizeUrl(row.websiteLink || value)} target="_blank" rel="noreferrer">{value}</a></td>;
                      }
                      if (col.key === "emailId" && value && String(value).includes("@")) {
                        return <td key={col.key}><a href={`mailto:${value}`}>{value}</a></td>;
                      }
                      if (["fbCompanyPage", "linkedInCompanyPage"].includes(col.key) && value) {
                        return <td key={col.key}><a href={normalizeUrl(value)} target="_blank" rel="noreferrer">Open</a></td>;
                      }
                      if (col.key === "contactNumber") {
                        return <td key={col.key}><button className="copyable" onClick={() => copyText(value)}>{value || "—"}</button></td>;
                      }
                      return <td key={col.key}>{value || "—"}</td>;
                    })}
                  </tr>
                ))}
                {paginatedRows.length === 0 && (
                  <tr>
                    <td colSpan={visibleColumns.size || 1} className="empty-state">No records found. Try removing some filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={safePage <= 1} onClick={() => setPage(1)}>First</button>
            <button disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <span>Page {safePage} / {totalPages}</span>
            <button disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
            <button disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>Last</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
