import { NextResponse } from "next/server"

const RETELL_KEY   = process.env.RETELL_API_KEY!
const NOTION_KEY   = process.env.NOTION_API_KEY!
const LLAMADAS_DB  = process.env.NOTION_LLAMADAS_DB_ID!
const LEADS_DB     = process.env.NOTION_LEADS_DB_ID!

const rHeaders = {
  "Authorization": `Bearer ${RETELL_KEY}`,
  "Content-Type":  "application/json",
}
const nHeaders = {
  "Authorization":  `Bearer ${NOTION_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type":   "application/json",
}

export async function GET() {
  try {
    // ── 1. Llamadas desde Retell ─────────────────────────────────────────────
    const retellRes = await fetch("https://api.retellai.com/v2/list-calls", {
      method:  "POST",
      headers: rHeaders,
      body:    JSON.stringify({ limit: 100 }),
      cache:   "no-store",
    })
    const calls: any[] = retellRes.ok ? await retellRes.json() : []

    const now      = Date.now()
    const DAY_MS   = 86_400_000
    const WEEK_MS  = 7 * DAY_MS

    const ended      = calls.filter(c => c.call_status === "ended")
    const weekCalls  = calls.filter(c => (c.start_timestamp ?? 0) > now - WEEK_MS)
    const todayCalls = calls.filter(c => (c.start_timestamp ?? 0) > now - DAY_MS)

    // Duración promedio en minutos
    const durations = ended
      .map(c => (c.duration_ms ?? 0) / 60_000)
      .filter(d => d > 0)
    const avgDuration = durations.length
      ? +(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)
      : 0

    // Llamadas por día de la semana (últimos 7 días)
    const dayNames = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]
    const byDay: Record<string, { llamadas: number; duracion: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * DAY_MS)
      byDay[dayNames[d.getDay()]] = { llamadas: 0, duracion: 0 }
    }
    weekCalls.forEach(c => {
      const d    = new Date(c.start_timestamp)
      const key  = dayNames[d.getDay()]
      if (byDay[key] !== undefined) {
        byDay[key].llamadas++
        byDay[key].duracion += (c.duration_ms ?? 0) / 60_000
      }
    })
    const llamadasPorDia = Object.entries(byDay).map(([dia, v]) => ({
      dia,
      llamadas: v.llamadas,
      duracion: v.llamadas ? +(v.duracion / v.llamadas).toFixed(1) : 0,
    }))

    // ── 2. Llamadas guardadas en Notion ──────────────────────────────────────
    const notionCallsRes = await fetch(
      `https://api.notion.com/v1/databases/${LLAMADAS_DB}/query`,
      { method: "POST", headers: nHeaders, body: JSON.stringify({}), cache: "no-store" }
    )
    const notionCallsData = notionCallsRes.ok ? await notionCallsRes.json() : {}
    const notionCalls: any[] = notionCallsData.results ?? []

    // Contar por "Siguiente accion"
    const citasAgendadas = notionCalls.filter(
      c => c.properties?.["Siguiente accion"]?.select?.name === "Agendar cita"
    ).length
    const completadas = notionCalls.filter(
      c => c.properties?.["Estado llamada"]?.select?.name === "Completada"
    ).length

    // Tasa de éxito = llamadas completadas / total registradas
    const tasaExito = notionCalls.length
      ? Math.round((completadas / notionCalls.length) * 100)
      : 0

    // Llamadas recientes con resumen
    const recentCalls = notionCalls.slice(0, 6).map(c => {
      const props    = c.properties ?? {}
      const leadRel  = props["Lead"]?.relation?.[0]
      const estado   = props["Estado llamada"]?.select?.name ?? "—"
      const siguienteAccion = props["Siguiente accion"]?.select?.name ?? "—"
      const resumen  = props["Resumen IA"]?.rich_text?.[0]?.text?.content ?? ""
      const durSeg   = props["Duracion (seg)"]?.number
      const tipo     = props["Tipo"]?.select?.name ?? "entrante"
      const fecha    = props["Fecha y hora"]?.date?.start ?? c.created_time
      const callId   = props["Retell Call ID"]?.rich_text?.[0]?.text?.content ?? ""

      // Buscar en Retell para obtener telefono y duracion real
      const retellCall = calls.find(rc => rc.call_id === callId)
      const fromNum    = retellCall?.from_number ?? retellCall?.retell_llm_dynamic_variables?.telefono ?? "—"
      const durMin     = retellCall?.duration_ms
        ? `${Math.floor(retellCall.duration_ms / 60000)}m ${Math.round((retellCall.duration_ms % 60000) / 1000)}s`
        : durSeg ? `${Math.floor(durSeg / 60)}m ${durSeg % 60}s` : "—"
      const nombre   = retellCall?.retell_llm_dynamic_variables?.nombre
        ?? resumen.split(" ").slice(0, 2).join(" ")
        ?? "Desconocido"

      return {
        id:          c.id,
        nombre,
        caller:      fromNum,
        duracion:    durMin,
        resultado:   siguienteAccion,
        estado,
        resumen:     resumen.slice(0, 220),
        fecha:       fecha ? new Date(fecha).toLocaleDateString("es-MX",
          { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
        temperatura: retellCall?.retell_llm_dynamic_variables?.temperatura ?? "—",
      }
    })

    // ── 3. Leads en Notion ────────────────────────────────────────────────────
    const leadsRes = await fetch(
      `https://api.notion.com/v1/databases/${LEADS_DB}/query`,
      { method: "POST", headers: nHeaders, body: JSON.stringify({}), cache: "no-store" }
    )
    const leadsData  = leadsRes.ok ? await leadsRes.json() : {}
    const leads: any[] = leadsData.results ?? []

    const tempCount = { Hot: 0, Warm: 0, Cold: 0, "Sin clasificar": 0 }
    leads.forEach(l => {
      const temp = l.properties?.["Temperatura"]?.select?.name ?? "Sin clasificar"
      if (temp in tempCount) (tempCount as any)[temp]++
      else tempCount["Sin clasificar"]++
    })

    // ── 4. Costos estimados (Retell cobra ~$0.07/min) ─────────────────────────
    const totalMinutes  = durations.reduce((a, b) => a + b, 0)
    const costoSemana   = +(totalMinutes * 0.07).toFixed(2)
    const costoLlamada  = ended.length ? +(costoSemana / ended.length).toFixed(3) : 0

    // Costo por día para el sparkline
    const costoPorDia = llamadasPorDia.map(d => ({
      ...d,
      citas:  0,  // se llena si hay datos
      costo:  +(d.llamadas * avgDuration * 0.07).toFixed(2),
    }))

    return NextResponse.json({
      kpis: {
        llamadasHoy:       todayCalls.length,
        llamadasSemana:    weekCalls.length,
        llamadasTotal:     calls.length,
        citasAgendadas,
        tasaExito,
        duracionPromedio:  avgDuration,
        costoSemana,
        costoLlamada,
        leadsActivos:      leads.length,
        leadsTotal:        notionCalls.length,
      },
      llamadasPorDia: costoPorDia,
      temperaturaLeads: [
        { name: "Hot",           value: tempCount.Hot,              color: "#ef4444" },
        { name: "Warm",          value: tempCount.Warm,             color: "#f59e0b" },
        { name: "Cold",          value: tempCount.Cold,             color: "#60a5fa" },
        { name: "Sin clasificar",value: tempCount["Sin clasificar"],color: "#3d3b4f" },
      ],
      recentCalls,
    })
  } catch (err: any) {
    console.error("metrics error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
