console.log("ws.js loaded");
const ws = new WebSocket("ws://localhost:8000/ws");
ws.onopen = () => {console.log("sending"); ws.send("hello world");}
ws.onmessage = (e) => console.log(e.data);
