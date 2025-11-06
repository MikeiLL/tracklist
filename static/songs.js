import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, TABLE, TBODY, TD, TH, THEAD, TR} = choc; //autoimport
import * as utils from "./utils.js";
import ws from "./ws.js";

ws({
    render: (state) => {
        set_content("main", [
            state.songs && [
                TABLE([
                    THEAD([
                        TR(TH({colSpan: 4}, "Songs")),
                        TR([TH("Title"), TH("Credits"), TH("Number"), TH()])
                    ]),
                    TBODY([state.songs.map(s => TR([
                            TD(s.title),
                            TD(s.credits),
                            TD("todo"),
                            TD(A({class: "button", href: `/song/${s.id}`, title: "edit song"}, "edit")),
                        ])
                    )]),
                    BUTTON({id: "newevent", type: "button"}, "Create Event"),
                ]),
            ],
        ]);
    }
})
