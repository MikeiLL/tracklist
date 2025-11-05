
from fastapi import WebSocket, APIRouter, Depends
from fastapi.websockets import WebSocketDisconnect
import json
from collections import defaultdict
import traceback
from . import utils

router = APIRouter(
    prefix="/ws",
    tags=["sockets"],
    dependencies=[],
    responses={},
)

ws_managers = {}

class WebSocketHandler:

    def __init__(self):
        self.groups = defaultdict(list)

    def __init_subclass__(cls):
        ws_managers[cls.__name__] = cls()

    def set_group(self, websocket, group):
        self.groups[group].append(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, group, message: str):
        for conn in self.groups[group]:
            await conn.send_text(message)

    async def send_updates_all(self, group):
        state = await self.get_state(group)
        state["cmd"] = "update"
        message = json.dumps(state)
        await self.broadcast(group, message)

    async def get_state(self, group: int):
        return {}

from . import index
from . import songs
from . import events

@router.websocket("")
async def websocket_route(websocket: WebSocket):
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
                mgr = ws_managers.get(ws_type)
                if not mgr: break
                try:
                    user = await utils.get_current_user(token)
                except utils.InvalidCredentialsError:
                    await mgr.send_message(json.dumps({"cmd": "error", "message": "Invalid credentials"}), websocket)
                    await websocket.close()
                    return
                mgr.set_group(websocket, ws_group)
                state = await mgr.get_state(ws_group)
                state['cmd'] = "update"
                await mgr.send_message(json.dumps(state), websocket)
            if "cmd" not in message: continue
            handler = getattr(mgr, "sockmsg_" + message["cmd"], None)
            if handler:
                try:
                    await handler(locals(), message) #hack
                except:
                    print("Error in ws handler", ws_type, ws_group, handler)
                    traceback.print_exc()
    except WebSocketDisconnect:
        await websocket.close()
