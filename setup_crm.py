"""Crea las 3 bases de datos del CRM en Notion y carga 15 propiedades de muestra."""

import os
import sys
from datetime import date, timedelta
import httpx
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ["NOTION_API_KEY"]
BASE    = "https://api.notion.com/v1"
HEADERS = {
    "Authorization":  f"Bearer {API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type":   "application/json",
}


def notion(method: str, path: str, body: dict) -> dict:
    r = httpx.request(method, f"{BASE}{path}", headers=HEADERS, json=body, timeout=30)
    if not r.is_success:
        print("ERROR", r.status_code, r.text[:400])
        sys.exit(1)
    return r.json()


def notion_get(path: str) -> dict:
    r = httpx.get(f"{BASE}{path}", headers=HEADERS, timeout=30)
    if not r.is_success:
        print("ERROR", r.status_code, r.text[:400])
        sys.exit(1)
    return r.json()


# ── 1. Pagina padre ───────────────────────────────────────────────────────────

def find_parent_page() -> str:
    pid = os.environ.get("NOTION_PARENT_PAGE_ID", "").strip()
    if pid:
        return pid
    data = notion("POST", "/search", {"filter": {"property": "object", "value": "page"}})
    pages = data.get("results", [])
    if not pages:
        print("ERROR: Comparte una pagina con la integracion primero.")
        sys.exit(1)
    page = pages[0]
    blocks = (page.get("properties", {}).get("title", {}).get("title", []) or
              page.get("title", []))
    title = blocks[0]["text"]["content"] if blocks else page["id"]
    print(f"  Usando pagina: '{title}'  id={page['id']}")
    return page["id"]


# ── 2. Crear bases de datos ───────────────────────────────────────────────────

def create_db(parent_id: str, title: str, emoji: str, properties: dict) -> str:
    body = {
        "parent":     {"type": "page_id", "page_id": parent_id},
        "title":      [{"type": "text", "text": {"content": title}}],
        "icon":       {"type": "emoji", "emoji": emoji},
        "properties": properties,
    }
    db = notion("POST", "/databases", body)
    return db["id"]


def propiedades_schema() -> dict:
    return {
        "Titulo": {"title": {}},
        "Tipo": {"select": {"options": [
            {"name": "Casa",            "color": "orange"},
            {"name": "Departamento",    "color": "blue"},
            {"name": "Penthouse",       "color": "purple"},
            {"name": "Oficina",         "color": "gray"},
            {"name": "Local Comercial", "color": "yellow"},
            {"name": "Terreno",         "color": "green"},
        ]}},
        "Operacion": {"select": {"options": [
            {"name": "Venta", "color": "green"},
            {"name": "Renta", "color": "blue"},
        ]}},
        "Precio":              {"number": {"format": "number_with_commas"}},
        "Colonia":             {"rich_text": {}},
        "Alcaldia": {"select": {"options": [
            {"name": "Miguel Hidalgo", "color": "blue"},
            {"name": "Benito Juarez",  "color": "green"},
            {"name": "Cuauhtemoc",     "color": "orange"},
            {"name": "Coyoacan",       "color": "yellow"},
            {"name": "Alvaro Obregon", "color": "pink"},
            {"name": "Tlalpan",        "color": "purple"},
            {"name": "Iztapalapa",     "color": "gray"},
        ]}},
        "Recamaras":           {"number": {"format": "number"}},
        "Banos":               {"number": {"format": "number"}},
        "m2 Construccion":     {"number": {"format": "number"}},
        "m2 Terreno":          {"number": {"format": "number"}},
        "Estacionamientos":    {"number": {"format": "number"}},
        "Estado": {"select": {"options": [
            {"name": "Disponible",      "color": "green"},
            {"name": "Reservada",       "color": "yellow"},
            {"name": "Vendida/Rentada", "color": "red"},
        ]}},
        "Amenidades": {"multi_select": {"options": [
            {"name": "Elevador",           "color": "blue"},
            {"name": "Gimnasio",           "color": "orange"},
            {"name": "Roof Garden",        "color": "green"},
            {"name": "Seguridad 24h",      "color": "red"},
            {"name": "Alberca",            "color": "blue"},
            {"name": "Jardin",             "color": "green"},
            {"name": "Terraza",            "color": "purple"},
            {"name": "Cuarto de servicio", "color": "gray"},
            {"name": "Bodega",             "color": "brown"},
            {"name": "Area de juegos",     "color": "yellow"},
        ]}},
        "Descripcion":          {"rich_text": {}},
        "Fecha de Publicacion": {"date": {}},
    }


