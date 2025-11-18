import {
    lindt,
    replace_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, DIV, FIELDSET, FORM, INPUT, LABEL, LI, SPAN, STYLE, TABLE, TBODY, TD, TEXTAREA, TH, THEAD, TR, UL} = lindt; //autoimport
import * as utils from "./utils.js$$cachebust$$";
import ws from "./ws.js$$cachebust$$";

const sock = ws({
    render: (state) => {
        replace_content("dialog#main .dlg_header h2", "Add Song");
        replace_content("dialog#main .dlg_content", [
            FORM({id: "editsongform"}, [
                FIELDSET([LABEL(["Title", INPUT({type: "text", name: "title"})]),
                LABEL(["Credits", INPUT({type: "text", name: "credits"})]),
                LABEL(["Number", INPUT({type: "number", name: "song_number"})]),
                LABEL(["Notes", TEXTAREA({type: "text", name: "notes"})]),
                INPUT({type: "submit", class: "button"}, "Submit")]),
            ]),
        ]);
        replace_content("main", [,
            state.song && [
                console.log(state.song.tags),
                DIV({class: "notifications hidden"}),
                FORM({id: "editsongform", "data-id": state.song.id},[
                    FIELDSET([
                        LABEL(["Title", INPUT({type: "text", name: "title", value: state.song.title})]),
                        LABEL(["Credits", INPUT({type: "text", name: "credits", value: state.song.credits})]),
                        LABEL(["Number", INPUT({type: "number", name: "song_number", value: state.song.song_number})]),
                        LABEL(["Notes", TEXTAREA({type: "text", name: "notes", value: state.song.notes})]),
                        UL({class: "tags"}, [
                            state.song.tags.map(t => LI([t, SPAN({class: "delete"}, "x")])),
                            INPUT({type: "text", name: "new_tag", })
                        ]),
                    ]),
                ]),
            ],
            BUTTON({id: "newsong", type: "button"}, `${state.song ? "Add another" : "New"} song`),
            state.songs && [
                TABLE({id: "songs-filter"}, [
                    STYLE(),
                    THEAD([
                        TR(TH({colSpan: 5}, "Songs")),
                        TR([TH("Title"), TH("Credits"), TH("Number"), TH("Notes"), TH()]),
                        TR([TH(INPUT({name: "title"})), TH(INPUT({name: "credits"})), TH(INPUT({name: "number"})), TH({colSpan: 2})]),
                    ]),
                    TBODY([state.songs.map(s => [TR({
                        "data-title": s.title.toLowerCase(),
                        "data-credits": (s.credits || "").toLowerCase(),
                        "data-number": s.song_number,
                    }, [
                        TD(s.title),
                        TD(s.credits),
                        TD(`${s.song_number  || ""}`),
                        TD(s.notes),
                        TD(A({class: "button", href: `/song/${s.id}`, title: "edit song"}, "edit")),
                    ]),
                    ]
                    )]),
                ]),
            ],
        ]);
    },
    sockmsg_song_created: (msg) => {
        window.location = `/song/${msg.id}`;
    },
    sockmsg_song_updated: (msg) => {
        replace_content(".notifications",
            Object.keys(msg.changes).map(
                k => k + " updated")
        ).classList.remove("hidden");
    }
});



on("input", "#songs-filter input", e => {
    let css = "";
    document.querySelectorAll("#songs-filter input").forEach(i => {
        if (i.value) {
            css += "#songs-filter tbody tr:not([data-" + i.name + '*="' + i.value.toLowerCase() + '"]) {display:none}'
        }
    });
    replace_content("#songs-filter style", css);
});

on("click", "#newsong", async () => {
    sock.send({cmd: "create_song"});
});

on("change", "#editsongform input, #editsongform textarea", e => {
    sock.send({cmd: "edit_song", id: e.match.closest_data("id"), [e.match.name]: e.match.value});
    if (e.match.name === "new_tag") e.match.value = "";
})
