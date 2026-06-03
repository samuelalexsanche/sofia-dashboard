import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { ReactNode } from "react"

interface KPICardProps {
  label: string
  value: string | number
  delta?: number
  sub?: string
  icon: ReactNode
  accent?: boolean
  delay?: number
}

export function KPICard({ label, value, delta, sub, icon, accent, delay = 0 }: KPICardProps) {
  const up = delta !== undefined && delta >= 0

  const delayClass = ["animate-up","animate-up","animate-up-1","animate-up-2","animate-up-3","animate-up-3"][Math.min(delay,5)]

  return (
    <div
      className={cn("card card-hover", delayClass, accent && "glow-gold")}
      style={{
        padding: "clamp(14px, 3vw, 22px) clamp(14px, 3vw, 24px)",
        borderColor: accent ? "rgba(201,147,58,0.4)" : undefined,
        background: accent
          ? "linear-gradient(135deg, rgba(201,147,58,0.10) 0%, #0d0d1a 60%)"
          : undefined,
      }}
    >
      {/* Label + icon */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span className="label">{label}</span>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: accent ? "rgba(201,147,58,0.2)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${accent ? "rgba(201,147,58,0.3)" : "rgba(255,255,255,0.07)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent ? "#e8b96d" : "#6b6880",
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div style={{ marginBottom: 10 }}>
        <span
          className={cn("stat", accent && "text-gradient")}
          style={{ color: accent ? undefined : "#ede8de" }}
        >
          {value}
        </span>
      </div>

      {/* Delta + sub */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {delta !== undefined && (
          <span style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 11, fontWeight: 600,
            color: up ? "#22c55e" : "#ef4444",
            background: up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            padding: "2px 7px",
            borderRadius: 20,
          }}>
            {up ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
            {Math.abs(delta)}%
          </span>
        )}
        {sub && (
          <span style={{ fontSize: 11, color: "#4a4760" }}>{sub}</span>
        )}
      </div>
    </div>
  )
}
