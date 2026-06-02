"""
Las 5 herramientas que Retell AI puede invocar durante y después de una llamada.
Cada función devuelve al menos {"result": str} — el string que el agente recibe como respuesta.
"""

import os
import json
from datetime import date, datetime

import httpx
import anthropic

from functions.notion_helpers import (
    query_db, create_page, update_page,
    find_lead_by_phone, text, select_name, number,
)


# ── 1. Buscar propiedades ─────────────────────────────────────────────────────

def _build_filters(operacion, tipo, presupuesto_max, recamaras, zona):
    filters = [{"property": "Estado", "select": {"equals": "Disponible"}}]
    if operacion:
        filters.append({"property": "Operacion", "select": {"equals": operacion}})
    if tipo:
        filters.append({"property": "Tipo", "select": {"equals": tipo}})
    if presupuesto_max:
        filters.append({"property": "Precio", "number": {"less_than_or_equal_to": presupuesto_max}})
    if recamaras:
        filters.append({"property": "Recamaras", "number": {"greater_than_or_equal_to": recamaras}})
    if zona:
        filters.append({"property": "Colonia", "rich_text": {"contains": zona}})
    return {"and": filters} if len(filters) > 1 else filters[0]


def buscar_propiedades(
    operacion: str = None,
    zona: str = None,
    presupuesto_max: float = None,
    recamaras: int = None,
    tipo: str = None,
) -> dict:
    """
    Busca propiedades disponibles con fallback progresivo:
    1. Búsqueda exacta con todos los filtros.
    2. Sin filtro de tipo (ej. si no hay Casas, muestra Departamentos).
    3. Sin filtro de recámaras (muestra lo más cercano disponible).
    4. Solo operación (renta/venta), sin restricciones de tipo ni recámaras.
    Siempre devuelve resultados con una nota de qué se relajó.
    """
    db_id = os.environ["NOTION_PROPIEDADES_DB_ID"]

    # Intentos en orden de especificidad
    attempts = [
        (operacion, tipo,  presupuesto_max, recamaras, zona, ""),
        (operacion, None,  presupuesto_max, recamaras, zona, f"(no se limitó a {tipo})"),
        (operacion, None,  presupuesto_max, None,      zona, "(relajando número de recámaras)"),
        (operacion, None,  None,            None,      zona, "(sin filtro de presupuesto ni recámaras)"),
        (operacion, None,  None,            None,      None, "(ampliando a toda la oferta disponible)"),
    ]

    results, nota_fallback = [], ""
    for op, tp, pmax, rec, z, nota in attempts:
        # Solo intentar si hay alguna diferencia respecto al anterior
        f = _build_filters(op, tp, pmax, rec, z)
        results = query_db(db_id, filter_=f, page_size=6)
        if results:
            nota_fallback = nota
            break

    if not results:
        return {
            "result": "No encontré propiedades disponibles en este momento. El inventario podría estar actualizándose.",
            "propiedades": [],
        }

    propiedades = []
    lines = []
    for page in results:
        p = page["properties"]
        titulo  = text(p["Titulo"])
        precio  = number(p["Precio"]) or 0
        colonia = text(p["Colonia"])
        op      = select_name(p["Operacion"])
        rec     = number(p["Recamaras"]) or 0
        banos   = number(p["Banos"]) or 0
        m2      = number(p["m2 Construccion"]) or 0

        sufijo     = "/mes" if op == "Renta" else ""
        precio_str = f"${precio:,.0f}{sufijo}"
        propiedades.append({"id": page["id"], "titulo": titulo, "precio": precio, "colonia": colonia,
                            "operacion": op, "recamaras": int(rec)})
        lines.append(f"• {titulo} — {colonia} — {precio_str} — {int(rec)} rec, {int(banos)} baños, {int(m2)} m²")

    # Si el cliente pidió recámaras, quitar inmuebles comerciales (0 rec) del resultado
    if recamaras and recamaras > 0:
        results = [p for p in results if (number(p["properties"]["Recamaras"]) or 0) > 0]
        propiedades = [p for p in propiedades if p["recamaras"] > 0]
        lines = [l for l in lines if "— 0 rec" not in l]

    if not results:
        return {
            "result": "No encontré propiedades residenciales disponibles con esos criterios.",
            "propiedades": [],
        }

    encabezado = f"Encontré {len(results)} propiedad{'es' if len(results) > 1 else ''} disponible{'s' if len(results) > 1 else ''}"
    if nota_fallback:
        encabezado += f" {nota_fallback}"
    result_text = encabezado + ":\n" + "\n".join(lines)
    return {"result": result_text, "propiedades": propiedades}


