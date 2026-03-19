from typing import Annotated
import json
from collections import defaultdict, Counter
from sqlmodel import Session, select
from datetime import datetime
from pprint import pprint

from . import models
from .utils import WebSocketHandler
from . import database
import functools
import hashlib

@functools.cache # don't redo all this work for each call to get state
def build_tag_info(tag):
    return {
        "color": "#" + hashlib.md5(tag.encode()).hexdigest()[0:6]
    }

class analysis(WebSocketHandler):

  async def get_state(
            self,
            group: int,
        ):
        with Session(models.engine) as session:
            data = database.dict_query("""
            select extract(epoch from e.date)::int date, e.id, e.title eventtitle,
                    e.presenter, e.contact, s.title songtitle, s.song_number, u.usage, s.tags, u.notes usage_notes, s.notes song_notes
            from event e
            left join songuse u on u.event_id = e.id
            left join song s on u.song_id = s.id
            order by date, songtitle;
            """)
        tags_dict = {}
        eventsdict = defaultdict(dict)
        # TODO maybe create Pydantic/SqlAlchemy model and fetch that does this.
        #events = session.exec(select(models.Event).order_by(models.Event.date.asc()).filter(models.Event.date >= datetime.now()).limit(10)).all()
        #events = [event.json() for event in events]
        # TODO DRY up this and index.py
        for e in data:
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
                    "tags": e.get("tags", []),
                    "date": eventdate,
                })
            tags = e.get("tags", [])
            if tags:
                for tag in tags:
                    if tag not in tags_dict:
                        tags_dict[tag] = build_tag_info(tag)
        tags_counter = Counter()
        #Perhaps instead of a set we want a hash
        #containing the unique tag and count
        for tags in [r.get('tags') for r in data]:
            if tags:
                for tag in tags:
                    tags_counter[tag] += 1

        return {"events": eventsdict, "tags_counter": sorted(tags_counter.items()), "tags_dict": tags_dict}
