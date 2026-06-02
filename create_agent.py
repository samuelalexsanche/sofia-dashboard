"""
Crea el agente de voz Sofía en Retell AI con:
- Voz cartesia-Sofia (acento mexicano)
- LLM con prompt completo de recepcionista inmobiliaria
- 4 herramientas conectadas a Modal
- Webhook para análisis post-llamada
"""

import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

RETELL_KEY   = os.environ["RETELL_API_KEY"]
MODAL_URL    = os.environ["MODAL_APP_URL"]
HEADERS      = {"Authorization": f"Bearer {RETELL_KEY}", "Content-Type": "application/json"}


# ── 1. Prompt de Sofía ────────────────────────────────────────────────────────

SOFIA_PROMPT = """
Eres Sofía, recepcionista virtual de Inmobiliaria Nuevo, una agencia inmobiliaria en Ciudad de México.

## PERSONALIDAD
- Hablas en español mexicano natural y profesional.
- Eres amable, directa y eficiente — sin rodeos ni respuestas largas.
- Usas expresiones naturales: "claro que sí", "con gusto", "me permite un momento", "perfecto".
- Si te preguntan si eres IA, di que eres la recepcionista virtual de la inmobiliaria.
- Nunca des más de 2-3 oraciones por turno — estamos en una llamada de voz.

## FLUJO DE LLAMADA ENTRANTE
Sigue estos pasos en orden:

1. ENTENDER LA NECESIDAD
   - Pregunta si busca comprar, rentar, o tiene otra consulta.
   - Si no lo dice, pregunta directamente: "¿Está buscando para comprar o para rentar?"

2. RECOPILAR CRITERIOS (haz máximo 2 preguntas por turno)
   - Zona o colonia de interés
   - Presupuesto máximo (para compra en millones, para renta en pesos/mes)
   - Número de recámaras que necesita
   - Tipo de inmueble si lo menciona (casa, departamento, etc.)

3. BUSCAR PROPIEDADES
   - Llama a buscar_propiedades con los criterios recopilados.
   - Presenta máximo 2 opciones de forma conversacional, no como lista.
   - Ejemplo: "Tengo un departamento en Condesa con dos recámaras en 22 mil al mes, y otro en Narvarte en 16 mil. ¿Alguno le llama la atención?"

4. REGISTRAR EL LEAD
   - En cuanto tengas nombre y teléfono, llama a guardar_lead.
   - Si el cliente da email, inclúyelo.
   - Usa fuente "Llamada entrante".

5. AGENDAR VISITA
   - Si quiere ver una propiedad, pregunta qué día y hora le queda bien.
   - Necesitas: nombre, email y fecha/hora para llamar a agendar_cita.
   - Si no tiene email, dile que le llega confirmación por teléfono.

6. CIERRE
   - Confirma el siguiente paso: "Le marco el miércoles a las 11 para confirmar la visita" o similar.
   - Despídete con calidez: "Que tenga muy buen día, gracias por llamar."

## REGLAS IMPORTANTES
- NUNCA inventes propiedades. Solo menciona lo que te devuelve buscar_propiedades.
- Si no hay resultados, amplia la búsqueda: sube el presupuesto 20% o cambia la zona.
- Registra al cliente con guardar_lead tan pronto tengas nombre y teléfono — no esperes al final.
- Si quiere ver propiedades esta semana, actualiza temperatura a "Hot" con actualizar_lead.
- Si dice que lo piensa o no está interesado, actualiza estatus a "Sin interes" o "No contestado".
- Para el campo fecha_iso en agendar_cita, usa formato ISO 8601: "2026-06-20T11:00:00"

## MANEJO DE SITUACIONES ESPECIALES
- Cliente indeciso: "Entiendo, no hay prisa. ¿Le puedo mandar información por WhatsApp?"
- Propiedad vendida/rentada: busca_propiedades ya filtra solo disponibles, confía en los resultados.
- Preguntas de precio exacto: usa buscar_propiedades para confirmar el precio actualizado.
- Llamada de seguimiento (ya tiene lead_id): usa actualizar_lead para registrar notas.

## HERRAMIENTAS
- buscar_propiedades: Busca propiedades disponibles. Úsala siempre antes de mencionar propiedades.
- guardar_lead: Registra al cliente en el CRM. Úsala en cuanto tengas nombre y teléfono.
- agendar_cita: Agenda visita en Cal.com. Necesita nombre, email, fecha_iso y propiedad_titulo.
- actualizar_lead: Actualiza temperatura, estatus o notas. Úsala al final o si cambia el interés.
""".strip()


