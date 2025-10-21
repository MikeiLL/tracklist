from typing import Union, Annotated

from fastapi import FastAPI, Query, Depends
from pydantic import BaseModel
from datetime import datetime
import models
from sqlmodel import Session, select

app = FastAPI()


class Hymn(BaseModel):
    title: str
    service_date: datetime
    is_offer: Union[bool, None] = None

def get_session():
    with Session(models.engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]

@app.post("/songs/")
def create_song(song: models.Song, session: SessionDep) -> models.Song:
    session.add(song)
    session.commit()
    session.refresh(song)
    return song

@app.get("/songs/")
def read_songs(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[models.Song]:
    songs = session.exec(select(models.Song).offset(offset).limit(limit)).all()
    return songs

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/hymns/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.put("/hymns/{hymn_id}")
def update_item(hymn_id: int, hymn: Hymn):
    return {"hymn_title": hymn.title, "service_date": hymn.service_date, "hymn_id": hymn_id}
