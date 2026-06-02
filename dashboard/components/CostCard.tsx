"use client"

import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts"

interface CostCardProps {
  costoSemana?: number
  costoLlamada?: number
  data?: any[]
}

export function CostCard({ costoSemana = 0, costoLlamada = 0, data = [] }: CostCardProps) {
  const costoMes = +(costoSemana * 4.3).toFixed(2)
  const chartData = data.map(d => ({ d: d.dia, v: +(d.llamadas * (costoLlamada || 0.07) * (d.duracion || 2.9)).toFixed(2) }))

  return (
    <div className="card" style={{
      padding: "18px 24px",
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 220px",
      gap: 24,
      alignItems: "center",
    }}>
      <div>
        <p className="label">Costo esta semana</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
          <span className="text-gradient" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
            ${costoSemana.toFixed(2)}
          </span>
          <span style={{ fontSize: 13, color: "#4a4760" }}>USD</span>
        </div>
      </div>

      <div>
        <p className="label">Por minuto de llamada</p>
        <p style={{ fontSize: 20, fontWeight: 700, color: "#ede8de", marginTop: 8 }}>$0.07</p>
        <p style={{ fontSize: 11, color: "#4a4760", marginTop: 2 }}>tarifa Retell AI</p>
      </div>

      <div>
        <p className="label">Proyección mensual</p>
        <p style={{ fontSize: 20, fontWeight: 700, color: "#ede8de", marginTop: 8 }}>~${costoMes}</p>
        <p style={{ fontSize: 11, color: "#4a4760", marginTop: 2 }}>estimado USD</p>
      </div>

      <div style={{ height: 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9933a" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#c9933a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="#c9933a" strokeWidth={2} fill="url(#cg2)" dot={false} />
            <Tooltip
              contentStyle={{ background: "#111120", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, "USD"]}
              labelFormatter={() => ""}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
