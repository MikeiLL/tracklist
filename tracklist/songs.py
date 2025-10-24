from typing import Annotated
import json

from fastapi import Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from . import models



def get_state(
        group: str,
        offset: int = 0,
        limit: Annotated[int, Query(le=100)] = 100,
    ):
    with Session(models.engine) as session:
        songs = session.exec(select(models.Song).offset(offset).limit(limit)).all()
        songs = [song.model_dump_json() for song in songs]
    return {"songs":songs}
