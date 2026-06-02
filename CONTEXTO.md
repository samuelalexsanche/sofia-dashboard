# Sistema de IA — Agente de Voz Sofía · Inmobiliaria Nuevo

## ¿Qué es este proyecto?

Sistema completo de agente de voz con IA para una inmobiliaria. Sofía es una recepcionista virtual que:
- **Recibe llamadas** de clientes interesados en propiedades
- **Hace llamadas salientes** de seguimiento a leads
- **Registra clientes** automáticamente en el CRM (Notion)
- **Agenda citas** en Cal.com
- **Analiza llamadas** con IA (Anthropic) para generar resúmenes

---

## Stack tecnológico

| Componente | Tecnología | Estado |
|---|---|---|
| Agente de voz | Retell AI | ✅ Activo |
| Backend / webhooks | Modal (serverless Python) | ✅ Deployado |
| CRM | Notion | ✅ Conectado |
| Telefonía | Twilio (+1 774 493 0842) | ✅ Conectado vía SIP |
| Calendario | Cal.com | ✅ Conectado |
| IA resúmenes | Anthropic Claude | ✅ Configurado |
| Dashboard | Next.js 14 + Tailwind | ✅ Deployado en GitHub Pages |

---

## Arquitectura del flujo

```
Cliente llama a +1 774 493 0842
        ↓
   Twilio SIP Trunk (TKac505605bfdc12a67dd817a3036eed9b)
        ↓
   Retell AI (agent_b9376b8f6fd414789e46bac2c6)
   — Sofía habla con el cliente —
        ↓
   Herramientas (Modal endpoints):
   ├── buscar_propiedades  → Notion (DB Propiedades)
   ├── guardar_lead        → Notion (DB Leads)
   ├── agendar_cita        → Cal.com
   └── actualizar_lead     → Notion (DB Leads)
        ↓
   Post-llamada webhook → analizar_llamada → Anthropic → Notion (DB Llamadas)
```

---

## IDs y referencias importantes

### Retell AI
| Recurso | ID |
|---|---|
| Agente entrante (Sofía) | `agent_b9376b8f6fd414789e46bac2c6` |
| LLM entrante | `llm_5148f0cbcbe5c9ac4402208c2aa2` |
| Agente saliente (detenido) | `agent_5e17ea0cc4376dcf2ab5ab13a4` |
| LLM saliente | `llm_9e63fa28251c610d020db7be4062` |

Dashboard Retell: https://dashboard.retellai.com/agents

### Twilio
| Recurso | Valor |
|---|---|
| Número | +1 774 493 0842 |
| SIP Trunk SID | `TKac505605bfdc12a67dd817a3036eed9b` |
| Termination URI | `tkac505605bfdc12a67dd817a3036eed9b.pstn.twilio.com` |
| Phone Number SID | `PN549d4b2dccc77a844805b12bfc13e674` |

Console Twilio: https://console.twilio.com

### Notion (CRM)
| Base de datos | ID |
|---|---|
| Leads | `373f70fc-f2b9-8167-ae56-f0139eb260cf` |
| Propiedades | `373f70fc-f2b9-815c-a3a5-e64ba9227cdb` |
| Llamadas | `373f70fc-f2b9-81d9-b5ee-fd6ec3196ea4` |
| Página padre | `373f70fc-f2b9-80cd-87d6-d1b94c78ac4b` |

### Modal (Backend)
- URL producción: `https://matterasystems--inmobiliaria-voice-agent-serve.modal.run`
- Endpoints:
  - `POST /tools/buscar-propiedades`
  - `POST /tools/guardar-lead`
  - `POST /tools/agendar-cita`
  - `POST /tools/actualizar-lead`
  - `POST /retell/webhook` (post-llamada)

### Cal.com
- Usuario: `samuel-gonzalez-m1zawn`
- Event Type ID: `5876927`

---

## Estructura de archivos

