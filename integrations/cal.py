import httpx
from config.settings import settings

CAL_BASE_URL = "https://api.cal.com/v2"


def get_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.cal_api_key}",
        "Content-Type": "application/json",
    }


def get_client() -> httpx.Client:
    return httpx.Client(base_url=CAL_BASE_URL, headers=get_headers())
