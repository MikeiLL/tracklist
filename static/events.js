import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {BUTTON, FIELDSET, FORM, H2, INPUT, LABEL, LEGEND, LI, PRE, SPAN, TABLE, TBODY, TD, TH, THEAD, TR, UL} = choc; //autoimport
import {simpleconfirm} from "./utils.js";
import ws from "./ws.js";

const sock = ws({
    render: (state) => {
        console.log(state)
        if (state.event) {
            return set_content("main", [
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
                    TABLE([
                        THEAD([
                            TR(TH({colSpan: 3}, "Songs")),
                            TR([TH("Title"), TH("Credits"), TH("Usage"), TH()])
                        ]),
                        TBODY([state.songs.map(s => TR([
                                TD(SPAN(s.title)),
                                TD(SPAN(s.credits)),
                                TD(INPUT({type: "text", name: "usage", value: s.usage})),
                                TD(BUTTON({class: "removesong", 'data-id': s.id, type: "button"}, "X")),
                            ])
                        )]),
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
    set_content("dialog#main .dlg_content", [
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
                LABEL([
                    "Usage (offertory, etc)",
                    INPUT({name: "usage"})
                ]),
                INPUT({type: "submit"}, "Add song"),
            ]
        ),
        songlist && UL({class: "songlist"},[
            songlist.map(s => LI([
                BUTTON({class: "addsong", id: s.id, type: "button"}, "+"),
                s.title, " by ", s.credits,
            ]))
        ])
    ]);
    DOM("dialog#main").showModal();
});

on("submit", "#newsong", async (e) => {
    e.preventDefault();
    const formEntries = Object.fromEntries(new FormData(e.match));
    const result = await fetch("/songs", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "accept": "application/json",
        },
        body: JSON.stringify(formEntries)
    })
    const song = await result.json();
    sock.send({cmd: "add_song_use", songid: song.id, usage: formEntries.usage});
    DOM("dialog#main").close();
});

on("click", ".addsong", async (e) => {
    e.preventDefault();
    sock.send({cmd: "add_song_use", songid: e.match.id, usage: ""});
});

on("click", ".removesong", async (e) => {
    e.preventDefault();
    sock.send({cmd: "remove_song_use", id: e.match.dataset.id});
});
