import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine,
} from 'recharts'
import data from './data/adoption.json'
import './App.css'

const COLORS = [
  '#2c5c96', '#3c7a5e', '#a8452e', '#8b8f78', '#c98f2f',
  '#6b4c93', '#1c3d63', '#7a8c3c', '#b8722e', '#4a4e57',
  '#2f9c8c', '#c25c5c', '#5c7ab8', '#9c7a3c', '#4c6b7a',
]

function App() {
  const [selected, setSelected] = useState<string[]>(
    data.sectors.slice(0, 5).map((s) => s.name)
  )

  const trendData = useMemo(
    () =>
      data.years.map((year, i) => {
        const row: Record<string, number | string> = { year }
        data.sectors.forEach((s) => {
          row[s.name] = s.values[i]
        })
        return row
      }),
    []
  )

  const gapData = useMemo(
    () =>
      data.sectors
        .map((s) => ({
          name: s.name,
          adoption2025: s.values[s.values.length - 1],
          gapTo50: 50 - s.values[s.values.length - 1],
        }))
        .sort((a, b) => b.adoption2025 - a.adoption2025),
    []
  )

  function toggleSector(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="kicker">PulseAI — Industry AI Adoption Dashboard</div>
        <h1>How fast is each industry closing the gap to 50% AI adoption?</h1>
        <p className="lede">
          Built on the same dataset and Random Forest model (R² 0.99) from the underlying
          research paper — 15 sectors, 2022–2025.
        </p>
        <a className="paper-link" href="/paper.html">Read the full research paper →</a>
      </header>

      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Orgs using AI in ≥1 function (global)</div>
          <div className="stat-value">88%</div>
          <div className="stat-source">2025 · McKinsey State of AI 2025</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Orgs using GenAI specifically</div>
          <div className="stat-value">79%</div>
          <div className="stat-source">2025 · McKinsey State of AI 2025</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Global corporate AI investment</div>
          <div className="stat-value">$252.3B</div>
          <div className="stat-source">2024 · Stanford AI Index 2025</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">GenAI-specific private investment</div>
          <div className="stat-value">$33.9B</div>
          <div className="stat-source">2024 · Stanford AI Index 2025 (+18.7% YoY)</div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Adoption over time</h2>
          <p>Click a sector below to add or remove it from the chart.</p>
        </div>

        <div className="chip-row">
          {data.sectors.map((s, i) => (
            <button
              key={s.name}
              className={`chip ${selected.includes(s.name) ? 'active' : ''}`}
              style={
                selected.includes(s.name)
                  ? { background: COLORS[i % COLORS.length], borderColor: COLORS[i % COLORS.length] }
                  : {}
              }
              onClick={() => toggleSector(s.name)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={420}>
          <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e4e4de" vertical={false} />
            <XAxis dataKey="year" stroke="#4a4e57" fontSize={13} />
            <YAxis stroke="#4a4e57" fontSize={13} unit="%" />
            <ReferenceLine y={50} stroke="#a8452e" strokeDasharray="4 4" label={{ value: '50% mainstream', fill: '#a8452e', fontSize: 12, position: 'insideTopRight' }} />
            <Tooltip />
            {data.sectors
              .filter((s) => selected.includes(s.name))
              .map((s) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={COLORS[data.sectors.findIndex((x) => x.name === s.name) % COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>2025 adoption &amp; remaining gap</h2>
          <p>Sorted by adoption rate. Sectors past the dashed line have crossed the mainstream mark.</p>
        </div>
        <ResponsiveContainer width="100%" height={480}>
          <BarChart data={gapData} layout="vertical" margin={{ top: 10, right: 40, left: 140, bottom: 10 }}>
            <CartesianGrid stroke="#e4e4de" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} unit="%" stroke="#4a4e57" fontSize={13} />
            <YAxis type="category" dataKey="name" width={140} stroke="#4a4e57" fontSize={13} />
            <ReferenceLine x={50} stroke="#a8452e" strokeDasharray="4 4" />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="adoption2025" radius={[0, 3, 3, 0]}>
              {gapData.map((d) => (
                <Cell key={d.name} fill={d.adoption2025 >= 50 ? '#3c7a5e' : '#a8452e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Model comparison</h2>
          <p>From the research paper — Random Forest is the clear winner once Linear Regression's data leakage is accounted for.</p>
        </div>
        <table className="model-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>MAE</th>
              <th>MSE</th>
              <th>R²</th>
            </tr>
          </thead>
          <tbody>
            {data.modelResults.map((m) => (
              <tr key={m.model} className={m.model === 'Random Forest' ? 'winner' : ''}>
                <td>{m.model}</td>
                <td>{m.mae.toFixed(6)}</td>
                <td>{m.mse.toFixed(6)}</td>
                <td>{m.r2.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="page-footer">
        Static build — data baked in at build time, no backend. Source: PulseAI research paper, 2026.
      </footer>
    </div>
  )
}

export default App
