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
                        TR([TH("Title"), TH("Credits"), TH("Number"), TH()]),
                        TR([TH(INPUT({name: "title"})), TH(INPUT({name: "credits"})), TH(INPUT({name: "number"})), TH()]),
                    ]),
                    TBODY([state.songs.map(s => TR({
                        "data-title": s.title.toLowerCase(),
                        "data-credits": s.credits.toLowerCase(),
                        "data-number": s.id,
                    }, [
                        TD(s.title),
                        TD(s.credits),
                        TD(`${s.id}`),
                        TD(A({class: "button", href: `/song/${s.id}`, title: "edit song"}, "edit")),
                    ])
                    )]),
                    BUTTON({id: "newevent", type: "button"}, "TODO add song"),
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
