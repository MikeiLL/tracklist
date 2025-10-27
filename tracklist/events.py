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
        # select e.date, u.song_id, s.title from event e join songuse u on u.event_id = e.id join song s on s.id = u.song_id;
        event = session.exec(select(models.Event).filter(models.Event.id == group))
        print(event)
    return {"event": event}
