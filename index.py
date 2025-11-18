from typing import Annotated
import json
from collections import defaultdict

from fastapi import Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select
from datetime import datetime

from . import models
from .utils import WebSocketHandler
from . import database

class index(WebSocketHandler):

    async def get_state(
            self,
            group: int,
        ):
        with Session(models.engine) as session:
            events = database.dict_query("""
            select extract(epoch from e.date)::int date, e.id, e.title eventtitle,
                    e.presenter, e.contact, s.title songtitle, s.song_number, u.usage
            from event e
            left join songuse u on u.event_id = e.id
            left join song s on u.song_id = s.id
            where e.date >= CURRENT_DATE order by date, songtitle;
            """)
            eventsdict = defaultdict(dict)
            # TODO maybe create Pydantic/SqlAlchemy model and fetch that does this.
            #events = session.exec(select(models.Event).order_by(models.Event.date.asc()).filter(models.Event.date >= datetime.now()).limit(10)).all()
            #events = [event.json() for event in events]
            for e in events:
                eventdate = e["date"]
                eventsdict[eventdate]["id"] = e["id"]
                eventsdict[eventdate]["date"] = e["date"]
                eventsdict[eventdate]["title"] = e["eventtitle"]
                eventsdict[eventdate]["presenter"] = e["presenter"]
                eventsdict[eventdate]["contact"] = e["contact"]
                if not "songs" in eventsdict[eventdate]:
                    eventsdict[eventdate]["songs"] = []
                if e.get("songtitle"):
                    eventsdict[eventdate]["songs"].append({
                        "title": e.get("songtitle", ""),
                        "song_number": e.get("song_number", ""),
                        "usage": e.get("usage", ""),
                    })
        return {"events": eventsdict}
