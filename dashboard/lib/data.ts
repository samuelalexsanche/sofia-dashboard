// Mock data — replace with real API calls in production

export const kpis = {
  llamadasHoy:       24,
  llamadasSemana:    118,
  citasAgendadas:    17,
  tasaExito:         72,        // %
  duracionPromedio:  3.4,       // min
  costoMes:          142.50,    // USD
  costoLlamada:      0.038,     // USD
  leadsNuevos:       31,
  conversionRate:    54,        // %
}

export const llamadasPorDia = [
  { dia: "Lun", llamadas: 14, citas: 2, duracion: 3.1 },
  { dia: "Mar", llamadas: 22, citas: 4, duracion: 3.8 },
  { dia: "Mié", llamadas: 18, citas: 3, duracion: 2.9 },
  { dia: "Jue", llamadas: 27, citas: 5, duracion: 4.1 },
  { dia: "Vie", llamadas: 31, citas: 6, duracion: 3.6 },
  { dia: "Sáb", llamadas: 19, citas: 3, duracion: 3.0 },
  { dia: "Dom", llamadas:  8, citas: 1, duracion: 2.4 },
]

export const temperaturaLeads = [
  { name: "Hot",  value: 18, color: "#ef4444" },
  { name: "Warm", value: 34, color: "#f59e0b" },
  { name: "Cold", value: 21, color: "#60a5fa" },
  { name: "Sin clasificar", value: 9, color: "#4a4858" },
]

export const funnel = [
  { etapa: "Llamadas recibidas", cantidad: 118, pct: 100 },
  { etapa: "Necesidad identificada", cantidad:  94, pct:  80 },
  { etapa: "Propiedad presentada", cantidad:  71, pct:  60 },
  { etapa: "Lead registrado",      cantidad:  58, pct:  49 },
  { etapa: "Cita agendada",        cantidad:  17, pct:  14 },
]

export const llamadasRecientes = [
  {
    id: "c001",
    caller: "+52 55 1234 5678",
    nombre: "Carlos Mendoza",
    duracion: "4m 22s",
    resultado: "Cita agendada",
    temperatura: "Hot",
    fecha: "Hoy, 14:32",
    resumen: "Busca departamento en Condesa, 2 rec., presupuesto $18,000/mes. Visita agendada para el viernes.",
  },
  {
    id: "c002",
    caller: "+52 55 9876 5432",
    nombre: "Valentina García",
    duracion: "6m 01s",
    resultado: "Lead registrado",
    temperatura: "Warm",
    fecha: "Hoy, 13:15",
    resumen: "Interesada en compra, zona Polanco. Presupuesto 4.5M. No disponible esta semana.",
  },
  {
    id: "c003",
    caller: "+52 55 5555 1122",
    nombre: "Pablo Guzmán",
    duracion: "1m 48s",
    resultado: "No interesado",
    temperatura: "Cold",
    fecha: "Hoy, 11:47",
    resumen: "Solo cotizaba renta. Presupuesto muy bajo para la zona. Cerró la llamada.",
  },
  {
    id: "c004",
    caller: "+52 55 3344 7788",
    nombre: "Mariana López",
    duracion: "5m 14s",
    resultado: "Cita agendada",
    temperatura: "Hot",
    fecha: "Ayer, 17:20",
    resumen: "Busca casa en Coyoacán para compra. 3 rec. Presupuesto 6.2M. Muy interesada.",
  },
  {
    id: "c005",
    caller: "+52 55 6677 8899",
    nombre: "Roberto Fuentes",
    duracion: "3m 33s",
    resultado: "Lead registrado",
    temperatura: "Warm",
    fecha: "Ayer, 15:05",
    resumen: "Inversionista buscando departamentos para rentar. Quiere ver opciones la próxima semana.",
  },
  {
    id: "c006",
    caller: "+52 55 2211 4433",
    nombre: "Ana Cristina Robles",
    duracion: "7m 18s",
    resultado: "Cita agendada",
    temperatura: "Hot",
    fecha: "Ayer, 10:30",
    resumen: "Pareja buscando su primer departamento. Narvarte o Roma. Presupuesto 14k-16k/mes.",
  },
]

export const voices = [
  { id: "cartesia-Sofia", label: "Sofía (Mexicana) — actual" },
  { id: "cartesia-Elena", label: "Elena (Neutral)" },
  { id: "cartesia-Isabella", label: "Isabella (Española)" },
  { id: "cartesia-Andrea", label: "Andrea (Colombiana)" },
]

export const defaultPromptFragment = `Eres Sofía, recepcionista virtual de Inmobiliaria Nuevo. Hablas en español mexicano natural y profesional. Eres amable, directa y eficiente.`
