"""
Conecta el numero Twilio al agente Retell via SIP Trunking (metodo oficial actual).

Pasos que realiza:
  1. Crea un Elastic SIP Trunk en Twilio
  2. Configura Termination (Twilio -> Retell, para salientes)
  3. Configura Origination (Retell -> Twilio, para entrantes)
  4. Mueve el numero de Twilio al SIP Trunk
  5. Importa el numero en Retell y lo asocia al agente
"""

import os
import httpx
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

RETELL_KEY    = os.environ["RETELL_API_KEY"]
AGENT_ID      = os.environ["RETELL_AGENT_ID"]
TWILIO_SID    = os.environ["TWILIO_ACCOUNT_SID"]
TWILIO_TOKEN  = os.environ["TWILIO_AUTH_TOKEN"]
TWILIO_NUMBER = os.environ["TWILIO_PHONE_NUMBER"]   # +17744930842

RETELL_HEADERS = {
    "Authorization": f"Bearer {RETELL_KEY}",
    "Content-Type": "application/json",
}

# SIP servers de Retell
RETELL_SIP_SERVER  = "sip.retellai.com"
# IP block de Retell para whitelist en Termination
RETELL_IP_BLOCK    = "18.98.16.120"


# ── 1. Crear SIP Trunk en Twilio ──────────────────────────────────────────────

def create_sip_trunk(client: Client) -> tuple[str, str]:
    """
    Crea un Elastic SIP Trunk y devuelve (trunk_sid, termination_uri).
    Si ya existe uno llamado 'Retell-Inmobiliaria', lo reutiliza.
    """
    print("\n[1/5] Creando Elastic SIP Trunk en Twilio...")

    trunks = client.trunking.trunks.list()
    for t in trunks:
        if t.friendly_name == "Retell-Inmobiliaria":
            term_uri = f"{t.sid.lower()}.pstn.twilio.com"
            print(f"  SIP Trunk existente reutilizado: {t.sid}")
            print(f"  Termination URI: {term_uri}")
            return t.sid, term_uri

    trunk = client.trunking.trunks.create(friendly_name="Retell-Inmobiliaria")
    term_uri = f"{trunk.sid.lower()}.pstn.twilio.com"
    print(f"  SIP Trunk creado: {trunk.sid}")
    print(f"  Termination URI:  {term_uri}")
    return trunk.sid, term_uri


# ── 2. Configurar Termination (salientes: Twilio -> Retell) ───────────────────

def configure_termination(client: Client, trunk_sid: str):
    """
    Agrega la IP de Retell como origen permitido en el Termination del trunk.
    Esto permite que Retell inicie llamadas salientes a traves de Twilio.
    """
    print("\n[2/5] Configurando Termination (salientes Twilio -> Retell)...")

    trunk = client.trunking.trunks(trunk_sid).fetch()

    # Agregar credential list o IP access control list con la IP de Retell
    # Twilio requiere al menos un Access Control List para el trunk
    # Creamos uno con la IP de Retell
    try:
        acl = client.sip.ip_access_control_lists.create(
            friendly_name="Retell-ACL"
        )
        # Agregar la IP de Retell
        client.sip.ip_access_control_lists(acl.sid).ip_addresses.create(
            friendly_name="Retell-Primary",
            ip_address=RETELL_IP_BLOCK,
            cidr_prefix_length=30,
        )
        # Asociar ACL al trunk
        client.trunking.trunks(trunk_sid).ip_access_control_lists.create(
            ip_access_control_list_sid=acl.sid
        )
        print(f"  ACL creada con IP {RETELL_IP_BLOCK}/30 y asociada al trunk.")
    except Exception as e:
        # Si ya existe o hay error, continuamos — no bloquea el flujo
        print(f"  Nota en ACL: {e}")
        print("  Continuando...")


# ── 3. Configurar Origination (entrantes: Retell -> Twilio) ──────────────────

def configure_origination(client: Client, trunk_sid: str):
    """
    Apunta el Origination del trunk al SIP server de Retell.
    Esto permite que Twilio reciba llamadas entrantes y las enrute a Retell.
    """
    print("\n[3/5] Configurando Origination (entrantes -> Retell)...")

    retell_sip_uri = f"sip:{RETELL_SIP_SERVER}"

    # Verificar si ya existe un origination URL para Retell
    existing = client.trunking.trunks(trunk_sid).origination_urls.list()
    for o in existing:
        if RETELL_SIP_SERVER in o.sip_url:
            print(f"  Origination ya configurado: {o.sip_url}")
            return

    orig = client.trunking.trunks(trunk_sid).origination_urls.create(
        friendly_name="Retell-Origination",
        sip_url=retell_sip_uri,
        priority=10,
        weight=10,
        enabled=True,
    )
    print(f"  Origination configurado: {orig.sip_url}")


