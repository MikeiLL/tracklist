from typing import Union, Annotated

from fastapi import FastAPI, Query, Depends, HTTPException
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


@app.get("/songs/{song_id}")
def read_song(song_id: int, session: SessionDep) -> models.Song:
    song = session.get(models.Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="models.Song not found")
    return song


@app.delete("/songs/{song_id}")
def delete_song(song_id: int, session: SessionDep):
    song = session.get(models.Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="models.Song not found")
    session.delete(song)
    session.commit()
    return {"ok": True}


@app.put("/songs/{song_id}")
def update_song(song_id: int, session: SessionDep) -> models.Song:
    song = session.get(models.Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="models.Song not found")
    session.update(song)
    session.commit()
    session.refresh(song)


@app.get("/")
def read_root():
    return {"Hello": "World"}
