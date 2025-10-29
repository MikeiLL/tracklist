const ws = new WebSocket("/ws");

export default (methods) => {
    ws.onopen = () => {
        let access_token = localStorage.getItem("access_token")
        ws.send(JSON.stringify(
            {
                "cmd": "init",
                "type": ws_type,
                "group": ws_group,
                "access_token": access_token
            }
        ));
        ws.send(JSON.stringify({"cmd": "addsong", "details": {"title": "test song"}}));
    }
    ws.onmessage = (e) => {
        let data = JSON.parse(e.data)
        if (data.cmd === "update") return methods.render(data);
        console.log(data);
    }
}
