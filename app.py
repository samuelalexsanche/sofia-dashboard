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

    from fastapi.middleware.cors import CORSMiddleware

    web_app = FastAPI(title="Inmobiliaria Voice Agent")
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    web_app.include_router(tools_router)

    @web_app.get("/health")
    async def health():
        return {"status": "ok", "service": "inmobiliaria-voice-agent"}

    @web_app.get("/metrics")
    async def metrics():
        """
        Agrega métricas reales de Retell AI + Notion.
        Llamado por el dashboard (GitHub Pages) para mostrar datos en tiempo real.
        """
        import time
        import httpx as _httpx

        retell_key  = os.environ["RETELL_API_KEY"]
        notion_key  = os.environ["NOTION_API_KEY"]
        llamadas_db = os.environ["NOTION_LLAMADAS_DB_ID"]
        leads_db    = os.environ["NOTION_LEADS_DB_ID"]

        r_headers = {"Authorization": f"Bearer {retell_key}", "Content-Type": "application/json"}
        n_headers = {"Authorization": f"Bearer {notion_key}", "Notion-Version": "2022-06-28", "Content-Type": "application/json"}

        now     = time.time() * 1000
        DAY_MS  = 86_400_000
        WEEK_MS = 7 * DAY_MS

        # ── Retell: todas las llamadas ──────────────────────────────────────
        r = _httpx.post("https://api.retellai.com/v2/list-calls",
                        headers=r_headers, json={"limit": 100}, timeout=15)
        calls = r.json() if r.is_success else []

        ended       = [c for c in calls if c.get("call_status") == "ended"]
        week_calls  = [c for c in calls if (c.get("start_timestamp") or 0) > now - WEEK_MS]
        today_calls = [c for c in calls if (c.get("start_timestamp") or 0) > now - DAY_MS]

        durations = [(c.get("duration_ms") or 0) / 60_000 for c in ended if c.get("duration_ms")]
        avg_dur   = round(sum(durations) / len(durations), 1) if durations else 0.0

        day_names = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
        by_day: dict = {}
        for i in range(6, -1, -1):
            import datetime as _dt
            d = _dt.datetime.fromtimestamp((now - i * DAY_MS) / 1000)
            by_day[day_names[d.weekday() + 1 if d.weekday() < 6 else 0]] = {"llamadas": 0, "duracion": []}
        # reconstruir con índice correcto
        by_day2: dict = {}
        for i in range(6, -1, -1):
            import datetime as _dt
            d   = _dt.datetime.fromtimestamp((now - i * DAY_MS) / 1000)
            key = day_names[d.weekday() + 1 if d.weekday() < 6 else 0]
            # use isoweekday 1=Mon..7=Sun, map to our array
            key = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][d.weekday()]
            by_day2[key] = {"llamadas": 0, "duracion": []}

        for c in week_calls:
            import datetime as _dt
            d   = _dt.datetime.fromtimestamp((c.get("start_timestamp") or 0) / 1000)
            key = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][d.weekday()]
            if key in by_day2:
                by_day2[key]["llamadas"] += 1
                if c.get("duration_ms"):
                    by_day2[key]["duracion"].append(c["duration_ms"] / 60_000)

        llamadas_por_dia = [
            {
                "dia":      dia,
                "llamadas": v["llamadas"],
                "duracion": round(sum(v["duracion"]) / len(v["duracion"]), 1) if v["duracion"] else 0,
                "costo":    round(sum(v["duracion"]) * 0.07, 2),
            }
            for dia, v in by_day2.items()
        ]

        # ── Notion: llamadas registradas ────────────────────────────────────
        rn = _httpx.post(f"https://api.notion.com/v1/databases/{llamadas_db}/query",
                         headers=n_headers, json={}, timeout=15)
        n_calls = (rn.json().get("results") or []) if rn.is_success else []

        citas_agendadas = sum(
            1 for c in n_calls
            if (c.get("properties") or {}).get("Siguiente accion", {}).get("select", {}).get("name") == "Agendar cita"
        )
        completadas = sum(
            1 for c in n_calls
            if (c.get("properties") or {}).get("Estado llamada", {}).get("select", {}).get("name") == "Completada"
        )
        tasa_exito = round((completadas / len(n_calls)) * 100) if n_calls else 0

        recent_calls = []
        for c in n_calls[:6]:
            props     = c.get("properties") or {}
            sig_acc   = props.get("Siguiente accion", {}).get("select", {}).get("name", "—")
            estado    = props.get("Estado llamada", {}).get("select", {}).get("name", "—")
            resumen   = (props.get("Resumen IA", {}).get("rich_text") or [{}])[0].get("text", {}).get("content", "")
            call_id   = (props.get("Retell Call ID", {}).get("rich_text") or [{}])[0].get("text", {}).get("content", "")
            dur_seg   = props.get("Duracion (seg)", {}).get("number")
            fecha_raw = (props.get("Fecha y hora", {}).get("date") or {}).get("start") or c.get("created_time", "")

            retell_c  = next((rc for rc in calls if rc.get("call_id") == call_id), {})
            from_num  = retell_c.get("from_number") or "—"
            dur_min   = (
                f"{int(retell_c['duration_ms']//60000)}m {int((retell_c['duration_ms']%60000)//1000)}s"
                if retell_c.get("duration_ms") else
                (f"{dur_seg//60}m {dur_seg%60}s" if dur_seg else "—")
            )
            nombre = (retell_c.get("retell_llm_dynamic_variables") or {}).get("nombre") or resumen[:25] or "—"

            import datetime as _dt
            try:
                fecha_fmt = _dt.datetime.fromisoformat(fecha_raw.replace("Z", "+00:00")).strftime("%-d %b, %I:%M %p")
            except Exception:
                fecha_fmt = fecha_raw[:10]

            recent_calls.append({
                "id":          c["id"],
                "nombre":      nombre,
                "caller":      from_num,
                "duracion":    dur_min,
                "resultado":   sig_acc,
                "estado":      estado,
                "resumen":     resumen[:220],
                "fecha":       fecha_fmt,
                "temperatura": (retell_c.get("retell_llm_dynamic_variables") or {}).get("temperatura", "—"),
            })

        # ── Notion: leads activos ───────────────────────────────────────────
        rl = _httpx.post(f"https://api.notion.com/v1/databases/{leads_db}/query",
                         headers=n_headers, json={}, timeout=15)
        leads = (rl.json().get("results") or []) if rl.is_success else []

        temp_count = {"Hot": 0, "Warm": 0, "Cold": 0, "Sin clasificar": 0}
        for l in leads:
            t = (l.get("properties") or {}).get("Temperatura", {}).get("select", {}).get("name", "Sin clasificar")
            temp_count[t if t in temp_count else "Sin clasificar"] += 1

        total_min   = sum(durations)
        costo_semana = round(total_min * 0.07, 2)

        return {
            "kpis": {
                "llamadasHoy":       len(today_calls),
                "llamadasSemana":    len(week_calls),
                "llamadasTotal":     len(calls),
                "citasAgendadas":    citas_agendadas,
                "tasaExito":         tasa_exito,
                "duracionPromedio":  avg_dur,
                "costoSemana":       costo_semana,
                "costoLlamada":      round(costo_semana / len(ended), 3) if ended else 0,
                "leadsActivos":      len(leads),
                "leadsTotal":        len(n_calls),
            },
            "llamadasPorDia":   llamadas_por_dia,
            "temperaturaLeads": [
                {"name": "Hot",           "value": temp_count["Hot"],           "color": "#ef4444"},
                {"name": "Warm",          "value": temp_count["Warm"],          "color": "#f59e0b"},
                {"name": "Cold",          "value": temp_count["Cold"],          "color": "#60a5fa"},
                {"name": "Sin clasificar","value": temp_count["Sin clasificar"],"color": "#3d3b4f"},
            ],
            "recentCalls": recent_calls,
        }

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
