"use client"

import { LayoutDashboard, Phone, Users, Settings, Activity } from "lucide-react"

const nav = [
  { label: "Overview",      icon: LayoutDashboard, id: "overview" },
  { label: "Llamadas",      icon: Phone,           id: "llamadas" },
  { label: "Leads",         icon: Users,           id: "leads"    },
  { label: "Config",        icon: Settings,        id: "config"   },
]

interface SidebarProps {
  active: string
  onNav: (id: string) => void
  llamadasHoy?: number
}

export function Sidebar({ active, onNav, llamadasHoy = 0 }: SidebarProps) {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: "28px 20px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(201,147,58,0.3), rgba(201,147,58,0.08))",
              border: "1px solid rgba(201,147,58,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Activity size={16} color="#e8b96d" />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 17, fontWeight: 600, color: "#ede8de", lineHeight: 1 }}>
                Sofía
              </p>
              <p style={{ fontSize: 9, color: "#4a4760", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 3 }}>
                Inmobiliaria Nuevo
              </p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map(item => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNav(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 9, fontSize: 13, fontWeight: 500,
                  border: isActive ? "1px solid rgba(201,147,58,0.3)" : "1px solid transparent",
                  background: isActive ? "linear-gradient(135deg, rgba(201,147,58,0.14), rgba(201,147,58,0.04))" : "transparent",
                  color: isActive ? "#e8b96d" : "#55536a",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <item.icon size={14} strokeWidth={isActive ? 2.5 : 1.8} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Status */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="dot-live" />
            <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Agente activo</span>
          </div>
          <p style={{ fontSize: 10, color: "#3d3b4f" }}>
            {llamadasHoy} llamada{llamadasHoy !== 1 ? "s" : ""} hoy
          </p>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav className="bottom-nav">
        {nav.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                color={isActive ? "#e8b96d" : "#4a4760"}
              />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
