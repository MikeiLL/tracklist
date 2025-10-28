const ws = new WebSocket("/ws");

export default (methods) => {
    ws.onopen = () => {
        ws.send(JSON.stringify({"cmd": "init", "type": ws_type, "group": ws_group}));
        ws.send(JSON.stringify({"cmd": "addsong", "details": {"title": "test song"}}));
    }
    ws.onmessage = (e) => {
        let data = JSON.parse(e.data)
        if (data.cmd === "update") return methods.render(data);
        console.log(data);
    }
}
