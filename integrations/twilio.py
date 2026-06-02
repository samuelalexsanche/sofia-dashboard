from twilio.rest import Client
from config.settings import settings


def get_client() -> Client:
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)
