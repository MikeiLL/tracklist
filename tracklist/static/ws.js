const ws = new WebSocket("/ws");

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
    ws.onopen = async () => {
        let access_token = getCookie("tracklist_access_token")
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
}