# ── 2. Guardar lead ───────────────────────────────────────────────────────────

def guardar_lead(
    nombre: str,
    telefono: str,
    email: str = None,
    tipo_busqueda: str = None,
    presupuesto: float = None,
    zona_interes: str = None,
    recamaras_deseadas: int = None,
    fuente: str = "Llamada entrante",
    notas: str = None,
) -> dict:
    """Crea un nuevo lead en la base de datos de Notion."""

    props: dict = {
        "Nombre":               {"title":        [{"text": {"content": nombre}}]},
        "Telefono":             {"phone_number": telefono},
        "Estatus":              {"select":        {"name": "En proceso"}},
        "Temperatura":          {"select":        {"name": "Warm"}},
        "Fuente":               {"select":        {"name": fuente}},
        "Fecha primer contacto":{"date":          {"start": date.today().isoformat()}},
    }

    if email:              props["Email"]               = {"email":     email}
    if tipo_busqueda:      props["Tipo de busqueda"]    = {"select":    {"name": tipo_busqueda}}
    if presupuesto:        props["Presupuesto maximo"]  = {"number":    presupuesto}
    if zona_interes:       props["Zona de interes"]     = {"rich_text": [{"text": {"content": zona_interes}}]}
    if recamaras_deseadas: props["Recamaras deseadas"]  = {"number":    recamaras_deseadas}
    if notas:              props["Notas"]               = {"rich_text": [{"text": {"content": notas}}]}

    page = create_page(os.environ["NOTION_LEADS_DB_ID"], props)

    return {
        "result":  f"Lead '{nombre}' guardado en el CRM con éxito.",
        "lead_id": page["id"],
    }


# ── 3. Agendar cita ───────────────────────────────────────────────────────────

def _sanitizar_email(email: str) -> str:
    """Quita acentos/diacríticos que el STT introduce (ej. Sánchez → Sanchez)."""
    import unicodedata
    sin_acentos = unicodedata.normalize("NFD", email).encode("ascii", "ignore").decode("ascii")
    return sin_acentos.strip().lower()