def leads_schema() -> dict:
    return {
        "Nombre":   {"title": {}},
        "Telefono": {"phone_number": {}},
        "Email":    {"email": {}},
        "Temperatura": {"select": {"options": [
            {"name": "Hot",  "color": "red"},
            {"name": "Warm", "color": "orange"},
            {"name": "Cold", "color": "blue"},
        ]}},
        "Estatus": {"select": {"options": [
            {"name": "Pendiente de llamar", "color": "gray"},
            {"name": "En proceso",          "color": "yellow"},
            {"name": "Cita agendada",       "color": "green"},
            {"name": "No contestado",       "color": "orange"},
            {"name": "Sin interes",         "color": "red"},
            {"name": "Cerrado",             "color": "purple"},
        ]}},
        "Resumen de llamada":  {"rich_text": {}},
        "Tipo de busqueda": {"select": {"options": [
            {"name": "Compra",    "color": "green"},
            {"name": "Renta",     "color": "blue"},
            {"name": "Inversion", "color": "purple"},
        ]}},
        "Presupuesto maximo": {"number": {"format": "number_with_commas"}},
        "Zona de interes":    {"rich_text": {}},
        "Recamaras deseadas": {"number": {"format": "number"}},
        "Fuente": {"select": {"options": [
            {"name": "Llamada entrante", "color": "green"},
            {"name": "Llamada saliente", "color": "blue"},
            {"name": "Referido",         "color": "yellow"},
            {"name": "Portal web",       "color": "orange"},
            {"name": "Redes sociales",   "color": "pink"},
        ]}},
        "Fecha primer contacto": {"date": {}},
        "Proxima accion":        {"date": {}},
        "Notas":                 {"rich_text": {}},
    }


def llamadas_schema(leads_db_id: str) -> dict:
    return {
        "ID Llamada": {"title": {}},
        "Lead": {"relation": {
            "database_id": leads_db_id,
            "type": "single_property",
            "single_property": {},
        }},
        "Tipo": {"select": {"options": [
            {"name": "Entrante", "color": "green"},
            {"name": "Saliente", "color": "blue"},
        ]}},
        "Fecha y hora":   {"date": {}},
        "Duracion (seg)": {"number": {"format": "number"}},
        "Estado llamada": {"select": {"options": [
            {"name": "Completada",   "color": "green"},
            {"name": "No contesto",  "color": "orange"},
            {"name": "Buzon de voz", "color": "yellow"},
            {"name": "Error",        "color": "red"},
        ]}},
        "Resumen IA":     {"rich_text": {}},
        "Transcripcion":  {"rich_text": {}},
        "Siguiente accion": {"select": {"options": [
            {"name": "Llamar de nuevo",    "color": "orange"},
            {"name": "Enviar informacion", "color": "blue"},
            {"name": "Agendar cita",       "color": "green"},
            {"name": "Cerrar lead",        "color": "red"},
        ]}},
        "Retell Call ID": {"rich_text": {}},
    }


# ── 3. Datos de muestra ───────────────────────────────────────────────────────

