"use client"

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "#111120", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "10px 14px", fontSize: 12, minWidth: 130,
    }}>
      <p style={{ color: "#6b6880", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 3 }}>
          <span style={{ color: p.color, fontSize: 11 }}>{p.name}</span>
          <span style={{ color: "#ede8de", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function CallsChart({ data = [] }: { data?: any[] }) {
  const hasData = data.some(d => d.llamadas > 0)

  return (
    <div className="card" style={{ padding: "22px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p className="serif" style={{ fontSize: 18, color: "#ede8de", fontWeight: 600 }}>Actividad de la semana</p>
          <p style={{ fontSize: 12, color: "#4a4760", marginTop: 3 }}>Llamadas por día · datos reales</p>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(201,147,58,0.6)" }} />
            <span style={{ fontSize: 11, color: "#6b6880" }}>Llamadas</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 13, color: "#4a4760" }}>Sin llamadas registradas esta semana</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(201,147,58,0.85)" />
                <stop offset="100%" stopColor="rgba(201,147,58,0.25)" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="dia" tick={{ fill: "#4a4760", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#4a4760", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.025)" }} />
            <Bar dataKey="llamadas" name="Llamadas" fill="url(#barGold)"
              stroke="rgba(201,147,58,0.5)" strokeWidth={1} radius={[5,5,0,0]} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
