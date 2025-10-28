from fastapi import FastAPI
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # TODO maybe regex db string
    db_connection_string: str = "postgresql://mikekilmer:@localhost/playground"
    secret_key: str = "e0a90a1a7f8503c928185bf8ae9c2515d77c07bccfab2cb25a9cd66adab983d9"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
app = FastAPI()

@app.get("/info")
async def info():
    return {
        "db_connection_string": settings.db_connection_string,
    }