PROPIEDADES = [
    ("Penthouse con vista panoramica en Polanco",
     "Penthouse","Venta",12500000,"Polanco V Seccion","Miguel Hidalgo",
     3,3,280,0,2,"Disponible",
     ["Elevador","Roof Garden","Seguridad 24h","Terraza"],
     "Espectacular penthouse con terraza privada y vista al Bosque de Chapultepec. Acabados de lujo y vestidor en recamara principal."),

    ("Departamento moderno con jardin en Condesa",
     "Departamento","Renta",28000,"La Condesa","Cuauhtemoc",
     2,2,110,0,1,"Disponible",
     ["Elevador","Terraza","Seguridad 24h"],
     "Luminoso departamento en planta baja con acceso a jardin interior. A dos cuadras del Parque Mexico, ideal para mascotas."),

    ("Casa familiar con alberca en Coyoacan",
     "Casa","Venta",6800000,"Jardines del Pedregal","Coyoacan",
     4,3,320,450,2,"Disponible",
     ["Alberca","Jardin","Cuarto de servicio","Bodega"],
     "Amplia residencia en privada cerrada. Sala-comedor, estudio, area de asadores y jardin con alberca climatizada."),

    ("Loft industrial chic en Roma Norte",
     "Departamento","Renta",22000,"Roma Norte","Cuauhtemoc",
     1,1,75,0,1,"Disponible",
     ["Elevador","Terraza"],
     "Loft de doble altura con acabados industriales, cocina equipada y terraza privada. En edificio boutique a pasos de los mejores restaurantes."),

    ("Departamento de lujo en Santa Fe entregado",
     "Departamento","Venta",7200000,"Santa Fe","Alvaro Obregon",
     3,2,195,0,2,"Disponible",
     ["Elevador","Gimnasio","Alberca","Seguridad 24h","Roof Garden"],
     "Departamento en torre de lujo con amenidades de hotel. Vista a la ciudad, cocina integral de importacion. Excelente inversion."),

    ("Residencia en privada exclusiva en Lomas de Chapultepec",
     "Casa","Venta",22000000,"Lomas de Chapultepec","Miguel Hidalgo",
     5,5,650,900,3,"Disponible",
     ["Alberca","Jardin","Cuarto de servicio","Bodega","Seguridad 24h","Gimnasio"],
     "Majestuosa residencia en privada de lujo. Biblioteca, cine en casa, cancha de squash y amplio jardin. Una joya arquitectonica."),

    ("Departamento ideal para parejas en Narvarte",
     "Departamento","Renta",16500,"Narvarte Poniente","Benito Juarez",
     2,1,80,0,1,"Disponible",
     ["Elevador","Bodega"],
     "Departamento recien remodelado en colonia tranquila. Cerca del metro, supermercados y excelente oferta gastronomica."),

    ("Oficina premium con salas de juntas en Polanco",
     "Oficina","Renta",58000,"Polanco II Seccion","Miguel Hidalgo",
     0,2,180,0,3,"Disponible",
     ["Elevador","Seguridad 24h","Gimnasio"],
     "Piso completo en torre corporativa clase A. Planta abierta adaptable, dos salas de juntas y terraza. Ideal para despachos profesionales."),

    ("Departamento luminoso con terraza en Del Valle",
     "Departamento","Venta",4100000,"Del Valle Sur","Benito Juarez",
     2,2,120,0,1,"Disponible",
     ["Elevador","Terraza","Bodega"],
     "Departamento en planta alta con excelente iluminacion natural y terraza de 25m2. Acabados de primera, zona supercentrica."),

    ("Casa con potencial de inversion en Tlalpan",
     "Casa","Venta",3200000,"Pedregal de San Nicolas","Tlalpan",
     3,2,180,200,1,"Disponible",
     ["Jardin","Cuarto de servicio"],
     "Casa solida en zona residencial consolidada. Excelente oportunidad para remodelar o aprovechar como inversion. Escrituras en orden."),

    ("Departamento nuevo sin estrenar en Insurgentes",
     "Departamento","Renta",19500,"Insurgentes Mixcoac","Alvaro Obregon",
     2,2,95,0,1,"Disponible",
     ["Elevador","Roof Garden","Seguridad 24h","Area de juegos"],
     "Departamento de estreno en edificio nuevo. Cocina con isla, closets de madera y ventanales de piso a techo."),

    ("Local comercial en corredor de alto trafico en Juarez",
     "Local Comercial","Renta",42000,"Juarez","Cuauhtemoc",
     0,1,90,0,0,"Disponible",
     [],
     "Local en planta baja sobre Paseo de la Reforma. Escaparate de 6m de frente, bodega posterior. Flujo peatonal de 15,000 personas/dia."),

    ("Departamento ejecutivo amueblado en Anzures",
     "Departamento","Renta",32000,"Anzures","Miguel Hidalgo",
     2,2,130,0,1,"Disponible",
     ["Elevador","Seguridad 24h","Gimnasio","Terraza"],
     "Completamente amueblado y equipado. Listo para habitar. Ideal para ejecutivos en asignacion temporal. Contrato minimo 6 meses."),

    ("Casa estilo contemporaneo en Pedregal de San Angel",
     "Casa","Venta",14500000,"Pedregal de San Angel","Alvaro Obregon",
     4,4,480,600,2,"Reservada",
     ["Alberca","Jardin","Cuarto de servicio","Bodega","Terraza"],
     "Arquitectura contemporanea de autor con jardin disenado por paisajista. Materiales de importacion y automatizacion del hogar."),

    ("Departamento starter con roof garden en Portales",
     "Departamento","Venta",2650000,"Portales Norte","Benito Juarez",
     2,1,72,0,1,"Disponible",
     ["Elevador","Roof Garden","Bodega"],
     "Excelente primera vivienda o inversion para rentar. Edificio con roof garden y asadores. Zona con alta plusvalia y gran conectividad."),
]


