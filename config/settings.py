import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self):
        self.retell_api_key = self._require("RETELL_API_KEY")
        self.twilio_account_sid = self._require("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = self._require("TWILIO_AUTH_TOKEN")
        self.twilio_phone_number = self._require("TWILIO_PHONE_NUMBER")
        self.notion_api_key = self._require("NOTION_API_KEY")
        self.cal_api_key = self._require("CAL_API_KEY")
        self.cal_username = self._require("CAL_USERNAME")
        self.anthropic_api_key = self._require("ANTHROPIC_API_KEY")

    @staticmethod
    def _require(key: str) -> str:
        value = os.environ.get(key)
        if not value:
            raise EnvironmentError(f"Falta variable de entorno: {key}")
        return value


settings = Settings()
