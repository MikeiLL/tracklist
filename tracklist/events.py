from typing import Annotated
import json
from . import database
from . import models
from .utils import WebSocketHandler

class events(WebSocketHandler):
    async def get_state(
            self,
            group: int,
        ):
        if group != 0:
            events = database.dict_query("SELECT *, CAST(EXTRACT(epoch FROM date) AS int) as date FROM event WHERE id=%s LIMIT 1", (group,))
            if len(events) < 1:
                return {"error": "Event not found"}
            event = events[0]
            songs = database.dict_query("""
                    SELECT title, credits, usage FROM songuse
                        JOIN song on songuse.song_id = song.id
                        WHERE songuse.event_id = %s
            """, (group,))
            return {"event": event, "songs": songs}
        else:
            events = database.dict_query("SELECT *, CAST(EXTRACT(epoch FROM date) AS int) as date FROM event ORDER BY event.date DESC")
            if len(events) < 1:
                return {"error": "No events found"}
            return {"events": events}

    async def sockmsg_updateevent(self, sock: dict, msg: dict):
        whitelist = ["presenter", "title", "description", "date"]
        for k,v in msg.items():
            if k in whitelist:
                database.query("UPDATE event SET " + k + " = %s WHERE id = %s", (v, sock["ws_group"]))

    async def sockmsg_add_song_use(self, sock: dict, msg: dict):
        print(msg['songid'])
        songuse = database.query("INSERT INTO songuse (song_id, event_id, usage) VALUES (%s, %s, %s)", (msg['songid'], sock["ws_group"], msg.get("usage", "")))
        await self.send_updates_all(sock["ws_group"])
