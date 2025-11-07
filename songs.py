from typing import Annotated
import json
from . import database
from .utils import WebSocketHandler

class songs(WebSocketHandler):

    async def get_state(
            self,
            group: int,
        ):
        if group != 0:
            song = database.dict_query("""
                    SELECT * FROM song WHERE id = %s
            """, (group,))
            return {"song": song[0]}
        else:
            songs = database.dict_query("SELECT * FROM song ORDER BY song.title ASC")
            if len(songs) < 1:
                return {"error": "No songs found"}
        return {"songs":songs}

    async def sockmsg_edit_song(self, sock: dict, msg: dict):
        whitelist = ["title", "credits", "song_number", "notes"]
        usage = msg.get("id")
        if not usage: return
        changes = {k:v for k,v in msg.items() if k in whitelist}
        if changes: database.query("UPDATE song SET " + ",".join(k + "=%s" for k in changes) + " WHERE id = %s", (*changes.values(), int(usage)))
        await self.send_updates_all(sock["ws_group"])
