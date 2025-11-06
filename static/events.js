import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, DETAILS, FIELDSET, FORM, H2, INPUT, LABEL, LEGEND, SPAN, STYLE, SUMMARY, TABLE, TBODY, TD, TH, THEAD, TR} = choc; //autoimport
import * as utils from "./utils.js";
import ws from "./ws.js";


const sock = ws({
    render: (state) => {
        set_content("dialog#main .dlg_content", [
            H2("Song List"),
            DETAILS([
                SUMMARY("Creat new song and add to event"),
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
                    INPUT({type: "submit"}, "Create/Add"),
                ])]
            ),
            state.all_songs && [
                TABLE({id: "songs-filter"}, [
                    STYLE(),
                    THEAD([
                        TR(TH({colSpan: 4}, "Songs")),
                        TR([TH(), TH("Title"), TH("Credits"), TH("Number"),]),
                        TR([TH(), TH(INPUT({name: "title"})), TH(INPUT({name: "credits"})), TH(INPUT({name: "number"})),]),
                    ]),
                    TBODY([state.all_songs.map(s => TR({
                        "data-title": s.title.toLowerCase(),
                        "data-credits": s.credits.toLowerCase(),
                        "data-number": s.id,
                    }, [
                        TD(BUTTON({class: "addsong", id: s.id, type: "button"}, "+")),
                        TD(s.title),
                        TD(s.credits),
                        TD(`${s.id}`),
                    ])
                    )]),
                ]),
            ]
        ]);
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
                            TR(TH({colSpan: 4}, "Songs")),
                            TR([TH("Title"), TH("Credits"), TH("Usage"), TH()])
                        ]),
                        TBODY([state.songs.map(s => TR({'data-id': s.id},[
                                TD(SPAN(s.title)),
                                TD(SPAN(s.credits)),
                                TD(INPUT({type: "text", name: "usage", value: s.usage})),
                                TD(BUTTON({class: "removesong", type: "button"}, "X")),
                            ])
                        )]),
                        BUTTON({id: "addsong", type: "button"}, "Add Song"),
                    ])
                ]),
            ]);
        }
        if (state.events) {
            set_content("main", TABLE([
                THEAD([
                    TR(TH({colSpan: 4}, "Events")),
                    TR([TH("Date"), TH("Title"), TH("Presenter"), TH()])
                ]),
                TBODY([state.events.map(e => TR([
                        TD(utils.formatdate(e.date)),
                        TD(e.title),
                        TD(e.presenter),
                        TD(A({class: "button", href: `/event/${e.id}`, title: "edit event"}, "edit")),
                    ])
                )]),
                BUTTON({id: "newevent", type: "button"}, "Create Event"),
            ]));
        }
    }
})

on("change", "form#event input", (e) => {
    sock.send({cmd: "updateevent", [e.match.name]: e.match.value});
})

on("click", "button#addsong", async (e) => {
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
    sock.send({cmd: "remove_song_use", id: e.match.closest_data("id")});
});


on("click", "#newevent", async (e) => {
    const response = await fetch("/events", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "date": new Date().toISOString(),
            "description": "",
            "presenter": ""
        }),
    });
    const event = await response.json();
    window.location = `/event/${event.id}`;
});

on("change", "input[name=usage]", (e) => {
    sock.send({cmd: "update_song_use", [e.match.name]: e.match.value, id: e.match.closest_data("id")})
});

on("input", "#songs-filter input", e => {
    let css = "";
    document.querySelectorAll("#songs-filter input").forEach(i => {
        if (i.value) {
            css += "#songs-filter tbody tr:not([data-" + i.name + '*="' + i.value.toLowerCase() + '"]) {display:none}'
        }
    });
    set_content("#songs-filter style", css);
});
