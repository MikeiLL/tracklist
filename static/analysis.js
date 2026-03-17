import {
    lindt,
    replace_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {DIV, H1, H2, H3, INPUT, LABEL, LI, TABLE, TD, TR, UL} = lindt; //autoimport
import * as utils from "./utils.js$$cachebust$$";
import ws from "./ws.js$$cachebust$$";

import {sortable_table} from "./sortable_table.js";

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
    month: "long",
});

const sock = ws({
    render: (state) => {
        const CALENDAR = {}
        Object.entries(state.events).map(([date, details]) => {
            /* console.log({
                "month": DATE_FORMAT.format(new Date(date * 1000), {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })
            }); */
            let month = DATE_FORMAT.format(new Date(date * 1000));
            if (!CALENDAR[month]) CALENDAR[month] = [];
            CALENDAR[month] = details;
        });
        console.log({"calendar": CALENDAR});
        replace_content("main", [
            H2("coming soon..."),
            DIV({style: "display: flex;"},[
                DIV([H3({display: "inline", style: "font-weight: bold;"}, "Active Tags:"),
                    TABLE({id: "tag_filter"}, TR({class: "reverse_labels"},
                        [
                            TD(LABEL(["tag", INPUT({name: "tag"})])),
                            TD(LABEL(["count", INPUT({type: "number", name: "count"})]))
                        ])),
                    TABLE({id:"tags_counter"},
                        state.tagscounter.map(([k, v]) => TR([TD(k), TD(v)])))
                ]),
                DIV([
                    H1("EVENTS..."),
                    UL(Object.entries(state.events).map(([date, details]) => {
                        return LI(DATE_FORMAT.format(new Date(date*1000)));
                    }))
                ])
            ]),
        ]);
    },

});