def cargar_propiedades(db_id: str):
    base_date = date(2024, 1, 15)
    for i, row in enumerate(PROPIEDADES):
        titulo, tipo, op, precio, col, alc, rec, ban, m2c, m2t, est_n, estado, amenidades, desc = row
        props = {
            "Titulo":               {"title":     [{"text": {"content": titulo}}]},
            "Tipo":                 {"select":    {"name": tipo}},
            "Operacion":            {"select":    {"name": op}},
            "Precio":               {"number":    precio},
            "Colonia":              {"rich_text": [{"text": {"content": col}}]},
            "Alcaldia":             {"select":    {"name": alc}},
            "Recamaras":            {"number":    rec},
            "Banos":                {"number":    ban},
            "m2 Construccion":      {"number":    m2c},
            "m2 Terreno":           {"number":    m2t},
            "Estacionamientos":     {"number":    est_n},
            "Estado":               {"select":    {"name": estado}},
            "Descripcion":          {"rich_text": [{"text": {"content": desc}}]},
            "Fecha de Publicacion": {"date":      {"start": (base_date + timedelta(days=i*12)).isoformat()}},
        }
        if amenidades:
            props["Amenidades"] = {"multi_select": [{"name": a} for a in amenidades]}

        notion("POST", "/pages", {"parent": {"database_id": db_id}, "properties": props})
        print(f"  + {titulo[:58]}...")


# ── 4. Actualizar .env ────────────────────────────────────────────────────────

def update_env(parent_id: str, prop_id: str, leads_id: str, calls_id: str):
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_path, "r", encoding="utf-8") as f:
        content = f.read()

    additions = f"""
# ─────────────────────────────────────────
#  NOTION — IDs de bases de datos CRM
# ─────────────────────────────────────────
NOTION_PARENT_PAGE_ID={parent_id}
NOTION_PROPIEDADES_DB_ID={prop_id}
NOTION_LEADS_DB_ID={leads_id}
NOTION_LLAMADAS_DB_ID={calls_id}
"""
    with open(env_path, "w", encoding="utf-8") as f:
        f.write(content.rstrip() + "\n" + additions)
    print("  .env actualizado con los IDs.")


# ── 5. Main ───────────────────────────────────────────────────────────────────

def main():
    print("\n[1/5] Buscando pagina padre...")
    parent_id = find_parent_page()

    print("[2/5] Creando base: Propiedades...")
    prop_id = create_db(parent_id, "Propiedades", "🏠", propiedades_schema())
    print(f"      ID: {prop_id}")

    print("[3/5] Creando base: Leads...")
    leads_id = create_db(parent_id, "Leads", "👥", leads_schema())
    print(f"      ID: {leads_id}")

    print("[4/5] Creando base: Historial de Llamadas...")
    calls_id = create_db(parent_id, "Historial de Llamadas", "📞", llamadas_schema(leads_id))
    print(f"      ID: {calls_id}")

    print("[5/5] Cargando 15 propiedades de muestra...")
    cargar_propiedades(prop_id)

    print("\n[6/6] Guardando IDs en .env...")
    update_env(parent_id, prop_id, leads_id, calls_id)

    pid_clean = parent_id.replace("-", "")
    print("\n" + "=" * 58)
    print("CRM CREADO CON EXITO")
    print("=" * 58)
    print(f"URL: https://www.notion.so/{pid_clean}")
    print("=" * 58)


if __name__ == "__main__":
    main()
