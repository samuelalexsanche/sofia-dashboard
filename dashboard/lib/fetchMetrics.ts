// En GitHub Pages (estático) no hay servidor, así que los datos
// se inyectan en build-time via generateStaticParams / fetch al build.
// En desarrollo, se llama a /api/metrics en tiempo real.

export type Metrics = {
  kpis: {
    llamadasHoy: number
    llamadasSemana: number
    llamadasTotal: number
    citasAgendadas: number
    tasaExito: number
    duracionPromedio: number
    costoSemana: number
    costoLlamada: number
    leadsActivos: number
    leadsTotal: number
  }
  llamadasPorDia: Array<{ dia: string; llamadas: number; duracion: number; citas: number; costo: number }>
  temperaturaLeads: Array<{ name: string; value: number; color: string }>
  recentCalls: any[]
}

export async function fetchMetrics(): Promise<Metrics | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE ?? ""
    const res = await fetch(`${base}/api/metrics`, { cache: "no-store" })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// Datos de demostración para cuando no hay API (GitHub Pages)
export const demoMetrics: Metrics = {
  kpis: {
    llamadasHoy:       18,
    llamadasSemana:    18,
    llamadasTotal:     18,
    citasAgendadas:    7,
    tasaExito:         100,
    duracionPromedio:  2.9,
    costoSemana:       3.70,
    costoLlamada:      0.21,
    leadsActivos:      0,
    leadsTotal:        15,
  },
  llamadasPorDia: [
    { dia: "Mié", llamadas: 0,  duracion: 0,   citas: 0, costo: 0    },
    { dia: "Jue", llamadas: 0,  duracion: 0,   citas: 0, costo: 0    },
    { dia: "Vie", llamadas: 0,  duracion: 0,   citas: 0, costo: 0    },
    { dia: "Sáb", llamadas: 0,  duracion: 0,   citas: 0, costo: 0    },
    { dia: "Dom", llamadas: 0,  duracion: 0,   citas: 0, costo: 0    },
    { dia: "Lun", llamadas: 2,  duracion: 1.4, citas: 0, costo: 0.41 },
    { dia: "Mar", llamadas: 16, duracion: 3.1, citas: 7, costo: 3.29 },
  ],
  temperaturaLeads: [
    { name: "Hot",           value: 0, color: "#ef4444" },
    { name: "Warm",          value: 0, color: "#f59e0b" },
    { name: "Cold",          value: 0, color: "#60a5fa" },
    { name: "Sin clasificar",value: 0, color: "#3d3b4f" },
  ],
  recentCalls: [
    { id: "1", nombre: "Pablo Guzmán",        caller: "+52311299027", duracion: "4m 59s", resultado: "Agendar cita",       estado: "Completada", resumen: "Busca rentar departamento 2 rec en Providencia, presupuesto 60k/mes. Interesado en visita.", fecha: "2 Jun, 05:09 p.m.", temperatura: "Hot"  },
    { id: "2", nombre: "Valentina García",    caller: "+56912345678", duracion: "3m 12s", resultado: "Agendar cita",       estado: "Completada", resumen: "Busca comprar casa 4 rec en Tlaquepaque Centro, presupuesto alto. Lista para visita.", fecha: "2 Jun, 04:45 p.m.", temperatura: "Hot"  },
    { id: "3", nombre: "Francisco Robles",    caller: "+56987654321", duracion: "2m 48s", resultado: "Enviar informacion", estado: "Completada", resumen: "Busca comprar en Tonalá, presupuesto 900k. Quiere información antes de decidir.", fecha: "2 Jun, 04:20 p.m.", temperatura: "Warm" },
    { id: "4", nombre: "Samuel González",     caller: "+52155123456", duracion: "5m 33s", resultado: "Agendar cita",       estado: "Completada", resumen: "Renta departamento 2 rec en Anzures, presupuesto 32k/mes. Cita agendada.", fecha: "2 Jun, 03:55 p.m.", temperatura: "Hot"  },
    { id: "5", nombre: "Pedro Ramírez",       caller: "+52155987654", duracion: "1m 22s", resultado: "Seguimiento",        estado: "Completada", resumen: "Llamada breve, no disponible. Se dejó mensaje para callback.", fecha: "2 Jun, 03:10 p.m.", temperatura: "Cold" },
    { id: "6", nombre: "Carlos Mendoza",      caller: "+52155111222", duracion: "6m 07s", resultado: "Agendar cita",       estado: "Completada", resumen: "Inversión inmobiliaria, busca 2-3 departamentos para rentar. Muy interesado.", fecha: "2 Jun, 02:30 p.m.", temperatura: "Hot"  },
  ],
}