def agendar_cita(
    nombre_cliente: str,
    fecha_iso: str,
    email_cliente: str = None,
    propiedad_titulo: str = None,
    lead_id: str = None,
    telefono: str = None,
) -> dict:
    """
    Crea una cita en Cal.com y actualiza (o crea) el lead en Notion.
    email_cliente es opcional: si falta, la cita se registra solo en Notion.
    fecha_iso: formato ISO 8601, ej. '2026-06-20T11:00:00'
    """
    from zoneinfo import ZoneInfo
    CDMX = ZoneInfo("America/Mexico_City")
    UTC  = ZoneInfo("UTC")

    dt_local  = datetime.fromisoformat(fecha_iso).replace(tzinfo=CDMX)
    dt_utc    = dt_local.astimezone(UTC)
    fecha_fmt = dt_local.strftime("%d/%m/%Y a las %H:%M")

    uid       = ""
    cal_ok    = False

    # ── Intentar booking en Cal.com (solo si hay email válido) ────────────────
    email_limpio = _sanitizar_email(email_cliente) if email_cliente else ""

    if email_limpio:
        event_type_id = int(os.environ.get("CAL_EVENT_TYPE_ID", "0"))
        if event_type_id:
            r = httpx.post(
                "https://api.cal.com/v2/bookings",
                headers={
                    "Authorization":   f"Bearer {os.environ['CAL_API_KEY']}",
                    "Content-Type":    "application/json",
                    "cal-api-version": "2024-08-13",
                },
                json={
                    "start":       dt_utc.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                    "eventTypeId": event_type_id,
                    "attendee": {
                        "name":     nombre_cliente,
                        "email":    email_limpio,
                        "timeZone": "America/Mexico_City",
                        "language": "es",
                    },
                },
                timeout=20,
            )
            if r.is_success:
                uid    = r.json().get("data", {}).get("uid", "")
                cal_ok = True
            else:
                error_text = r.text[:500]
                print(f"[agendar_cita] Cal.com error: {error_text[:200]}")
                if "past" in error_text.lower():
                    return {
                        "result": (
                            "No puedo agendar esa cita porque la fecha u hora ya pasó. "
                            "¿Podría indicarme una fecha y hora futuras para la visita?"
                        ),
                        "booking_uid": "",
                        "lead_id":     lead_id or "",
                    }

    # ── Buscar o crear lead en Notion ─────────────────────────────────────────
    target_id = lead_id
    if not target_id and telefono:
        existing = find_lead_by_phone(telefono)
        if existing:
            target_id = existing["id"]

    # Si el agente nunca llamó guardar_lead, lo creamos aquí para no perder datos
    if not target_id and (nombre_cliente or telefono):
        props: dict = {
            "Nombre":                {"title":        [{"text": {"content": nombre_cliente or "Sin nombre"}}]},
            "Estatus":               {"select":        {"name": "Cita agendada"}},
            "Temperatura":           {"select":        {"name": "Hot"}},
            "Fuente":                {"select":        {"name": "Llamada entrante"}},
            "Fecha primer contacto": {"date":          {"start": date.today().isoformat()}},
        }
        if telefono:  props["Telefono"] = {"phone_number": telefono}
        if email_limpio: props["Email"] = {"email": email_limpio}
        page = create_page(os.environ["NOTION_LEADS_DB_ID"], props)
        target_id = page["id"]

    # ── Actualizar lead con fecha/hora y datos de la cita ─────────────────────
    if target_id:
        nota = f"Cita: {fecha_fmt}"
        if propiedad_titulo: nota += f" — {propiedad_titulo}"
        if uid:              nota += f" (Cal: {uid})"
        update_props: dict = {
            "Estatus":            {"select":    {"name": "Cita agendada"}},
            "Temperatura":        {"select":    {"name": "Hot"}},
            "Proxima accion":     {"date":      {"start": dt_local.isoformat()}},
            "Resumen de llamada": {"rich_text": [{"text": {"content": nota}}]},
        }
        if email_limpio: update_props["Email"] = {"email": email_limpio}
        update_page(target_id, update_props)

    # ── Construir respuesta para el agente ────────────────────────────────────
    prop_msg = f" para ver «{propiedad_titulo}»" if propiedad_titulo else ""
    if cal_ok:
        confirmacion = f"Confirmación enviada a {email_limpio}."
    elif email_limpio:
        confirmacion = "Hubo un problema con el calendario, pero la cita quedó registrada. Le confirmamos por teléfono."
    else:
        confirmacion = "Cita registrada en el sistema. Le confirmaremos por teléfono."

    return {
        "result":      f"Cita agendada{prop_msg} el {fecha_fmt} para {nombre_cliente}. {confirmacion}",
        "booking_uid": uid,
        "lead_id":     target_id or "",
    }


# ── 4. Actualizar lead ────────────────────────────────────────────────────────

def actualizar_lead(
    lead_id: str = None,
    telefono: str = None,
    temperatura: str = None,
    estatus: str = None,
    notas: str = None,
    resumen_llamada: str = None,
) -> dict:
    """Actualiza temperatura, estatus o notas de un lead existente."""

    target_id = lead_id
    if not target_id and telefono:
        lead = find_lead_by_phone(telefono)
        if not lead:
            return {"result": f"No encontré ningún lead con el teléfono {telefono}."}
        target_id = lead["id"]

    if not target_id:
        return {"result": "Necesito el lead_id o el teléfono del cliente para actualizar."}

    props: dict = {}
    if temperatura:      props["Temperatura"]        = {"select":    {"name": temperatura}}
    if estatus:          props["Estatus"]             = {"select":    {"name": estatus}}
    if notas:            props["Notas"]               = {"rich_text": [{"text": {"content": notas}}]}
    if resumen_llamada:  props["Resumen de llamada"]  = {"rich_text": [{"text": {"content": resumen_llamada}}]}

    if not props:
        return {"result": "No se indicó ningún campo para actualizar."}

    update_page(target_id, props)

    cambios = []
    if temperatura:     cambios.append(f"temperatura → {temperatura}")
    if estatus:         cambios.append(f"estatus → {estatus}")
    if notas:           cambios.append("notas actualizadas")
    if resumen_llamada: cambios.append("resumen guardado")

    return {"result": f"Lead actualizado: {', '.join(cambios)}."}


