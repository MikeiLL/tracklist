let ws = null;

function getCookie(name) {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        return cookie.substring(name.length + 1);
      }
    }
    return null;
  }


export default (methods) => {
    let connected = false;
    function reconnect() {
        ws = new WebSocket("/ws");
        ws.onopen = async () => {
            console.log("websocket connected");
            connected = true;
            let access_token = getCookie("tracklist_access_token");
            ws.send(JSON.stringify(
                {
                    "cmd": "init",
                    "type": ws_type,
                    "group": ws_group,
                    "tracklist_access_token": access_token
                }
            ));
            ws.send(JSON.stringify({"cmd": "addsong", "details": {"title": "test song"}}));
        }
        ws.onmessage = (e) => {
            let data = JSON.parse(e.data)
            if (data.cmd === "update") return methods.render(data);
            console.log(data);
        }
        ws.onclose = async () => {
            console.log("websocket disconnected");
            connected = false;
            ws = null;
            setTimeout(reconnect, 250); // try again in 1/4 second
            // TODO put something in the DOM
        }
    }
    reconnect();
    return {
        send: msg => {
            if (connected) {
                ws.send(JSON.stringify(msg));
            } else {
                console.error("No socket connection yet.");
                // TODO else queue send 'till the next retry
            }
        }
    }
}