# ── 4. Mover numero al SIP Trunk ──────────────────────────────────────────────

def move_number_to_trunk(client: Client, trunk_sid: str):
    """
    Asocia el numero de Twilio al SIP Trunk.
    """
    print(f"\n[4/5] Moviendo {TWILIO_NUMBER} al SIP Trunk...")

    # Verificar si ya esta asociado
    trunk_numbers = client.trunking.trunks(trunk_sid).phone_numbers.list()
    for n in trunk_numbers:
        if n.phone_number == TWILIO_NUMBER:
            print(f"  El numero ya esta en el trunk.")
            return

    # Obtener SID del numero
    numbers = client.incoming_phone_numbers.list(phone_number=TWILIO_NUMBER)
    if not numbers:
        print(f"  ERROR: No se encontro {TWILIO_NUMBER} en la cuenta Twilio.")
        return

    phone_sid = numbers[0].sid

    # Asociar al trunk
    client.trunking.trunks(trunk_sid).phone_numbers.create(
        phone_number_sid=phone_sid
    )
    print(f"  Numero {TWILIO_NUMBER} movido al trunk correctamente.")


# ── 5. Importar numero en Retell ──────────────────────────────────────────────

def import_number_in_retell(termination_uri: str):
    """
    Importa el numero en Retell usando el Termination URI del SIP Trunk
    y lo asocia al agente.
    """
    print(f"\n[5/5] Importando numero en Retell...")

    # Verificar si ya esta importado
    r = httpx.get(
        "https://api.retellai.com/v2/list-phone-numbers",
        headers=RETELL_HEADERS,
        timeout=15,
    )
    if r.is_success:
        items = r.json().get("items", [])
        for item in items:
            if item.get("phone_number") == TWILIO_NUMBER:
                print(f"  El numero ya esta en Retell.")
                _bind_agent(item.get("phone_number_id", item.get("id", "")))
                return

    payload = {
        "phone_number":    TWILIO_NUMBER,
        "termination_uri": termination_uri,
        "inbound_agents":  [{"agent_id": AGENT_ID, "weight": 100}],
        "outbound_agents": [{"agent_id": AGENT_ID, "weight": 100}],
        "nickname":        "Sofia - Inmobiliaria",
    }

    r = httpx.post(
        "https://api.retellai.com/import-phone-number",
        headers=RETELL_HEADERS,
        json=payload,
        timeout=20,
    )

    if r.is_success:
        data = r.json()
        print(f"  Numero importado: {data.get('phone_number')}")
        print(f"  ID en Retell:     {data.get('phone_number_id', data.get('id', 'N/A'))}")
    else:
        print(f"  ERROR al importar: {r.status_code}")
        print(f"  Respuesta: {r.text[:400]}")


def _bind_agent(phone_number: str):
    if not phone_number:
        return
    r = httpx.patch(
        f"https://api.retellai.com/update-phone-number/{phone_number}",
        headers=RETELL_HEADERS,
        json={
            "inbound_agent_id":  AGENT_ID,
            "outbound_agent_id": AGENT_ID,
        },
        timeout=15,
    )
    if r.is_success:
        print(f"  Agente {AGENT_ID} asignado correctamente.")
    else:
        print(f"  ERROR al asignar agente: {r.status_code} {r.text[:200]}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("SETUP SIP TRUNKING: TWILIO -> RETELL")
    print("=" * 60)
    print(f"  Numero:       {TWILIO_NUMBER}")
    print(f"  Agente:       {AGENT_ID}")

    client = Client(TWILIO_SID, TWILIO_TOKEN)

    trunk_sid, termination_uri = create_sip_trunk(client)
    configure_termination(client, trunk_sid)
    configure_origination(client, trunk_sid)
    move_number_to_trunk(client, trunk_sid)
    import_number_in_retell(termination_uri)

    print("\n" + "=" * 60)
    print("COMPLETADO")
    print("=" * 60)
    print(f"  Trunk SIP:       {trunk_sid}")
    print(f"  Termination URI: {termination_uri}")
    print(f"\nVerifica en: https://dashboard.retellai.com/phone-numbers")
    print(f"Twilio trunks: https://console.twilio.com/us1/develop/voice/trunking/trunks")


if __name__ == "__main__":
    main()
