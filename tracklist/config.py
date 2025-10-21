from fastapi import FastAPI
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # TODO maybe regex db string
    db_connection_string: str = "postgresql://mikekilmer:@localhost/playground"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
app = FastAPI()

@app.get("/info")
async def info():
    return {
        "db_connection_string": settings.db_connection_string,
    }
