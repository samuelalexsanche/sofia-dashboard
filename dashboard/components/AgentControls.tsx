"use client"

import { useState } from "react"
import { voices, defaultPromptFragment } from "@/lib/data"
import { MessageSquare, Mic, Sliders, PhoneOutgoing, Save, Check, Play, Loader2 } from "lucide-react"

const tabs = [
  { id: "prompt",   label: "Personalidad",     icon: MessageSquare },
  { id: "voz",      label: "Voz",              icon: Mic           },
  { id: "ajustes",  label: "Ajustes",          icon: Sliders       },
  { id: "outbound", label: "Llamada saliente",  icon: PhoneOutgoing },
]

export function AgentControls() {
  const [activeTab, setActiveTab]     = useState("prompt")
  const [prompt, setPrompt]           = useState(defaultPromptFragment)
  const [voice, setVoice]             = useState("cartesia-Sofia")
  const [creativity, setCreativity]   = useState(0.7)
  const [speed, setSpeed]             = useState(1.05)
  const [sensitivity, setSensitivity] = useState(0.8)
  const [saved, setSaved]             = useState(false)
  const [phone, setPhone]             = useState("")
  const [calling, setCalling]         = useState(false)
  const [callDone, setCallDone]       = useState(false)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  const handleCall = async () => {
    if (!phone.trim()) return
    setCalling(true)
    await new Promise(r => setTimeout(r, 2200))
    setCalling(false); setCallDone(true)
    setTimeout(() => setCallDone(false), 3000)
  }

  return (
    <div className="card">
      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, padding: 8,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.01)",
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? "active" : ""}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: activeTab === tab.id ? "1px solid rgba(201,147,58,0.3)" : "1px solid transparent",
              background: activeTab === tab.id
                ? "linear-gradient(135deg, rgba(201,147,58,0.15), rgba(201,147,58,0.05))"
                : "transparent",
              color: activeTab === tab.id ? "#e8b96d" : "#55536a",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              if (activeTab !== tab.id) {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"
                ;(e.currentTarget as HTMLButtonElement).style.color = "#ede8de"
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== tab.id) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent"
                ;(e.currentTarget as HTMLButtonElement).style.color = "#55536a"
              }
            }}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 28px" }}>

        {/* ── PROMPT ── */}
        {activeTab === "prompt" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p className="serif" style={{ fontSize: 16, color: "#ede8de", marginBottom: 4 }}>
                Personalidad de Sofía
              </p>
              <p style={{ fontSize: 12, color: "#4a4760" }}>
                Define cómo se presenta. Los cambios aplican en la próxima llamada.
              </p>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={5}
              style={{
                width: "100%", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                padding: "14px 16px", fontSize: 13, color: "#ede8de",
                outline: "none", resize: "none", lineHeight: 1.7,
                fontFamily: "var(--font-inter)",
                transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(201,147,58,0.4)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn saved={saved} onSave={handleSave} />
            </div>
          </div>
        )}

        {/* ── VOZ ── */}
        {activeTab === "voz" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p className="serif" style={{ fontSize: 16, color: "#ede8de", marginBottom: 4 }}>Voz del agente</p>
              <p style={{ fontSize: 12, color: "#4a4760" }}>Selecciona el acento de Sofía.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {voices.map(v => {
                const sel = voice === v.id
                return (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "13px 16px", borderRadius: 10, fontSize: 13,
                      border: sel ? "1px solid rgba(201,147,58,0.35)" : "1px solid rgba(255,255,255,0.07)",
                      background: sel
                        ? "linear-gradient(135deg, rgba(201,147,58,0.12), rgba(201,147,58,0.04))"
                        : "rgba(255,255,255,0.02)",
                      color: sel ? "#e8b96d" : "#8b8599",
                      cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        border: sel ? "2px solid #e8b96d" : "2px solid #3d3b4f",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {sel && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#e8b96d" }} />}
                      </div>
                      <span style={{ fontWeight: sel ? 600 : 400 }}>{v.label}</span>
                    </div>
                    {sel && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8a7a55" }}>
                        <Play size={10} fill="#8a7a55" />
                        activa
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn saved={saved} onSave={handleSave} />
            </div>
          </div>
        )}

        {/* ── AJUSTES ── */}
        {activeTab === "ajustes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <p className="serif" style={{ fontSize: 16, color: "#ede8de", marginBottom: 4 }}>Comportamiento</p>
              <p style={{ fontSize: 12, color: "#4a4760" }}>Afina cómo responde Sofía en la conversación.</p>
            </div>
            <SliderField label="Creatividad" desc="Qué tan variadas son las respuestas"
              value={creativity} min={0} max={1} step={0.05}
              fmt={v => `${Math.round(v*100)}%`} onChange={setCreativity} />
            <SliderField label="Velocidad de habla" desc="Ritmo de la voz"
              value={speed} min={0.7} max={1.5} step={0.05}
              fmt={v => `${v.toFixed(2)}×`} onChange={setSpeed} />
            <SliderField label="Sensibilidad a interrupciones" desc="Facilidad para ser interrumpida"
              value={sensitivity} min={0} max={1} step={0.1}
              fmt={v => `${Math.round(v*100)}%`} onChange={setSensitivity} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn saved={saved} onSave={handleSave} />
            </div>
          </div>
        )}

        {/* ── OUTBOUND ── */}
        {activeTab === "outbound" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <p className="serif" style={{ fontSize: 16, color: "#ede8de", marginBottom: 4 }}>
                Llamada saliente
              </p>
              <p style={{ fontSize: 12, color: "#4a4760" }}>
                Sofía llamará y seguirá el flujo de seguimiento de leads.
              </p>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 8 }}>Número de teléfono</p>
              <input
                type="tel" value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                  padding: "13px 16px", fontSize: 14, color: "#ede8de",
                  outline: "none", fontFamily: "var(--font-inter)",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(201,147,58,0.4)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p className="label" style={{ marginBottom: 4 }}>Agente que llamará</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#ede8de" }}>Sofía · Inmobiliaria Nuevo</p>
              <p style={{ fontSize: 11, color: "#4a4760", marginTop: 2 }}>desde +1 774 493 0842</p>
            </div>
            <button
              onClick={handleCall}
              disabled={!phone.trim() || calling || callDone}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 24px", borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                border: "none", cursor: !phone.trim() || calling ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                background: callDone
                  ? "rgba(34,197,94,0.15)"
                  : phone.trim() && !calling
                    ? "linear-gradient(135deg, #e8b96d, #c9933a)"
                    : "rgba(255,255,255,0.04)",
                color: callDone ? "#22c55e" : phone.trim() && !calling ? "#000" : "#3d3b4f",
                boxShadow: phone.trim() && !calling && !callDone
                  ? "0 0 20px rgba(201,147,58,0.25)"
                  : "none",
              }}
            >
              {calling && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
              {callDone && <Check size={15} />}
              {!calling && !callDone && <PhoneOutgoing size={15} />}
              {calling ? "Iniciando llamada..." : callDone ? "¡Llamada iniciada!" : "Llamar ahora"}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

function SaveBtn({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <button
      onClick={onSave}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "9px 20px", borderRadius: 9,
        fontSize: 13, fontWeight: 600,
        border: "none", cursor: "pointer",
        transition: "all 0.2s",
        background: saved
          ? "rgba(34,197,94,0.15)"
          : "linear-gradient(135deg, #e8b96d, #c9933a)",
        color: saved ? "#22c55e" : "#000",
        boxShadow: saved ? "none" : "0 0 14px rgba(201,147,58,0.3)",
      }}
    >
      {saved ? <Check size={13} /> : <Save size={13} />}
      {saved ? "Guardado" : "Guardar cambios"}
    </button>
  )
}

function SliderField({ label, desc, value, min, max, step, fmt, onChange }: {
  label: string; desc: string; value: number; min: number; max: number
  step: number; fmt: (v: number) => string; onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#ede8de" }}>{label}</p>
          <p style={{ fontSize: 11, color: "#4a4760", marginTop: 1 }}>{desc}</p>
        </div>
        <span className="text-gradient" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>
          {fmt(value)}
        </span>
      </div>
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        <div style={{
          width: "100%", height: 4, borderRadius: 99,
          background: "rgba(255,255,255,0.07)", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #c9933a, #e8b96d)",
            transition: "width 0.1s",
          }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: "absolute", inset: 0, width: "100%",
            opacity: 0, cursor: "pointer", height: "100%",
          }}
        />
      </div>
    </div>
  )
}
