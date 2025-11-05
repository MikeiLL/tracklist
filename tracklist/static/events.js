import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {BR, BUTTON, FIELDSET, FORM, H2, INPUT, LABEL, LEGEND, LI, PRE, UL} = choc; //autoimport
import {simpleconfirm} from "./utils.js";
import ws from "./ws.js";

const sock = ws({
    render: (state) => {
        console.log(state)
        if (state.event) {
            return set_content("main", [
                BUTTON({id: "test"},"test"),
                FORM({id: "event"}, [
                    FIELDSET([
                        LEGEND("Event Details"),
                        INPUT({
                            type: "date", name: "date", value: new Date(state.event.date * 1000)
                                .toISOString().split("T")[0]
                        }),
                        LABEL(["Title", INPUT({type: "text", name:"title", value: state.event.title})]),
                        LABEL(["Description", INPUT({type: "text", name:"description", value: state.event.description})]),
                        LABEL(["Presenter", INPUT({type: "text", name:"presenter", value: state.event.presenter})]),
                    ])
                ]),
                FORM({id: "songs"}, [
                    FIELDSET([
                        LEGEND("Songs"),
                        state.songs.map(s => {
                            return [
                                LABEL(["Title", INPUT({type: "text", name: "title", value: s.title})]),
                                LABEL(["Credits", INPUT({type: "text", name:"credits", value: s.credits})]),
                                LABEL(["Usage", INPUT({type: "text", name: "usage", value: s.usage})]),
                                BR(),
                            ]
                        }),
                        BUTTON({id: "addsong", type: "button"}, "Add Song"),
                    ])
                ]),
            ]);
        }
        if (state.events) {
            set_content("main", PRE(JSON.stringify(state.events)));
        }
    }
})

on("change", "form#event input", (e) => {
    sock.send({cmd: "updateevent", [e.match.name]: e.match.value});
})

on("click", "button#addsong", async (e) => {
    const data = await fetch("/songs");
    const songlist = await data.json();
    set_content("dialog#main", [
        H2("Song List"),
        FORM({id: "newsong"}, [
                LABEL([
                    "Title",
                    INPUT({name: "title"})
                ]),
                LABEL([
                    "Credits",
                    INPUT({name: "credits"})
                ]),
                INPUT({type: "submit"}, "Add song"),
            ]
        ),
        songlist && UL([
            songlist.map(s => LI([s.title, s.credits]))
        ])
    ]);
    DOM("dialog#main").showModal();
});

on("click", "#test", () => sock.send({cmd: "add_song_use", songid: 4, usage: ""}))

on("submit", "#newsong", async (e) => {
    e.preventDefault();
    result = await fetch("/songs", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "accept": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(new FormData(e.match)))
    })
    const song = await result.json();
    sock.send({cmd: "add_song_use", songid: song.id, usage: ""});
})
