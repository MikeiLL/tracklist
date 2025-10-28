
from fastapi import WebSocket, APIRouter
from fastapi.websockets import WebSocketDisconnect, WebSocketState
import itertools
import json
from collections import defaultdict

from . import index
from . import songs
from . import events


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
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message.get("cmd") == "init":
                ws_type = message["type"]
                ws_group = message["group"]
                mgr = managers[ws_type]
                mgr.set_group(websocket, ws_group)
                if not mgr: break
                state = mgr.module.get_state(ws_group)
                state['cmd'] = "update"
                await mgr.send_message(json.dumps(state), websocket)
    except WebSocketDisconnect:
        websocket.close(websocket)
