"""Tests rapidos de las 5 herramientas. Corre con: python test_tools.py"""

import sys
import io
import traceback
from dotenv import load_dotenv

# Forzar UTF-8 en consola Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

load_dotenv()

from functions.tools import (
    buscar_propiedades,
    guardar_lead,
    actualizar_lead,
    analizar_llamada,
    agendar_cita,
)

PASS = "PASS"
FAIL = "FAIL"
SKIP = "SKIP"

results = []
test_lead_id = None


def run(label: str, fn, *args, **kwargs):
    try:
        out = fn(*args, **kwargs)
        print(f"\n[{PASS}] {label}")
        print(f"       result: {out.get('result', '')}")
        extra = {k: v for k, v in out.items() if k != "result"}
        if extra:
            print(f"       data:   {extra}")
        results.append((PASS, label))
        return out
    except Exception as e:
        print(f"\n[{FAIL}] {label}")
        print(f"       error:  {e}")
        traceback.print_exc()
        results.append((FAIL, label))
        return {}


# ── TEST 1: buscar_propiedades ────────────────────────────────────────────────
print("\n" + "="*60)
print("TEST 1 — Buscar propiedades (Venta en Polanco, max $15M)")
print("="*60)
run(
    "buscar_propiedades(operacion=Venta, zona=Polanco, presupuesto_max=15_000_000)",
    buscar_propiedades,
    operacion="Venta",
    zona="Polanco",
    presupuesto_max=15_000_000,
)

print("\n" + "="*60)
print("TEST 1b — Buscar propiedades (Renta, 2 recamaras, max $25,000)")
print("="*60)
run(
    "buscar_propiedades(operacion=Renta, recamaras=2, presupuesto_max=25000)",
    buscar_propiedades,
    operacion="Renta",
    recamaras=2,
    presupuesto_max=25_000,
)


# ── TEST 2: guardar_lead ──────────────────────────────────────────────────────
print("\n" + "="*60)
print("TEST 2 — Guardar nuevo lead")
print("="*60)
out2 = run(
    "guardar_lead(Carlos Mendoza, Condesa, Compra, $5M)",
    guardar_lead,
    nombre="Carlos Mendoza (TEST)",
    telefono="+525512345678",
    email="carlos.test@email.com",
    tipo_busqueda="Compra",
    presupuesto=5_000_000,
    zona_interes="Condesa",
    recamaras_deseadas=2,
    notas="Lead de prueba — borrar después",
)
test_lead_id = out2.get("lead_id")


# ── TEST 3: actualizar_lead ───────────────────────────────────────────────────
print("\n" + "="*60)
print("TEST 3 — Actualizar lead (temperatura Hot, estatus En proceso)")
print("="*60)
if test_lead_id:
    run(
        "actualizar_lead(lead_id, Hot, En proceso)",
        actualizar_lead,
        lead_id=test_lead_id,
        temperatura="Hot",
        estatus="En proceso",
        notas="Cliente muy interesado, llamar mañana antes de las 12.",
    )
else:
    print(f"[{SKIP}] actualizar_lead — no se creó el lead en TEST 2")
    results.append((SKIP, "actualizar_lead"))


# ── TEST 4: analizar_llamada (llama a Claude) ─────────────────────────────────
print("\n" + "="*60)
print("TEST 4 — Análisis post-llamada con Claude Sonnet 4.5")
print("="*60)
TRANSCRIPT_FAKE = """
Agente: Buenos días, gracias por llamar a Inmobiliaria Nuevo. Le habla Samuel, ¿en qué le puedo ayudar?
Cliente: Hola, buenas. Mire, estoy buscando un departamento para comprar en la zona de Condesa o Roma Norte.
Agente: ¡Perfecto! ¿Tiene algún presupuesto en mente?
Cliente: Sí, puedo pagar hasta unos cuatro millones de pesos. Necesito mínimo dos recámaras.
Agente: Entendido. ¿Me podría dar su nombre para registrar sus datos?
Cliente: Claro, soy Carlos Mendoza.
Agente: Perfecto Carlos. Tenemos algunos departamentos disponibles en esa zona. ¿Le gustaría agendar una visita esta semana?
Cliente: Sí, me interesaría mucho. ¿Tienen algo el viernes?
Agente: Tenemos disponibilidad el viernes a las 11am. ¿Le funciona?
Cliente: Perfecto, ahí estaré.
Agente: Excelente. Le enviaré la confirmación. ¿Su teléfono es el que aparece en llamada?
Cliente: Sí, ese mismo.
Agente: Perfecto Carlos, muchas gracias. Hasta el viernes.
""".strip()

run(
    "analizar_llamada(transcript=Carlos Mendoza, cita viernes)",
    analizar_llamada,
    transcript=TRANSCRIPT_FAKE,
    call_id="TEST-CALL-001",
    lead_id=test_lead_id,
)


# ── TEST 5: agendar_cita ──────────────────────────────────────────────────────
print("\n" + "="*60)
print("TEST 5 — Agendar cita (solo si CAL_EVENT_TYPE_ID está configurado)")
print("="*60)
import os
cal_event = os.environ.get("CAL_EVENT_TYPE_ID", "")
if not cal_event:
    print(f"[{SKIP}] agendar_cita — CAL_EVENT_TYPE_ID no configurado en .env")
    print("       Para habilitarlo: agrega CAL_EVENT_TYPE_ID=<tu_id> en el .env")
    results.append((SKIP, "agendar_cita"))
else:
    run(
        "agendar_cita(Carlos Mendoza, 2026-06-20T11:00:00)",
        agendar_cita,
        nombre_cliente="Carlos Mendoza",
        email_cliente="carlos.test@email.com",
        fecha_iso="2026-06-20T11:00:00",
        propiedad_titulo="Loft industrial chic en Roma Norte",
        lead_id=test_lead_id,
    )


# ── Resumen final ─────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("RESUMEN")
print("="*60)
for status, label in results:
    icon = "OK  " if status == PASS else ("SKIP" if status == SKIP else "FAIL")
    print(f"  [{icon}] {label}")

failed = [r for r in results if r[0] == FAIL]
if failed:
    print(f"\n{len(failed)} test(s) fallaron.")
    sys.exit(1)
else:
    print(f"\nTodos los tests pasaron ({len([r for r in results if r[0] == PASS])} OK, {len([r for r in results if r[0] == SKIP])} skipped).")
