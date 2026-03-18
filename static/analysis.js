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

const DATE_FORMAT_MONTH = new Intl.DateTimeFormat('en-US', {
    month: "long",
    year: "numeric",
});
const DATE_FORMAT_SHORT = new Intl.DateTimeFormat('en-US', {
    day: "numeric",
    weekday: "long",
});
const sock = ws({
    render: (state) => {
        const CALENDAR = {}

        Object.entries(state.events).map(([date, details]) => {
            let month = DATE_FORMAT_MONTH.format(new Date(date * 1000 + 43200000 /* 12 hours in ms */));
            if (!CALENDAR[month]) CALENDAR[month] = [];
            CALENDAR[month].push(details);
        });
        console.log({"calendar": CALENDAR});
        replace_content("main", [
            H2("coming soon..."),
            DIV({style: "display: flex;"},[
                DIV([H3({display: "inline", style: "font-weight: bold;"}, "Active Tags:"),
                    /* TABLE({id: "tag_filter"}, TR({class: "reverse_labels"},
                        [
                            TD(LABEL(["tag", INPUT({name: "tag"})])),
                            TD(LABEL(["count", INPUT({type: "number", name: "count"})]))
                        ])), */
                    TABLE({id: "tags_counter"},
                        /* state.tagscounter.map(([k, v]) => TR([TD(k), TD(v)])) */),
                    // tagsTable here
                ]),
                DIV({id:"analysis-calendar"},[
                    H1("EVENTS..."),
                    UL({class:"wrapped-rows"}, Object.entries(CALENDAR).map(([month, details]) => {
                        return LI([
                            UL(details.sort((a,b) => a.date - b.date ).map(d => LI([
                                DATE_FORMAT_SHORT.format(new Date(d.date * 1000 + 43200000)),
                            ]))),
                            H3(month),
                        ]);
                    }))
                ])
            ]),
        ]);

        const tagsTable = new sortable_table({
            element: DOM("#tags_counter"),
            cols: [
                {label: "Tag", field: "tag", style: "text-align: left;"},
                {label: "Count", field: "count", style: "text-align: left;"},],
            rowAttrs: (row) => ({
                "data-tag": row.tag,
                "data-count": row.count,
            }),
        });
        if (state.tagscounter) return tagsTable.render(state.tagscounter.map(([k,v]) => {return {tag: k, count: v}}))
    },


});
