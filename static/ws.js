let ws = null;
let reconnect_delay = 250;
const max_reconnect_time = 1000;

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
        const url = new URL("/ws", location);
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
        ws = new WebSocket(url)
        ws.onopen = async () => {
            if (reconnect_delay > max_reconnect_time) {
                return console.log("stop trying")
            }
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
            //ws.send(JSON.stringify({"cmd": "addsong", "details": {"title": "test song"}}));
        }
        ws.onmessage = (e) => {
            let data = JSON.parse(e.data)
            if (data.cmd === "update") return methods.render(data);
            else if (methods["sockmsg_" + data.cmd]) methods["sockmsg_" + data.cmd](data);
            console.log(data);
        }
        ws.onclose = async () => {
            console.log("websocket disconnected", reconnect_delay);
            connected = false;
            ws = null;
            if (reconnect_delay > max_reconnect_time) {
                setTimeout(reconnect, reconnect_delay);
                if (reconnect_delay < max_reconnect_time) reconnect_delay *= 1.5 + 0.5 * Math.random(); //Exponential back-off with a (small) random base
            } else {
                window.location = "/login"; // take 'em back to index which will return login if no cookie.
            }

            // TODO put something in the DOM
        }
    }
    reconnect();
    return {
        send: msg => {
            console.log("sending", msg)
            if (connected) {
                ws.send(JSON.stringify(msg));
            } else {
                console.error("No socket connection yet.");
                // TODO else queue send 'till the next retry
            }
        }
    }
}
