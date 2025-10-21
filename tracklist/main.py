from typing import Union

from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()


class Hymn(BaseModel):
    title: str
    service_date: datetime
    is_offer: Union[bool, None] = None


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/hymns/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.put("/hymns/{hymn_id}")
def update_item(hymn_id: int, hymn: Hymn):
    return {"hymn_title": hymn.title, "service_date": hymn.service_date, "hymn_id": hymn_id}
