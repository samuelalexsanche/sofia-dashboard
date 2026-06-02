# Sistema de IA - Agente de Voz Inmobiliaria

## Descripción del Proyecto

Sistema de agentes de voz con IA para una inmobiliaria. El agente puede recibir y realizar llamadas, interactuar con clientes, y gestionar información de propiedades y leads.

## Stack Tecnológico

| Componente | Tecnología | Rol |
|---|---|---|
| Agente de Voz | [Retell AI](https://www.retellai.com/) | Motor de conversación y manejo de llamadas |
| Infraestructura | [Modal](https://modal.com/) | Hosting de automatizaciones y funciones serverless |
| CRM | [Notion](https://www.notion.so/) | Base de datos de leads, propiedades y clientes |
| Telefonía | [Twilio](https://www.twilio.com/) | Número de teléfono, llamadas entrantes y salientes |

## Capacidades del Agente

- **Llamadas entrantes**: Recibir consultas de clientes interesados en propiedades
- **Llamadas salientes**: Hacer seguimiento a leads y contactar prospectos
- **Integración CRM**: Registrar y actualizar información en Notion automáticamente

## Estructura del Proyecto

```
/
├── agents/          # Configuración y prompts de agentes Retell AI
├── functions/       # Funciones Modal (webhooks, lógica de negocio)
├── integrations/
│   ├── notion/      # Cliente y helpers para Notion API
│   └── twilio/      # Configuración Twilio
└── config/          # Variables de entorno y configuración general
```

## Variables de Entorno Necesarias

```env
RETELL_API_KEY=
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
NOTION_TOKEN=
NOTION_DATABASE_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## Convenciones

- Python como lenguaje principal
- Funciones Modal para todos los endpoints/webhooks
- Un agente Retell AI por flujo (entrante / saliente)
- Notion como fuente de verdad para leads y propiedades
