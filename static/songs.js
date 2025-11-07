import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, FIELDSET, FORM, INPUT, LABEL, STYLE, TABLE, TBODY, TD, TEXTAREA, TH, THEAD, TR} = choc; //autoimport
import * as utils from "./utils.js";
import ws from "./ws.js";

const sock = ws({
    render: (state) => {
        set_content("dialog#main .dlg_header h2", "Add Song");
        set_content("dialog#main .dlg_content", [
            FORM({id: "editsongform"}, [
                FIELDSET([LABEL(["Title", INPUT({type: "text", name: "title"})]),
                LABEL(["Credits", INPUT({type: "text", name: "credits"})]),
                LABEL(["Number", INPUT({type: "number", name: "song_number"})]),
                LABEL(["Notes", TEXTAREA({type: "text", name: "notes"})]),
                INPUT({type: "submit", class: "button"}, "Submit")]),
            ]),
        ]);
        set_content("main", [
            state.songs && [
                TABLE({id: "songs-filter"}, [
                    STYLE(),
                    THEAD([
                        TR(TH({colSpan: 5}, "Songs")),
                        TR([TH("Title"), TH("Credits"), TH("Number"), TH("Notes"), TH()]),
                        TR([TH(INPUT({name: "title"})), TH(INPUT({name: "credits"})), TH(INPUT({name: "number"})), TH(INPUT({name: "notes"})), TH(INPUT({name: "notes"})), TH()]),
                    ]),
                    TBODY([state.songs.map(s => [TR({
                        "data-title": s.title.toLowerCase(),
                        "data-credits": s.credits.toLowerCase(),
                        "data-number": s.id,
                    }, [
                        TD(s.title),
                        TD(s.credits),
                        TD(`${s.song_number}`),
                        TR(TD(s.notes)),
                        TD(A({class: "button", href: `/song/${s.id}`, title: "edit song"}, "edit")),
                    ]),
                    ]
                    )]),
                    BUTTON({id: "newsong", type: "button"}, "New song"),
                ]),
            ],
            state.song && [
                FORM({id: "editsongform", "data-id": state.song.id},[
                    FIELDSET([
                        LABEL(["Title", INPUT({type: "text", name: "title", value: state.song.title})]),
                        LABEL(["Credits", INPUT({type: "text", name: "credits", value: state.song.credits})]),
                        LABEL(["Number", INPUT({type: "number", name: "song_number", value: state.song.song_number})]),
                        LABEL(["Notes", TEXTAREA({type: "text", name: "notes", value: state.song.notes})]),
                    ]),
                ]),
            ],
        ]);
    }
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

on("click", "#newsong", async (e) => {
    DOM("dialog#main").showModal();
});

on("change", "#editsongform input, #editsongform textarea", e => {
    sock.send({cmd: "edit_song", id: e.match.closest_data("id"), [e.match.name]: e.match.value})
})