# ── 2. Definición de herramientas ─────────────────────────────────────────────

def make_tool(name, description, url, params_props, required_params,
              speak_during=False, timeout_ms=10000):
    return {
        "type":                    "custom",
        "name":                    name,
        "description":             description,
        "url":                     url,
        "method":                  "POST",
        "speak_during_execution":  speak_during,
        "speak_after_execution":   False,
        "timeout_ms":              timeout_ms,
        "parameters": {
            "type":       "object",
            "properties": params_props,
            "required":   required_params,
        },
    }


TOOLS = [
    make_tool(
        name        = "buscar_propiedades",
        description = (
            "Busca propiedades inmobiliarias disponibles en el CRM según los criterios del cliente. "
            "Llama esta función antes de mencionar cualquier propiedad."
        ),
        url         = f"{MODAL_URL}/tools/buscar-propiedades",
        speak_during = True,
        timeout_ms  = 12000,
        params_props = {
            "operacion":      {"type": "string",  "description": "Venta o Renta"},
            "zona":           {"type": "string",  "description": "Colonia o zona de interés, ej: Polanco, Condesa"},
            "presupuesto_max":{"type": "number",  "description": "Precio máximo. Para renta en pesos/mes; para venta en pesos"},
            "recamaras":      {"type": "integer", "description": "Número mínimo de recámaras requeridas"},
            "tipo":           {"type": "string",  "description": "Tipo de inmueble: Casa, Departamento, Penthouse, Oficina"},
        },
        required_params = [],
    ),

    make_tool(
        name        = "guardar_lead",
        description = (
            "Registra al cliente como lead en el CRM. "
            "Llama esta función en cuanto el cliente proporcione nombre y teléfono."
        ),
        url         = f"{MODAL_URL}/tools/guardar-lead",
        speak_during = False,
        timeout_ms  = 10000,
        params_props = {
            "nombre":              {"type": "string", "description": "Nombre completo del cliente"},
            "telefono":            {"type": "string", "description": "Teléfono con código de país, ej: +525512345678"},
            "email":               {"type": "string", "description": "Correo electrónico del cliente (opcional)"},
            "tipo_busqueda":       {"type": "string", "description": "Compra, Renta o Inversion"},
            "presupuesto":         {"type": "number", "description": "Presupuesto máximo del cliente en pesos"},
            "zona_interes":        {"type": "string", "description": "Zona o colonia de interés"},
            "recamaras_deseadas":  {"type": "integer","description": "Número de recámaras que busca"},
            "notas":               {"type": "string", "description": "Notas adicionales relevantes de la conversación"},
        },
        required_params = ["nombre", "telefono"],
    ),

    make_tool(
        name        = "agendar_cita",
        description = (
            "Agenda una visita a una propiedad en Cal.com y actualiza el lead en el CRM. "
            "Necesitas nombre, email del cliente, fecha y hora en ISO 8601, y el título de la propiedad."
        ),
        url         = f"{MODAL_URL}/tools/agendar-cita",
        speak_during = True,
        timeout_ms  = 15000,
        params_props = {
            "nombre_cliente":   {"type": "string", "description": "Nombre del cliente"},
            "email_cliente":    {"type": "string", "description": "Email del cliente para enviar confirmación"},
            "fecha_iso":        {"type": "string", "description": "Fecha y hora en formato ISO 8601, ej: 2026-06-20T11:00:00"},
            "propiedad_titulo": {"type": "string", "description": "Título exacto de la propiedad a visitar"},
            "lead_id":          {"type": "string", "description": "ID del lead en Notion si ya fue registrado"},
            "telefono":         {"type": "string", "description": "Teléfono del cliente como alternativa al lead_id"},
        },
        required_params = ["nombre_cliente", "email_cliente", "fecha_iso"],
    ),

    make_tool(
        name        = "actualizar_lead",
        description = (
            "Actualiza la temperatura (Hot/Warm/Cold), estatus o notas de un lead existente en el CRM. "
            "Usa Hot si quiere visitar esta semana, Warm si tiene interés pero sin urgencia, Cold si está dudoso."
        ),
        url         = f"{MODAL_URL}/tools/actualizar-lead",
        speak_during = False,
        timeout_ms  = 10000,
        params_props = {
            "lead_id":       {"type": "string", "description": "ID del lead (obtenido de guardar_lead)"},
            "telefono":      {"type": "string", "description": "Teléfono como alternativa al lead_id"},
            "temperatura":   {"type": "string", "description": "Hot, Warm o Cold"},
            "estatus":       {"type": "string", "description": "Pendiente de llamar | En proceso | Cita agendada | No contestado | Sin interes | Cerrado"},
            "notas":         {"type": "string", "description": "Notas de la conversación"},
            "resumen_llamada":{"type": "string","description": "Resumen breve de lo hablado"},
        },
        required_params = [],
    ),
]


