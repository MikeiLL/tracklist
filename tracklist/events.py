from typing import Annotated
import json

from fastapi import Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from . import models



def get_state(
        group: int,
    ):
    with Session(models.engine) as session:
        event = session.exec(select(models.Event).filter(models.Event.id == group)).one()
    return {"event": event.json()}
