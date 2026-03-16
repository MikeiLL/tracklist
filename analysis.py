from typing import Annotated
import json
from collections import defaultdict, Counter
from sqlmodel import Session, select
from datetime import datetime
from pprint import pprint

from . import models
from .utils import WebSocketHandler
from . import database

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
        tagset = Counter()
        #Perhaps instead of a set we want a hash
        #containing the unique tag and count
        for tags in [r.get('tags') for r in data]:
            if tags:
                for tag in tags:
                    tagset[tag] += 1

        return {"data": data, "tags": sorted(tagset.items())}
