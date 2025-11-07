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
        all_songs = database.dict_query("SELECT * FROM song ORDER BY title ASC")
        if group != 0:
            events = database.dict_query("SELECT *, CAST(EXTRACT(epoch FROM date) AS int) as date FROM event WHERE id=%s LIMIT 1", (group,))
            if len(events) < 1:
                return {"error": "Event not found"}
            event = events[0]
            songs = database.dict_query("""
                    SELECT title, credits, usage, song_id, songuse.id, songuse.notes FROM songuse
                        JOIN song on songuse.song_id = song.id
                        WHERE songuse.event_id = %s
            """, (group,))
            return {"event": event, "songs": songs, "all_songs": all_songs}
        else:
            events = database.dict_query("SELECT *, CAST(EXTRACT(epoch FROM date) AS int) as date FROM event ORDER BY event.date DESC")
            if len(events) < 1:
                return {"error": "No events found"}
            return {"events": events, "all_songs": all_songs}

    async def sockmsg_updateevent(self, sock: dict, msg: dict):
        whitelist = ["presenter", "title", "description", "date", "contact"]
        changes = {k:v for k,v in msg.items() if k in whitelist}
        if changes: database.query("UPDATE event SET " + ",".join(k + "=%s" for k in changes) + " WHERE id = %s", (*changes.values(), sock["ws_group"]))
        return {"cmd": "event_updated", "changes": changes}

    async def sockmsg_add_song_use(self, sock: dict, msg: dict):
        songuse = database.query("""
                    INSERT INTO songuse (song_id, event_id, usage) VALUES (%s, %s, %s)
                    """,
                    (msg['songid'], sock["ws_group"], msg.get("usage", "")))
        await self.send_updates_all(sock["ws_group"])

    async def sockmsg_remove_song_use(self, sock: dict, msg: dict):
        database.query("DELETE FROM songuse WHERE id=%s", (int(msg['id']),))
        await self.send_updates_all(sock["ws_group"])

    async def sockmsg_update_song_use(self, sock: dict, msg: dict):
        whitelist = ["usage", "notes"]
        usage = msg.get("id")
        if not usage: return
        changes = {k:v for k,v in msg.items() if k in whitelist}
        if changes: database.query("UPDATE songuse SET " + ",".join(k + "=%s" for k in changes) + " WHERE id = %s", (*changes.values(), int(usage)))
        await self.send_updates_all(sock["ws_group"])
