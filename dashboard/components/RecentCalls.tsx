"use client"

import { useState } from "react"
import { Phone, Clock, ChevronDown, ChevronUp } from "lucide-react"

const tempStyle: Record<string, { color: string; bg: string; border: string }> = {
  Hot:  { color: "#f87171", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)"  },
  Warm: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
  Cold: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)" },
}
const resultColor: Record<string, string> = {
  "Agendar cita":       "#22c55e",
  "Enviar informacion": "#e8b96d",
  "No interesado":      "#4a4760",
  "Seguimiento":        "#8b5cf6",
  "—":                  "#4a4760",
}

export function RecentCalls({ calls = [] }: { calls?: any[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (calls.length === 0) {
    return (
      <div className="card" style={{ padding: "22px 24px" }}>
        <p className="serif" style={{ fontSize: 18, color: "#ede8de", fontWeight: 600, marginBottom: 8 }}>
          Llamadas recientes
        </p>
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#4a4760" }}>Sin llamadas registradas aún</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: "22px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <p className="serif" style={{ fontSize: 18, color: "#ede8de", fontWeight: 600 }}>Llamadas recientes</p>
          <p style={{ fontSize: 12, color: "#4a4760", marginTop: 3 }}>Datos reales · Notion + Retell</p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
          background: "rgba(201,147,58,0.12)", border: "1px solid rgba(201,147,58,0.25)", color: "#e8b96d",
        }}>
          {calls.length} llamadas
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {calls.map((call: any) => {
          const isOpen = expanded === call.id
          const temp   = tempStyle[call.temperatura] ?? { color: "#6b6880", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" }

          return (
            <div key={call.id} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <button
                onClick={() => setExpanded(isOpen ? null : call.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", background: "transparent", cursor: "pointer",
                  border: "none", textAlign: "left", transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Phone size={12} color="#4a4760" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#ede8de", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                      {call.nombre}
                    </span>
                    {call.temperatura && call.temperatura !== "—" && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20,
                        color: temp.color, background: temp.bg, border: `1px solid ${temp.border}`,
                        flexShrink: 0,
                      }}>
                        {call.temperatura}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "#4a4760" }}>{call.caller}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4a4760" }}>
                      <Clock size={9} />{call.duracion}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: resultColor[call.resultado] ?? "#6b6880" }}>
                    {call.resultado}
                  </span>
                  <span style={{ fontSize: 10, color: "#3d3b4f" }}>{call.fecha}</span>
                </div>

                {isOpen
                  ? <ChevronUp size={13} color="#4a4760" style={{ flexShrink: 0, marginLeft: 4 }} />
                  : <ChevronDown size={13} color="#4a4760" style={{ flexShrink: 0, marginLeft: 4 }} />
                }
              </button>

              {isOpen && call.resumen && (
                <div style={{
                  padding: "10px 14px 12px", background: "rgba(255,255,255,0.02)",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <p style={{ fontSize: 12, color: "#8b8599", lineHeight: 1.7 }}>{call.resumen}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
