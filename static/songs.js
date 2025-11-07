import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, INPUT, STYLE, TABLE, TBODY, TD, TH, THEAD, TR} = choc; //autoimport
import * as utils from "./utils.js";
import ws from "./ws.js";

ws({
    render: (state) => {
        set_content("main", [
            state.songs && [
                TABLE({id: "songs-filter"}, [
                    STYLE(),
                    THEAD([
                        TR(TH({colSpan: 4}, "Songs")),
                        TR([TH("Title"), TH("Credits"), TH("Number"), TH("Number"), TH()]),
                        TR([TH(INPUT({name: "title"})), TH(INPUT({name: "credits"})), TH(INPUT({name: "number"})), TH(INPUT({name: "notes"})), TH()]),
                    ]),
                    TBODY([state.songs.map(s => [TR({
                        "data-title": s.title.toLowerCase(),
                        "data-credits": s.credits.toLowerCase(),
                        "data-number": s.id,
                    }, [
                        TD(s.title),
                        TD(s.credits),
                        TD(`${s.song_number}`),
                        TD(A({class: "button", href: `/song/${s.id}`, title: "edit song"}, "edit")),
                    ]),
                        TR(TD({colSpan: 4}, s.notes)),
                    ]
                    )]),
                    BUTTON({id: "newsong", type: "button"}, "New song"),
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

on("click", ".newsong", async (e) => {
    console.log("TODO - open dlg to create song");
});