# ── 5. Análisis post-llamada ──────────────────────────────────────────────────

_ANALISIS_PROMPT = """Eres el analista de una inmobiliaria. Analiza la siguiente transcripción de llamada y responde ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto adicional.

TRANSCRIPCIÓN:
{transcript}

JSON de respuesta (usa exactamente estas claves):
{{
  "resumen": "2-3 oraciones resumiendo la conversación y el interés del cliente",
  "temperatura": "Hot" | "Warm" | "Cold",
  "estatus": "Pendiente de llamar" | "En proceso" | "Cita agendada" | "No contestado" | "Sin interes" | "Cerrado",
  "siguiente_accion": "qué debe hacer el agente como siguiente paso concreto",
  "datos_extraidos": {{
    "nombre": "nombre del cliente o null",
    "presupuesto": "presupuesto mencionado o null",
    "zona": "zona de interés o null",
    "tipo_propiedad": "tipo de propiedad o null",
    "recamaras": "número de recámaras o null"
  }},
  "score_razon": "explicación breve del nivel de temperatura asignado"
}}"""

_ESTATUS_A_ACCION = {
    "Cita agendada":       "Agendar cita",
    "Sin interes":         "Cerrar lead",
    "Cerrado":             "Cerrar lead",
    "No contestado":       "Llamar de nuevo",
    "En proceso":          "Enviar informacion",
    "Pendiente de llamar": "Llamar de nuevo",
}


def analizar_llamada(
    transcript: str,
    call_id: str = None,
    lead_id: str = None,
    telefono: str = None,
) -> dict:
    """
    Manda la transcripción a Claude, genera resumen + lead scoring,
    crea registro en Historial de Llamadas y actualiza el lead en Notion.
    """

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    msg = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": _ANALISIS_PROMPT.format(transcript=transcript)}],
    )

    raw = msg.content[0].text.strip()
    # Claude a veces envuelve la respuesta en ```json ... ```
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        analysis = json.loads(raw)
    except json.JSONDecodeError:
        # Si Claude devuelve algo que no es JSON puro, lo guardamos tal cual como resumen
        analysis = {
            "resumen":          raw[:500],
            "temperatura":      "Warm",
            "estatus":          "En proceso",
            "siguiente_accion": "Revisar transcripción manualmente",
            "datos_extraidos":  {},
            "score_razon":      "Error al parsear respuesta del modelo",
        }

    now_iso = datetime.now().isoformat()

    # Resolver lead
    target_id = lead_id
    if not target_id and telefono:
        lead = find_lead_by_phone(telefono)
        if lead:
            target_id = lead["id"]

    # Crear registro en Historial de Llamadas
    call_label = call_id or f"CALL-{now_iso[:10]}-{now_iso[11:16].replace(':','-')}"
    call_props: dict = {
        "ID Llamada":       {"title":     [{"text": {"content": call_label}}]},
        "Tipo":             {"select":    {"name": "Entrante"}},
        "Fecha y hora":     {"date":      {"start": now_iso}},
        "Estado llamada":   {"select":    {"name": "Completada"}},
        "Resumen IA":       {"rich_text": [{"text": {"content": analysis["resumen"]}}]},
        "Transcripcion":    {"rich_text": [{"text": {"content": transcript[:1990]}}]},
        "Siguiente accion": {"select":    {"name": _ESTATUS_A_ACCION.get(analysis["estatus"], "Llamar de nuevo")}},
    }
    if target_id:
        call_props["Lead"] = {"relation": [{"id": target_id}]}
    if call_id:
        call_props["Retell Call ID"] = {"rich_text": [{"text": {"content": call_id}}]}

    create_page(os.environ["NOTION_LLAMADAS_DB_ID"], call_props)

    # Actualizar lead
    if target_id:
        update_page(target_id, {
            "Temperatura":        {"select":    {"name": analysis["temperatura"]}},
            "Estatus":            {"select":    {"name": analysis["estatus"]}},
            "Resumen de llamada": {"rich_text": [{"text": {"content": analysis["resumen"]}}]},
        })

    return {
        "resumen":          analysis["resumen"],
        "temperatura":      analysis["temperatura"],
        "estatus":          analysis["estatus"],
        "siguiente_accion": analysis["siguiente_accion"],
        "datos_extraidos":  analysis.get("datos_extraidos", {}),
        "score_razon":      analysis.get("score_razon", ""),
    }
