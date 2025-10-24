console.log("ws.js loaded");
const ws = new WebSocket("ws://localhost:8000/ws");
ws.onopen = () => {
  console.log("sending");
  ws.send(JSON.stringify({"cmd": "init", "type": "songs"}));
}
ws.onmessage = (e) => console.log(e.data);