```
/
├── CONTEXTO.md              ← Este archivo
├── CLAUDE.md                ← Instrucciones para Claude Code
├── app.py                   ← Entry point Modal (FastAPI)
├── create_agent.py          ← Script para recrear el agente en Retell
├── setup_crm.py             ← Script para recrear las DBs en Notion
├── setup_twilio_retell.py   ← Conectar Twilio ↔ Retell (webhook simple)
├── setup_sip_twilio_retell.py ← Conectar via SIP Trunking (método actual)
├── test_tools.py            ← Probar herramientas individualmente
├── requirements.txt
├── .env                     ← Variables de entorno (NO subir a git)
│
├── agents/
│   └── prompts.py           ← Prompt completo de Sofía
│
├── functions/
│   ├── routes.py            ← FastAPI routes (endpoints para Retell)
│   ├── tools.py             ← Lógica de cada herramienta
│   └── notion_helpers.py    ← Helpers de Notion
│
├── integrations/
│   ├── notion.py            ← Cliente Notion API
│   ├── twilio.py            ← Cliente Twilio
│   ├── cal.py               ← Cliente Cal.com
│   └── anthropic.py         ← Cliente Anthropic (resúmenes)
│
├── config/
│   └── settings.py          ← Carga y valida variables de entorno
│
└── dashboard/               ← Panel de control (Next.js)
    ├── app/
    │   ├── page.tsx         ← Dashboard principal
    │   ├── layout.tsx
    │   ├── globals.css
    │   └── api/
    │       └── metrics/
    │           └── route.ts ← API que agrega datos de Retell + Notion
    ├── components/
    │   ├── Sidebar.tsx
    │   ├── KPICard.tsx
    │   ├── CallsChart.tsx
    │   ├── TemperatureDonut.tsx
    │   ├── LeadFunnel.tsx
    │   ├── RecentCalls.tsx
    │   ├── CostCard.tsx
    │   └── AgentControls.tsx
    ├── lib/
    │   ├── data.ts          ← Mock data (respaldo cuando no hay API)
    │   └── utils.ts
    └── .env.local           ← Keys del dashboard (NO subir a git)
```

---

## Variables de entorno necesarias

### Backend (`/.env`)
```env
RETELL_API_KEY=
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
MODAL_APP_URL=
NOTION_API_KEY=
NOTION_PARENT_PAGE_ID=
NOTION_PROPIEDADES_DB_ID=
NOTION_LEADS_DB_ID=
NOTION_LLAMADAS_DB_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
CAL_API_KEY=
CAL_USERNAME=
CAL_EVENT_TYPE_ID=
ANTHROPIC_API_KEY=
RETELL_LLM_ID=
RETELL_AGENT_ID=
RETELL_OUTBOUND_LLM_ID=
RETELL_OUTBOUND_AGENT_ID=
```

### Dashboard (`/dashboard/.env.local`)
```env
RETELL_API_KEY=
NOTION_API_KEY=
NOTION_LEADS_DB_ID=
NOTION_LLAMADAS_DB_ID=
RETELL_AGENT_ID=
RETELL_OUTBOUND_AGENT_ID=
TWILIO_PHONE_NUMBER=
```

---

## Cómo correr localmente

### Backend (Modal)
```bash
pip install -r requirements.txt
modal serve app.py          # desarrollo local
modal deploy app.py         # producción
```

### Dashboard
```bash
cd dashboard
npm install
npm run dev                 # http://localhost:3001
```

---

## Estado del agente saliente

El agente `Sofia Outbound - Inmobiliaria Horizontes` (`agent_5e17ea0cc4376dcf2ab5ab13a4`) está **detenido** — no tiene número asignado. Para reactivarlo:
1. Asignarle el número en Retell: `PATCH /update-phone-number/+17744930842` con `outbound_agent_id`
2. O crear un número MX en Retell (requiere tarjeta): área code 55

---

## Próximos pasos sugeridos

- [ ] Agregar propiedades reales a la DB de Notion (actualmente vacía)
- [ ] Conectar número mexicano (+52) para mejor UX local
- [ ] Autenticar dashboard con password para el cliente
- [ ] Agregar sección de gestión de propiedades al dashboard
- [ ] Implementar llamadas salientes desde el dashboard (endpoint `/api/call`)
- [ ] Agregar notificaciones por WhatsApp cuando se agenda una cita
- [ ] Configurar dominio personalizado para el dashboard
