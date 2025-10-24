
from fastapi import WebSocket, APIRouter
from fastapi.websockets import WebSocketDisconnect, WebSocketState
import itertools


router = APIRouter(
    prefix="/ws",
    tags=["sockets"],
    dependencies=[],
    responses={},
)

class ConnectionManager:
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

manager = ConnectionManager()
next_client_id = itertools.count()

@router.websocket("")
async def websocket_route(websocket: WebSocket):
      client_id = next(next_client_id)
      print("set or received", client_id)
      await manager.connect(websocket)
      try:
          while True:
              data = await websocket.receive_text()
              await manager.send_message(f"you wrote {data}", websocket)
              await manager.broadcast(f"Client id {client_id} wrote {data}.")
      except WebSocketDisconnect:
          manager.disconnect(websocket)
          await manager.broadcast(f"Client {client_id} has left.")

fake_items_db = {"plumbus": {"name": "Plumbus"}, "gun": {"name": "Portal Gun"}}


@router.get("/test")
async def read_items():
    return fake_items_db
