
from fastapi import WebSocket, APIRouter, Depends, Request
from fastapi.websockets import WebSocketDisconnect, WebSocketState
import itertools
import json
from collections import defaultdict

from . import index
from . import songs
from . import events
from . import utils


router = APIRouter(
    prefix="/ws",
    tags=["sockets"],
    dependencies=[],
    responses={},
)

class ConnManager:
    def __init__(self, type):
        self.groups = defaultdict(list)
        self.module = type

    def set_group(self, websocket, group):
        self.groups[group].append(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str, group):
        for conn in self.groups[group]:
            await conn.send_text(message)

managers = {
    "index": ConnManager(index),
    "songs": ConnManager(songs),
    "events": ConnManager(events),
}
next_client_id = itertools.count()

@router.websocket("")
async def websocket_route(websocket: WebSocket):
    client_id = next(next_client_id)
    ws_type = ws_group = None
    authorization: str = websocket.cookies.get("tracklist_access_token")
    scheme, token = authorization.split(" ")
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            #token = request.cookies.get('access_token')
            if message.get("cmd") == "init":
                ws_type = message["type"]
                ws_group = message["group"]
                mgr = managers[ws_type]
                try:
                    user = await utils.get_current_user(token)
                except utils.InvalidCredentialsError:
                    await mgr.send_message(json.dumps({"cmd": "error", "message": "Invalid credentials"}), websocket)
                    await websocket.close()
                    return
                mgr.set_group(websocket, ws_group)
                if not mgr: break
                state = mgr.module.get_state(ws_group)
                state['cmd'] = "update"
                await mgr.send_message(json.dumps(state), websocket)
    except WebSocketDisconnect:
        await websocket.close()
