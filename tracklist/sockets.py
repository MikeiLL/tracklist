
from fastapi import WebSocket, APIRouter
from fastapi.websockets import WebSocketDisconnect, WebSocketState
import itertools
import json


router = APIRouter(
    prefix="/ws",
    tags=["sockets"],
    dependencies=[],
    responses={},
)

class ConnManager:
    def __init__(self):
        self.active_conns: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_conns.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_conns.remove(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for conn in self.active_conns:
            await conn.send_text(message)

managers = {
    "songs": ConnManager(),
    "events": ConnManager(),
}
next_client_id = itertools.count()

@router.websocket("")
async def websocket_route(websocket: WebSocket):
    client_id = next(next_client_id)
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            type = message.get("type")
            if message.get("cmd")== "init":
                mgr = managers[type]
                if not mgr: break
                await mgr.send_message("connected for type %s" % type, websocket)
    except WebSocketDisconnect:
        websocket.disconnect(websocket)
