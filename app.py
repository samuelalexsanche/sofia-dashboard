import modal

# ── Modal app ─────────────────────────────────────────────────────────────────
app = modal.App("inmobiliaria-voice-agent")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install_from_requirements("requirements.txt")
    .add_local_python_source("functions", "config", "agents")
)


# ── Función separada para análisis post-llamada ───────────────────────────────
# Se ejecuta en su propio contenedor Modal; el webhook la lanza con .spawn()
# y responde de inmediato sin esperar — así nunca excedemos el timeout de Retell.
@app.function(image=image, secrets=[modal.Secret.from_dotenv()], timeout=120)
def process_call_analysis(transcript: str, call_id: str | None, telefono: str | None):
    from functions.tools import analizar_llamada
    try:
        analizar_llamada(transcript=transcript, call_id=call_id, telefono=telefono)
    except Exception as exc:
        print(f"[process_call_analysis] error call={call_id}: {exc}")
        raise


# ── ASGI / FastAPI ────────────────────────────────────────────────────────────
@app.function(image=image, secrets=[modal.Secret.from_dotenv()])
@modal.asgi_app()
def serve():
    import os
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    from functions.routes import router as tools_router

    web_app = FastAPI(title="Inmobiliaria Voice Agent")
    web_app.include_router(tools_router)

    @web_app.get("/health")
    async def health():
        return {"status": "ok", "service": "inmobiliaria-voice-agent"}

    @web_app.post("/retell/voice")
    async def retell_voice_inbound(request: Request):
        """
        Twilio Voice webhook: se llama cuando alguien marca nuestro número.
        Registra la llamada en Retell → devuelve TwiML que conecta vía SIP a Sofía.
        """
        import httpx as _httpx
        from fastapi.responses import Response as _Resp

        # Twilio envía form-encoded; lo parseamos manualmente para no depender de python-multipart
        from urllib.parse import parse_qs
        raw  = await request.body()
        qs   = parse_qs(raw.decode("utf-8", errors="replace"))
        from_number = qs.get("From", [""])[0]
        to_number   = qs.get("To",   [""])[0]

        r = _httpx.post(
            "https://api.retellai.com/v2/register-phone-call",
            headers={
                "Authorization": f"Bearer {os.environ['RETELL_API_KEY']}",
                "Content-Type":  "application/json",
            },
            json={
                "agent_id":   os.environ["RETELL_AGENT_ID"],
                "from_number": from_number,
                "to_number":   to_number,
                "direction":   "inbound",
            },
            timeout=10,
        )

        if not r.is_success:
            print(f"[retell_voice] register-phone-call error: {r.text[:300]}")
            twiml = ('<?xml version="1.0" encoding="UTF-8"?>'
                     '<Response><Say language="es-MX">Lo sentimos, '
                     'hubo un error. Por favor llame de nuevo.</Say></Response>')
            return _Resp(content=twiml, media_type="application/xml")

        call_id = r.json().get("call_id", "")
        print(f"[retell_voice] call_id={call_id} from={from_number}")

        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response><Dial>"
            f"<Sip>sip:{call_id}@sip.retellai.com</Sip>"
            "</Dial></Response>"
        )
        return _Resp(content=twiml, media_type="application/xml")

    @web_app.post("/retell/voice-outbound")
    async def retell_voice_outbound(request: Request):
        """
        Twilio llama aquí cuando el lead contesta la llamada outbound.
        Lee los datos del lead desde query params y conecta con Sofia outbound vía SIP.
        """
        import httpx as _httpx
        from fastapi.responses import Response as _Resp
        from urllib.parse import parse_qs

        params       = dict(request.query_params)
        nombre       = params.get("nombre", "Cliente")
        zona_interes = params.get("zona_interes", "su zona de interes")
        tipo_busqueda = params.get("tipo_busqueda", "propiedad")
        presupuesto  = params.get("presupuesto", "no especificado")
        recamaras    = params.get("recamaras", "no especificado")
        lead_id      = params.get("lead_id", "")

        raw = await request.body()
        qs  = parse_qs(raw.decode("utf-8", errors="replace"))
        from_number = qs.get("From", [""])[0]
        to_number   = qs.get("To",   [""])[0]

        r = _httpx.post(
            "https://api.retellai.com/v2/register-phone-call",
            headers={
                "Authorization": f"Bearer {os.environ['RETELL_API_KEY']}",
                "Content-Type":  "application/json",
            },
            json={
                "agent_id":   os.environ["RETELL_OUTBOUND_AGENT_ID"],
                "from_number": from_number,
                "to_number":   to_number,
                "direction":   "outbound",
                "retell_llm_dynamic_variables": {
                    "nombre":        nombre,
                    "zona_interes":  zona_interes,
                    "tipo_busqueda": tipo_busqueda,
                    "presupuesto":   presupuesto,
                    "recamaras":     recamaras,
                    "lead_id":       lead_id,
                },
            },
            timeout=10,
        )

        if not r.is_success:
            print(f"[retell_voice_outbound] error: {r.text[:300]}")
            return _Resp(
                content='<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
                media_type="application/xml",
            )

        call_id = r.json().get("call_id", "")
        print(f"[retell_voice_outbound] call_id={call_id} to={to_number} nombre={nombre}")

        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response><Dial>"
            f"<Sip>sip:{call_id}@sip.retellai.com</Sip>"
            "</Dial></Response>"
        )
        return _Resp(content=twiml, media_type="application/xml")

    @web_app.post("/retell/webhook")
    async def retell_webhook(request: Request):
        body  = await request.json()
        event = body.get("event")
        # Retell envía el call bajo "call", no "data"
        call  = body.get("call", body.get("data", {}))

        if event == "call_ended":
            transcript = call.get("transcript", "")
            call_id    = call.get("call_id")
            twilio_num = os.environ.get("TWILIO_PHONE_NUMBER", "")
            from_n     = call.get("from_number", "")
            to_n       = call.get("to_number", "")
            # Inbound: cliente es from_number. Outbound: cliente es to_number.
            telefono   = from_n if to_n == twilio_num else to_n or from_n

            if transcript:
                await process_call_analysis.spawn.aio(transcript, call_id, telefono)

        return JSONResponse({"received": True, "event": event})

    @web_app.post("/retell/llm")
    async def retell_llm(request: Request):
        body = await request.json()
        return JSONResponse({"response_type": "response", "content": "Hola, en que le puedo ayudar?"})

    return web_app


