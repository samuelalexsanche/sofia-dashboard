"""FastAPI router que expone las 5 herramientas como endpoints HTTP para Retell AI."""

import json

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from functions.tools import (
    buscar_propiedades,
    guardar_lead,
    agendar_cita,
    actualizar_lead,
    analizar_llamada,
)

router = APIRouter(prefix="/tools", tags=["tools"])


async def _parse_body(request: Request) -> dict:
    """Lee el body con manejo seguro de encoding — Retell a veces manda bytes inválidos."""
    try:
        return await request.json()
    except Exception:
        raw = await request.body()
        try:
            return json.loads(raw.decode("utf-8", errors="replace"))
        except Exception:
            return {}


def _args(body: dict) -> dict:
    """Retell envuelve los argumentos en 'args' o los manda directos según la versión."""
    return body.get("args", body.get("arguments", body))


@router.post("/buscar-propiedades")
async def ep_buscar_propiedades(request: Request):
    a = _args(await _parse_body(request))
    result = buscar_propiedades(
        operacion    = a.get("operacion"),
        zona         = a.get("zona"),
        presupuesto_max = a.get("presupuesto_max"),
        recamaras    = a.get("recamaras"),
        tipo         = a.get("tipo"),
    )
    return JSONResponse(result)


@router.post("/guardar-lead")
async def ep_guardar_lead(request: Request):
    a = _args(await _parse_body(request))
    result = guardar_lead(
        nombre             = a["nombre"],
        telefono           = a["telefono"],
        email              = a.get("email"),
        tipo_busqueda      = a.get("tipo_busqueda"),
        presupuesto        = a.get("presupuesto"),
        zona_interes       = a.get("zona_interes"),
        recamaras_deseadas = a.get("recamaras_deseadas"),
        fuente             = a.get("fuente", "Llamada entrante"),
        notas              = a.get("notas"),
    )
    return JSONResponse(result)


@router.post("/agendar-cita")
async def ep_agendar_cita(request: Request):
    a = _args(await _parse_body(request))
    result = agendar_cita(
        nombre_cliente   = a["nombre_cliente"],
        fecha_iso        = a["fecha_iso"],
        email_cliente    = a.get("email_cliente"),   # opcional — STT puede mandar basura
        propiedad_titulo = a.get("propiedad_titulo"),
        lead_id          = a.get("lead_id"),
        telefono         = a.get("telefono"),
    )
    return JSONResponse(result)


@router.post("/actualizar-lead")
async def ep_actualizar_lead(request: Request):
    a = _args(await _parse_body(request))
    result = actualizar_lead(
        lead_id         = a.get("lead_id"),
        telefono        = a.get("telefono"),
        temperatura     = a.get("temperatura"),
        estatus         = a.get("estatus"),
        notas           = a.get("notas"),
        resumen_llamada = a.get("resumen_llamada"),
    )
    return JSONResponse(result)


@router.post("/analizar-llamada")
async def ep_analizar_llamada(request: Request):
    a = _args(await _parse_body(request))
    result = analizar_llamada(
        transcript = a["transcript"],
        call_id    = a.get("call_id"),
        lead_id    = a.get("lead_id"),
        telefono   = a.get("telefono"),
    )
    return JSONResponse(result)
