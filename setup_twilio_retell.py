"""
Conecta el número Twilio al agente Retell AI:
  1. Importa el número en Retell (necesario para llamadas salientes)
  2. Configura el webhook en Twilio para llamadas entrantes
"""

import os
import httpx
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

RETELL_KEY        = os.environ["RETELL_API_KEY"]
AGENT_ID          = os.environ["RETELL_AGENT_ID"]
TWILIO_SID        = os.environ["TWILIO_ACCOUNT_SID"]
TWILIO_TOKEN      = os.environ["TWILIO_AUTH_TOKEN"]
TWILIO_NUMBER     = os.environ["TWILIO_PHONE_NUMBER"]

RETELL_HEADERS = {
    "Authorization": f"Bearer {RETELL_KEY}",
    "Content-Type": "application/json",
}
RETELL_WEBHOOK = f"https://api.retellai.com/twilio-voice-webhook/{AGENT_ID}"


# ── 1. Importar número en Retell ──────────────────────────────────────────────

def import_number_in_retell():
    print(f"\n[1/2] Importando {TWILIO_NUMBER} en Retell...")

    # Primero verificamos si ya está importado
    r = httpx.get("https://api.retellai.com/v2/list-phone-numbers", headers=RETELL_HEADERS, timeout=15)
    if r.is_success:
        numbers = r.json()
        for n in numbers:
            # La API puede devolver strings o dicts según la versión
            num_str   = n if isinstance(n, str) else n.get("phone_number", "")
            agent_str = "" if isinstance(n, str) else n.get("agent_id", "")
            if num_str == TWILIO_NUMBER:
                print(f"  El numero ya esta importado en Retell (agent: {agent_str or 'sin agente'})")
                if agent_str and agent_str != AGENT_ID:
                    update_number_in_retell(num_str)
                else:
                    print("  Agente ya asignado correctamente.")
                return

    # Importar número nuevo
    payload = {
        "twilio_account_sid":  TWILIO_SID,
        "twilio_auth_token":   TWILIO_TOKEN,
        "phone_number":        TWILIO_NUMBER,
        "agent_id":            AGENT_ID,
    }
    r = httpx.post(
        "https://api.retellai.com/v2/create-phone-number-from-existing-twilio",
        headers=RETELL_HEADERS,
        json=payload,
        timeout=20,
    )
    if r.is_success:
        data = r.json()
        print(f"  Numero importado: {data.get('phone_number')}")
        print(f"  Agente asignado:  {data.get('agent_id')}")
    else:
        print(f"  ERROR al importar: {r.status_code} {r.text[:300]}")


def update_number_in_retell(phone_number: str):
    """Actualiza el agente asignado a un número ya importado."""
    r = httpx.patch(
        f"https://api.retellai.com/v2/update-phone-number/{phone_number}",
        headers=RETELL_HEADERS,
        json={"agent_id": AGENT_ID},
        timeout=15,
    )
    if r.is_success:
        print(f"  Agente actualizado a {AGENT_ID}")
    else:
        print(f"  ERROR al actualizar agente: {r.status_code} {r.text[:200]}")


# ── 2. Configurar webhook en Twilio ──────────────────────────────────────────

def configure_twilio_webhook():
    print(f"\n[2/2] Configurando webhook en Twilio...")
    print(f"  Número:  {TWILIO_NUMBER}")
    print(f"  Webhook: {RETELL_WEBHOOK}")

    client = Client(TWILIO_SID, TWILIO_TOKEN)

    # Buscar el número en la cuenta Twilio
    numbers = client.incoming_phone_numbers.list(phone_number=TWILIO_NUMBER)
    if not numbers:
        print(f"  ERROR: No se encontró {TWILIO_NUMBER} en la cuenta Twilio.")
        return

    phone = numbers[0]
    phone.update(
        voice_url=RETELL_WEBHOOK,
        voice_method="POST",
    )
    print(f"  Webhook configurado correctamente.")
    print(f"  SID del número: {phone.sid}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 55)
    print("CONECTANDO TWILIO -> RETELL AI")
    print("=" * 55)
    print(f"  Número Twilio: {TWILIO_NUMBER}")
    print(f"  Agente Retell: {AGENT_ID}")

    import_number_in_retell()
    configure_twilio_webhook()

    print("\n" + "=" * 55)
    print("LISTO — Llamadas entrantes y salientes habilitadas")
    print("=" * 55)
    print(f"\nVerifica en: https://dashboard.retellai.com/phone-numbers")


if __name__ == "__main__":
    main()
