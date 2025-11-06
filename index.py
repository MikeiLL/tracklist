from typing import Annotated
import json

from fastapi import Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select
from datetime import datetime

from . import models
from .utils import WebSocketHandler

class index(WebSocketHandler):

    async def get_state(
            self,
            group: int,
        ):
        with Session(models.engine) as session:
            songs = session.exec(select(models.Song).order_by(models.Song.id.desc()).limit(10)).all()
            songs = [song.model_dump() for song in songs]
            # select e.date, u.song_id, s.title from event e join songuse u on u.event_id = e.id join song s on s.id = u.song_id;
            events = session.exec(select(models.Event).order_by(models.Event.date.asc()).filter(models.Event.date >= datetime.now()).limit(10)).all()
            events = [event.json() for event in events]
        return {"songs":songs, "events": events}
