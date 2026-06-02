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

export default function Dashboard() {
  const [section, setSection]   = useState("overview")
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await fetch("/api/metrics", { cache: "no-store" })
      if (res.ok) {
        setData(await res.json())
      } else {
        // Fallback a datos de demo (GitHub Pages / sin servidor)
        const { demoMetrics } = await import("@/lib/fetchMetrics")
        setData(demoMetrics)
      }
    } catch {
      const { demoMetrics } = await import("@/lib/fetchMetrics")
      setData(demoMetrics)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long"
  })

  const kpis = data?.kpis ?? {}
  const llamadasPorDia   = data?.llamadasPorDia   ?? []
  const temperaturaLeads = data?.temperaturaLeads ?? []
  const recentCalls      = data?.recentCalls      ?? []

  return (
    <div className="flex min-h-screen" style={{ background: "#080812" }}>
      <Sidebar active={section} onNav={setSection} llamadasHoy={kpis.llamadasHoy ?? 0} />

      <main className="flex-1 overflow-auto" style={{ marginLeft: 220 }}>
        {/* Ambient */}
        <div className="fixed pointer-events-none" style={{
          left: 220, top: 0, right: 0, bottom: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse 60% 35% at 70% -5%, rgba(201,147,58,0.10) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 10% 80%, rgba(139,92,246,0.05) 0%, transparent 60%)
          `
        }} />

        <div className="relative z-10 px-10 py-9" style={{ maxWidth: 1280 }}>

          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-10 animate-up">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="dot-live" />
                <span className="label" style={{ color: "#22c55e", letterSpacing: "0.15em" }}>
                  SISTEMA ACTIVO
                </span>
              </div>
              <h1 className="serif" style={{
                fontSize: "3rem", lineHeight: 1, color: "#ede8de",
                fontWeight: 600, letterSpacing: "-0.01em"
              }}>
                Panel de control
              </h1>
              <p style={{ color: "#55536a", fontSize: 14, marginTop: 8, textTransform: "capitalize" }}>
                {today}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px",
                background: "linear-gradient(135deg, rgba(201,147,58,0.15), rgba(201,147,58,0.06))",
                border: "1px solid rgba(201,147,58,0.3)", borderRadius: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "linear-gradient(135deg, rgba(201,147,58,0.3), rgba(201,147,58,0.1))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Zap size={15} color="#e8b96d" />
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
                  title="Actualizar datos"
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

          {/* Loading skeleton */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12
                }}>
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="card" style={{
                      height: 110, animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                      background: "rgba(255,255,255,0.03)"
                    }} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* ── KPIs fila 1 ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 12 }}>
                <KPICard label="Llamadas hoy"    value={kpis.llamadasHoy ?? 0}      icon={<Phone size={14}/>}        delay={0} />
                <KPICard label="Total esta semana" value={kpis.llamadasSemana ?? 0} icon={<Phone size={14}/>}        delay={1} />
                <KPICard label="Leads activos"   value={kpis.leadsActivos ?? 0}     icon={<Users size={14}/>}        delay={2} />
              </div>

              {/* ── KPIs fila 2 ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
                <KPICard label="Citas agendadas" value={kpis.citasAgendadas ?? 0}   icon={<CalendarCheck size={14}/>} delay={3} accent />
                <KPICard label="Tasa de éxito"   value={`${kpis.tasaExito ?? 0}%`}  icon={<TrendingUp size={14}/>}   delay={4}
                  sub={`${kpis.leadsTotal ?? 0} llamadas registradas`} />
                <KPICard label="Duración media"  value={`${kpis.duracionPromedio ?? 0}m`} icon={<Clock size={14}/>}  delay={5}
                  sub="por llamada" />
              </div>

              {/* ── Charts ── */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
                <CallsChart data={llamadasPorDia} />
                <TemperatureDonut data={temperaturaLeads} />
              </div>

              {/* ── Cost ── */}
              <div style={{ marginBottom: 14 }}>
                <CostCard
                  costoSemana={kpis.costoSemana ?? 0}
                  costoLlamada={kpis.costoLlamada ?? 0}
                  data={llamadasPorDia}
                />
              </div>

              {/* ── Funnel + Recent calls ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 14 }}>
                <LeadFunnel
                  total={kpis.llamadasSemana ?? 0}
                  citas={kpis.citasAgendadas ?? 0}
                />
                <RecentCalls calls={recentCalls} />
              </div>

              {/* ── Controls ── */}
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <h2 className="serif" style={{ fontSize: "1.4rem", color: "#ede8de" }}>
                    Controles del agente
                  </h2>
                  <div style={{
                    height: 1, flex: 1,
                    background: "linear-gradient(90deg, rgba(255,255,255,0.07), transparent)"
                  }} />
                  <span style={{ fontSize: 11, color: "#3d3b4f" }}>Sin afectar la lógica de negocio</span>
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
