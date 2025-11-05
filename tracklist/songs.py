from typing import Annotated
import json
from . import database
from .sockets import WebSocketHandler

class songs(WebSocketHandler):

    async def get_state(
            self,
            group: int,
        ):
        if group != 0:
            songs = database.dict_query("""
                    SELECT * FROM song WHERE id = %s
            """, (group,))
            return {"songs": songs}
        else:
            songs = database.dict_query("SELECT * FROM song ORDER BY song.title DESC")
            if len(songs) < 1:
                return {"error": "No songs found"}
        return {"songs":songs}