# ── Worker outbound: corre cada hora y llama a leads "Pendiente de llamar" ────
@app.function(image=image, secrets=[modal.Secret.from_dotenv()],
              schedule=modal.Cron("0 * * * *"), timeout=600)
def outbound_caller():
    _run_outbound_cycle()


@app.function(image=image, secrets=[modal.Secret.from_dotenv()], timeout=600)
def outbound_caller_manual():
    """Disparo manual para demos: modal run app.py::outbound_caller_manual"""
    _run_outbound_cycle()


def _run_outbound_cycle():
    import os, time
    from urllib.parse import urlencode
    from twilio.rest import Client as TwilioClient
    from functions.notion_helpers import (
        query_db, update_page, text, select_name, number,
    )

    db_id     = os.environ["NOTION_LEADS_DB_ID"]
    modal_url = os.environ["MODAL_APP_URL"]
    from_num  = os.environ["TWILIO_PHONE_NUMBER"]
    twilio    = TwilioClient(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])

    leads = query_db(db_id, filter_={
        "property": "Estatus",
        "select": {"equals": "Pendiente de llamar"},
    }, page_size=10)

    print(f"[outbound] {len(leads)} lead(s) pendientes de llamar")

    for lead in leads:
        p        = lead["properties"]
        nombre   = text(p.get("Nombre", {})) or "Cliente"
        telefono = p.get("Telefono", {}).get("phone_number", "")
        zona     = text(p.get("Zona de interes", {})) or "no especificada"
        tipo     = select_name(p.get("Tipo de busqueda", {})) or "propiedad"
        pmax     = number(p.get("Presupuesto maximo", {}))
        recs     = number(p.get("Recamaras deseadas", {}))
        lead_id  = lead["id"]

        if not telefono:
            print(f"[outbound] {nombre} — sin teléfono, skip")
            continue

        # Marcar En proceso ANTES de llamar para evitar doble disparo si el cron re-corre
        update_page(lead_id, {"Estatus": {"select": {"name": "En proceso"}}})

        qs = urlencode({
            "nombre":        nombre,
            "zona_interes":  zona,
            "tipo_busqueda": tipo,
            "presupuesto":   str(int(pmax)) if pmax else "no especificado",
            "recamaras":     str(int(recs)) if recs else "no especificado",
            "lead_id":       lead_id,
        })
        webhook_url = f"{modal_url}/retell/voice-outbound?{qs}"

        try:
            call = twilio.calls.create(
                to=telefono, from_=from_num,
                url=webhook_url, method="POST",
                timeout=30,
            )
            print(f"[outbound] Llamada iniciada → {nombre} ({telefono}) SID={call.sid}")
        except Exception as exc:
            print(f"[outbound] Error llamando a {nombre}: {exc}")
            # Revertir para que el siguiente ciclo lo reintente
            update_page(lead_id, {"Estatus": {"select": {"name": "Pendiente de llamar"}}})

        time.sleep(45)  # 45 s entre llamadas para no saturar Twilio/Retell

    print(f"[outbound] Ciclo completado — {len(leads)} lead(s) procesados")


# ── Para tests locales ────────────────────────────────────────────────────────
def _build_local_app():
    from fastapi import FastAPI
    from functions.routes import router as tools_router
    local = FastAPI(title="Inmobiliaria Voice Agent")
    local.include_router(tools_router)
    return local

web_app = _build_local_app()