# ── 3. Crear LLM ──────────────────────────────────────────────────────────────

def create_llm() -> str:
    payload = {
        "general_prompt": SOFIA_PROMPT,
        "general_tools":  TOOLS,
        "model":          "gpt-4o",
        "start_speaker":  "agent",
        "begin_message":  "Buenas, le habla Sofía de Inmobiliaria Nuevo. ¿En qué le puedo ayudar?",
    }
    r = httpx.post("https://api.retellai.com/create-retell-llm", headers=HEADERS, json=payload, timeout=30)
    if not r.is_success:
        print("ERROR al crear LLM:", r.status_code, r.text[:400])
        raise SystemExit(1)
    llm = r.json()
    print(f"  LLM creado: {llm['llm_id']}")
    return llm["llm_id"]


# ── 4. Crear Agent ────────────────────────────────────────────────────────────

def create_agent(llm_id: str) -> str:
    payload = {
        "response_engine": {"type": "retell-llm", "llm_id": llm_id},
        "voice_id":               "cartesia-Sofia",
        "agent_name":             "Sofia - Inmobiliaria Nuevo",
        "language":               "es-419",
        "webhook_url":            f"{MODAL_URL}/retell/webhook",
        "interruption_sensitivity": 0.8,
        "responsiveness":           0.9,
        "enable_backchannel":       True,
        "voice_speed":              1.05,
        "end_call_after_silence_ms": 20000,
    }
    r = httpx.post("https://api.retellai.com/create-agent", headers=HEADERS, json=payload, timeout=30)
    if not r.is_success:
        print("ERROR al crear agente:", r.status_code, r.text[:400])
        raise SystemExit(1)
    agent = r.json()
    print(f"  Agente creado: {agent['agent_id']}")
    return agent["agent_id"]


# ── 5. Guardar IDs en .env ────────────────────────────────────────────────────

def update_env(llm_id: str, agent_id: str):
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_path, "r", encoding="utf-8") as f:
        content = f.read()
    block = f"""
# ─────────────────────────────────────────
#  RETELL — IDs del agente Sofia
# ─────────────────────────────────────────
RETELL_LLM_ID={llm_id}
RETELL_AGENT_ID={agent_id}
"""
    with open(env_path, "w", encoding="utf-8") as f:
        f.write(content.rstrip() + "\n" + block)
    print("  .env actualizado.")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("\n[1/3] Creando LLM de Sofia en Retell...")
    llm_id = create_llm()

    print("[2/3] Creando agente de voz...")
    agent_id = create_agent(llm_id)

    print("[3/3] Guardando IDs en .env...")
    update_env(llm_id, agent_id)

    print("\n" + "="*55)
    print("AGENTE SOFIA CREADO")
    print("="*55)
    print(f"  LLM ID:    {llm_id}")
    print(f"  Agent ID:  {agent_id}")
    print(f"  Voz:       cartesia-Sofia (acento mexicano)")
    print(f"  Webhook:   {MODAL_URL}/retell/webhook")
    print("="*55)
    print(f"\nDashboard: https://dashboard.retellai.com/agents/{agent_id}")


if __name__ == "__main__":
    main()
