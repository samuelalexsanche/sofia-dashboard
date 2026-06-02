"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <span style={{ color: d.payload.color, fontWeight: 700 }}>{d.name}</span>
      <span style={{ color: "#6b6880", marginLeft: 8 }}>{d.value} leads</span>
    </div>
  )
}

export function TemperatureDonut({ data = [] }: { data?: Array<{ name: string; value: number; color: string }> }) {
  const total = data.reduce((a, b) => a + b.value, 0)

  return (
    <div className="card" style={{ padding: "22px 24px" }}>
      <div style={{ marginBottom: 16 }}>
        <p className="serif" style={{ fontSize: 18, color: "#ede8de", fontWeight: 600 }}>Temperatura</p>
        <p style={{ fontSize: 12, color: "#4a4760", marginTop: 3 }}>{total} leads activos</p>
      </div>

      {total === 0 ? (
        <div style={{ height: 170, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#3d3b4f" }}>0</p>
          <p style={{ fontSize: 12, color: "#4a4760" }}>Sin leads activos</p>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={74}
                paddingAngle={4} dataKey="value" strokeWidth={0}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#ede8de", letterSpacing: "-0.03em" }}>{total}</span>
            <span style={{ fontSize: 9, color: "#4a4760", letterSpacing: "0.14em", textTransform: "uppercase" }}>leads</span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginTop: 10 }}>
        {data.map(item => (
          <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#6b6880", flex: 1 }}>{item.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#ede8de", fontVariantNumeric: "tabular-nums" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
