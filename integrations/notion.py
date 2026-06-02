from notion_client import Client
from config.settings import settings


def get_client() -> Client:
    return Client(auth=settings.notion_api_key)
