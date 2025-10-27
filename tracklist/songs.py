from typing import Annotated
import json

from fastapi import Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from . import models



def get_state(
        group: str,
    ):
    with Session(models.engine) as session:
        songs = session.exec(select(models.Song).order_by(models.Song.id.desc()).limit(100)).all()
        songs = [song.model_dump() for song in songs]
        # select e.date, u.song_id, s.title from event e join songuse u on u.event_id = e.id join song s on s.id = u.song_id;
        #db.query(Post).join(User).filter(User.id == user_id).all()
        events = session.exec(select(models.Event)
                              .join(models.SongUse, isouter=True).filter(models.Event.id == models.SongUse.event_id)
                              .order_by(models.Event.date.desc()).limit(100)).all()
        events = [event.json() for event in events]
    return {"songs":songs, "events": events}
