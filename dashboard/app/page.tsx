"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { KPICard } from "@/components/KPICard"
import { CallsChart } from "@/components/CallsChart"
import { TemperatureDonut } from "@/components/TemperatureDonut"
import { LeadFunnel } from "@/components/LeadFunnel"
import { RecentCalls } from "@/components/RecentCalls"
import { AgentControls } from "@/components/AgentControls"
import { CostCard } from "@/components/CostCard"
import { Phone, CalendarCheck, TrendingUp, Clock, Users, Zap, RefreshCw } from "lucide-react"

const MODAL_URL     = "https://matterasystems--inmobiliaria-voice-agent-serve.modal.run"
const REFRESH_MS    = 30_000

export default function Dashboard() {
  const [section, setSection]       = useState("overview")
  const [data, setData]             = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await fetch(`${MODAL_URL}/metrics`, { cache: "no-store" })
      if (res.ok) { setData(await res.json()) }
      else { const { demoMetrics } = await import("@/lib/fetchMetrics"); setData(demoMetrics) }
    } catch {
      const { demoMetrics } = await import("@/lib/fetchMetrics"); setData(demoMetrics)
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(() => load(), REFRESH_MS)
    return () => clearInterval(t)
  }, [])

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long"
  })

  const kpis             = data?.kpis             ?? {}
  const llamadasPorDia   = data?.llamadasPorDia   ?? []
  const temperaturaLeads = data?.temperaturaLeads ?? []
  const recentCalls      = data?.recentCalls      ?? []

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080812" }}>
      <Sidebar active={section} onNav={setSection} llamadasHoy={kpis.llamadasHoy ?? 0} />

      <main className="main-content" style={{ flex: 1, overflow: "auto" }}>
        {/* Ambient glow */}
        <div className="fixed pointer-events-none" style={{
          left: 0, top: 0, right: 0, bottom: 0, zIndex: 0,
          background: `radial-gradient(ellipse 60% 35% at 70% -5%, rgba(201,147,58,0.09) 0%, transparent 70%)`,
        }} />

        <div className="page-pad relative" style={{ zIndex: 1 }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span className="dot-live" />
                <span className="label" style={{ color: "#22c55e", letterSpacing: "0.15em" }}>
                  SISTEMA ACTIVO
                </span>
              </div>
              <h1 className="serif header-title" style={{ fontSize: "2.6rem", lineHeight: 1, color: "#ede8de", fontWeight: 600 }}>
                Panel de control
              </h1>
              <p className="header-sub" style={{ color: "#55536a", fontSize: 13, marginTop: 6, textTransform: "capitalize" }}>
                {today}
              </p>
            </div>

            <div className="header-badge" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px",
                background: "linear-gradient(135deg, rgba(201,147,58,0.15), rgba(201,147,58,0.06))",
                border: "1px solid rgba(201,147,58,0.3)", borderRadius: 12,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(201,147,58,0.3), rgba(201,147,58,0.1))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Zap size={14} color="#e8b96d" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#e8b96d" }}>Sofía</p>
                  <p style={{ fontSize: 11, color: "#8a7a55" }}>Inmobiliaria Nuevo</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: 11, color: "#3d3b4f" }}>+1 774 493 0842</p>
                <button
                  onClick={() => load(true)}
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 6, padding: "3px 7px", cursor: "pointer",
                    display: "flex", alignItems: "center",
                  }}
                >
                  <RefreshCw size={11} color="#4a4760"
                    style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile: refresh button inline bajo el título */}
          <style>{`
            @media (max-width: 767px) {
              .header-badge { display: none !important; }
              .mobile-refresh { display: flex !important; }
            }
          `}</style>
          <div className="mobile-refresh" style={{
            display: "none", alignItems: "center", gap: 10, marginTop: 12, marginBottom: 4,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="dot-live" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Agente activo</span>
              <span style={{ fontSize: 11, color: "#3d3b4f" }}>· {kpis.llamadasHoy ?? 0} llamadas hoy</span>
            </div>
            <button
              onClick={() => load(true)}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 6, padding: "4px 8px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, marginLeft: "auto",
              }}
            >
              <RefreshCw size={11} color={refreshing ? "#e8b96d" : "#4a4760"}
                style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              <span style={{ fontSize: 10, color: "#4a4760" }}>Actualizar</span>
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2].map(i => (
                <div key={i} className="kpi-grid">
                  {[1,2,3].map(j => (
                    <div key={j} className="card" style={{ height: 100, opacity: 0.4 }} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* ── KPIs — 6 items, 3 cols desktop / 2 cols mobile ── */}
              <div className="kpi-grid" style={{ marginBottom: 20 }}>
                <KPICard label="Llamadas hoy"    value={kpis.llamadasHoy ?? 0}              icon={<Phone size={14}/>}         delay={0} />
                <KPICard label="Esta semana"      value={kpis.llamadasSemana ?? 0}           icon={<Phone size={14}/>}         delay={1} />
                <KPICard label="Citas agendadas" value={kpis.citasAgendadas ?? 0}            icon={<CalendarCheck size={14}/>} delay={2} accent />
                <KPICard label="Tasa de éxito"   value={`${kpis.tasaExito ?? 0}%`}          icon={<TrendingUp size={14}/>}    delay={3} sub={`${kpis.leadsTotal ?? 0} registradas`} />
                <KPICard label="Duración media"  value={`${kpis.duracionPromedio ?? 0}m`}   icon={<Clock size={14}/>}         delay={4} sub="por llamada" />
                <KPICard label="Leads activos"   value={kpis.leadsActivos ?? 0}             icon={<Users size={14}/>}         delay={5} />
              </div>

              {/* ── Charts ── */}
              <div className="chart-grid" style={{ marginBottom: 12 }}>
                <CallsChart data={llamadasPorDia} />
                <TemperatureDonut data={temperaturaLeads} />
              </div>

              {/* ── Cost ── */}
              <div style={{ marginBottom: 12 }}>
                <CostCard
                  costoSemana={kpis.costoSemana ?? 0}
                  costoLlamada={kpis.costoLlamada ?? 0}
                  data={llamadasPorDia}
                />
              </div>

              {/* ── Funnel + Calls ── */}
              <div className="split-grid" style={{ marginBottom: 12 }}>
                <LeadFunnel total={kpis.llamadasSemana ?? 0} citas={kpis.citasAgendadas ?? 0} />
                <RecentCalls calls={recentCalls} />
              </div>

              {/* ── Agent controls ── */}
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <h2 className="serif" style={{ fontSize: "1.3rem", color: "#ede8de", whiteSpace: "nowrap" }}>
                    Controles del agente
                  </h2>
                  <div style={{
                    height: 1, flex: 1,
                    background: "linear-gradient(90deg, rgba(255,255,255,0.07), transparent)"
                  }} />
                </div>
                <AgentControls />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
