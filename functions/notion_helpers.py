"""Helpers de bajo nivel para la API de Notion (httpx directo, sin notion_client)."""

import os
import httpx

_BASE = "https://api.notion.com/v1"
_VER  = "2022-06-28"


def _h() -> dict:
    return {
        "Authorization":  f"Bearer {os.environ['NOTION_API_KEY']}",
        "Notion-Version": _VER,
        "Content-Type":   "application/json",
    }


def query_db(db_id: str, filter_: dict = None, sorts: list = None, page_size: int = 10) -> list:
    body: dict = {"page_size": page_size}
    if filter_:
        body["filter"] = filter_
    if sorts:
        body["sorts"] = sorts
    r = httpx.post(f"{_BASE}/databases/{db_id}/query", headers=_h(), json=body, timeout=20)
    r.raise_for_status()
    return r.json().get("results", [])


def create_page(db_id: str, props: dict) -> dict:
    r = httpx.post(
        f"{_BASE}/pages",
        headers=_h(),
        json={"parent": {"database_id": db_id}, "properties": props},
        timeout=20,
    )
    r.raise_for_status()
    return r.json()


def update_page(page_id: str, props: dict) -> dict:
    r = httpx.patch(
        f"{_BASE}/pages/{page_id}",
        headers=_h(),
        json={"properties": props},
        timeout=20,
    )
    r.raise_for_status()
    return r.json()


def find_lead_by_phone(phone: str) -> dict | None:
    results = query_db(
        os.environ["NOTION_LEADS_DB_ID"],
        filter_={"property": "Telefono", "phone_number": {"equals": phone}},
        page_size=1,
    )
    return results[0] if results else None


# ── Helpers de lectura de propiedades Notion ─────────────────────────────────

def text(prop: dict) -> str:
    items = prop.get("rich_text") or prop.get("title") or []
    return items[0]["text"]["content"] if items else ""


def select_name(prop: dict) -> str:
    s = prop.get("select")
    return s["name"] if s else ""


def number(prop: dict) -> float | None:
    return prop.get("number")
