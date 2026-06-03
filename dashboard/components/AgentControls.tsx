"use client"

import { useState } from "react"
import { voices, defaultPromptFragment } from "@/lib/data"
import { MessageSquare, Mic, Sliders, PhoneOutgoing, Save, Check, Play, Loader2, AlertCircle } from "lucide-react"

const MODAL_URL = "https://matterasystems--inmobiliaria-voice-agent-serve.modal.run"

const tabs = [
  { id: "prompt",   label: "Personalidad",    icon: MessageSquare },
  { id: "voz",      label: "Voz",             icon: Mic           },
  { id: "ajustes",  label: "Ajustes",         icon: Sliders       },
  { id: "outbound", label: "Llamada saliente", icon: PhoneOutgoing },
]

type SaveState = "idle" | "saving" | "ok" | "error"

export function AgentControls() {
  const [activeTab, setActiveTab]     = useState("prompt")
  const [prompt, setPrompt]           = useState(defaultPromptFragment)
  const [voice, setVoice]             = useState("cartesia-Sofia")
  const [creativity, setCreativity]   = useState(0.7)
  const [speed, setSpeed]             = useState(1.05)
  const [sensitivity, setSensitivity] = useState(0.8)
  const [saveState, setSaveState]     = useState<SaveState>("idle")
  const [saveError, setSaveError]     = useState("")
  const [phone, setPhone]             = useState("")
  const [callState, setCallState]     = useState<"idle"|"calling"|"ok"|"error">("idle")
  const [callError, setCallError]     = useState("")

  // ── Guardar en Retell via Modal ────────────────────────────────────────────
  const handleSave = async (payload: Record<string, unknown>) => {
    setSaveState("saving")
    setSaveError("")
    try {
      const res = await fetch(`${MODAL_URL}/agent/update`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setSaveState("ok")
        setTimeout(() => setSaveState("idle"), 2500)
      } else {
        throw new Error(JSON.stringify(json.results))
      }
    } catch (e: any) {
      setSaveState("error")
      setSaveError("Error al guardar. Intenta de nuevo.")
      setTimeout(() => setSaveState("idle"), 3000)
    }
  }

  // ── Llamada saliente via Modal ─────────────────────────────────────────────
  const handleCall = async () => {
    if (!phone.trim()) return
    setCallState("calling")
    setCallError("")
    try {
      const res = await fetch(`${MODAL_URL}/agent/call`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ to_number: phone }),
      })
      const json = await res.json()
      if (json.success) {
        setCallState("ok")
        setTimeout(() => { setCallState("idle"); setPhone("") }, 4000)
      } else {
        throw new Error(json.error ?? "Error desconocido")
      }
    } catch (e: any) {
      setCallState("error")
      setCallError(e.message ?? "No se pudo iniciar la llamada")
      setTimeout(() => setCallState("idle"), 4000)
    }
  }

  return (
    <div className="card">
      {/* Tabs */}
      <div className="controls-tabs" style={{
        display: "flex", gap: 4, padding: 8,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.01)",
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
                Cambia cómo se presenta y comunica. Se aplica en la próxima llamada.
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
                fontFamily: "var(--font-inter)", transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(201,147,58,0.4)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <SaveError msg={saveError} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn
                state={saveState}
                onSave={() => handleSave({ prompt })}
              />
            </div>
          </div>
        )}

        {/* ── VOZ ── */}
        {activeTab === "voz" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p className="serif" style={{ fontSize: 16, color: "#ede8de", marginBottom: 4 }}>Voz del agente</p>
              <p style={{ fontSize: 12, color: "#4a4760" }}>Selecciona el acento de Sofía. Aplica desde la próxima llamada.</p>
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
                      background: sel ? "linear-gradient(135deg, rgba(201,147,58,0.12), rgba(201,147,58,0.04))" : "rgba(255,255,255,0.02)",
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
                        <Play size={10} fill="#8a7a55" /> activa
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <SaveError msg={saveError} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn state={saveState} onSave={() => handleSave({ voice_id: voice })} />
            </div>
          </div>
        )}

        {/* ── AJUSTES ── */}
        {activeTab === "ajustes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <p className="serif" style={{ fontSize: 16, color: "#ede8de", marginBottom: 4 }}>Comportamiento</p>
              <p style={{ fontSize: 12, color: "#4a4760" }}>Controla cómo responde Sofía en la conversación.</p>
            </div>
            <SliderField
              label="Creatividad"
              desc="Qué tan variadas son las respuestas (temperatura del modelo)"
              value={creativity} min={0} max={1} step={0.05}
              fmt={v => `${Math.round(v * 100)}%`}
              onChange={setCreativity}
            />
            <SliderField
              label="Velocidad de habla"
              desc="Ritmo de la voz de Sofía"
              value={speed} min={0.7} max={1.5} step={0.05}
              fmt={v => `${v.toFixed(2)}×`}
              onChange={setSpeed}
            />
            <SliderField
              label="Sensibilidad a interrupciones"
              desc="Facilidad para ser interrumpida por el cliente"
              value={sensitivity} min={0} max={1} step={0.1}
              fmt={v => `${Math.round(v * 100)}%`}
              onChange={setSensitivity}
            />
            <SaveError msg={saveError} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn
                state={saveState}
                onSave={() => handleSave({
                  voice_speed:              speed,
                  responsiveness:           speed,          // alias en Retell
                  interruption_sensitivity: sensitivity,
                  model_temperature:        creativity,
                })}
              />
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
                Sofía llamará al número y seguirá el flujo de seguimiento.
              </p>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 8 }}>Número de teléfono</p>
              <input
                type="tel" value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                disabled={callState === "calling"}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                  padding: "13px 16px", fontSize: 14, color: "#ede8de",
                  outline: "none", fontFamily: "var(--font-inter)", transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(201,147,58,0.4)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p className="label" style={{ marginBottom: 4 }}>Agente que llamará</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#ede8de" }}>Sofía · Inmobiliaria Nuevo</p>
              <p style={{ fontSize: 11, color: "#4a4760", marginTop: 2 }}>desde +1 774 493 0842</p>
            </div>

            {callState === "error" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 8,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              }}>
                <AlertCircle size={14} color="#ef4444" />
                <span style={{ fontSize: 12, color: "#ef4444" }}>{callError}</span>
              </div>
            )}

            <button
              onClick={handleCall}
              disabled={!phone.trim() || callState === "calling" || callState === "ok"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: "none", cursor: !phone.trim() || callState !== "idle" ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                background: callState === "ok"
                  ? "rgba(34,197,94,0.15)"
                  : callState === "error"
                    ? "rgba(239,68,68,0.1)"
                    : phone.trim() && callState === "idle"
                      ? "linear-gradient(135deg, #e8b96d, #c9933a)"
                      : "rgba(255,255,255,0.04)",
                color: callState === "ok" ? "#22c55e"
                     : callState === "error" ? "#ef4444"
                     : phone.trim() && callState === "idle" ? "#000"
                     : "#3d3b4f",
                boxShadow: phone.trim() && callState === "idle" ? "0 0 20px rgba(201,147,58,0.25)" : "none",
              }}
            >
              {callState === "calling" && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
              {callState === "ok"      && <Check size={15} />}
              {callState === "error"   && <AlertCircle size={15} />}
              {callState === "idle"    && <PhoneOutgoing size={15} />}
              {callState === "calling" ? "Iniciando llamada..."
               : callState === "ok"   ? "¡Llamada iniciada!"
               : callState === "error" ? "Error — intenta de nuevo"
               : "Llamar ahora"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SaveBtn({ state, onSave }: { state: SaveState; onSave: () => void }) {
  return (
    <button
      onClick={onSave}
      disabled={state === "saving"}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 600,
        border: state === "error" ? "1px solid rgba(239,68,68,0.3)" : "none",
        cursor: state === "saving" ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        background: state === "ok"    ? "rgba(34,197,94,0.15)"
                  : state === "error" ? "rgba(239,68,68,0.1)"
                  : "linear-gradient(135deg, #e8b96d, #c9933a)",
        color: state === "ok"    ? "#22c55e"
             : state === "error" ? "#ef4444"
             : "#000",
        boxShadow: state === "idle" ? "0 0 14px rgba(201,147,58,0.3)" : "none",
      }}
    >
      {state === "saving" && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
      {state === "ok"     && <Check size={13} />}
      {state === "idle" || state === "error"
        ? <Save size={13} />
        : null}
      {state === "saving" ? "Guardando..."
       : state === "ok"   ? "Guardado en Retell"
       : state === "error" ? "Error"
       : "Guardar en Retell"}
    </button>
  )
}

function SaveError({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px", borderRadius: 8,
      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
    }}>
      <AlertCircle size={13} color="#ef4444" />
      <span style={{ fontSize: 12, color: "#ef4444" }}>{msg}</span>
    </div>
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
        <div style={{ width: "100%", height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #c9933a, #e8b96d)", transition: "width 0.1s",
          }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%" }}
        />
      </div>
    </div>
  )
}
