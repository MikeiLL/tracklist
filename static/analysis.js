import {
    lindt,
    replace_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {DIV, H1, H2, H3, H4, LI, SPAN, TABLE, UL} = lindt; //autoimport
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
    timeZone: "America/Chicago",
    hour: "numeric",
});

let tags_dict;

const sock = ws({
    render: (state) => {
        const CALENDAR = {}

        Object.entries(state.events).map(([date, details]) => {
            let month = DATE_FORMAT_MONTH.format(new Date(date * 1000));
            if (!CALENDAR[month]) CALENDAR[month] = [];
            CALENDAR[month].push(details);
        });
        tags_dict = state.tags_dict;

        replace_content("main", [
            DIV(Object.entries(tags_dict).map(([t, deets]) => SPAN({
                style: `
                display: inline-block;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                margin: 0.5em;
                background-color: ${deets.color}`
            }))),
            DIV({style: "display: flex;"},[
                DIV([H3({display: "inline", style: "font-weight: bold;"}, "Active Tags:"),
                    /* TABLE({id: "tag_filter"}, TR({class: "reverse_labels"},
                        [
                            TD(LABEL(["tag", INPUT({name: "tag"})])),
                            TD(LABEL(["count", INPUT({type: "number", name: "count"})]))
                        ])), */
                    TABLE({id: "tags_counter"},
                        /* state.tags_counter.map(([k, v]) => TR([TD(k), TD(v)])) */),
                    // tagsTable here
                ]),
                DIV({id:"analysis-calendar"},[
                    H1("EVENTS..."),
                    UL({class:"wrapped-rows"}, Object.entries(CALENDAR).map(([month, details]) => {
                        return LI([
                            UL(details.sort((a, b) => a.date - b.date).map(d => LI([
                                d.songs.map(s => [H4({style: "color: magenta;"},[s.title, s.tags.map(t=> SPAN({style: "color: rebeccapurple;"}, t))]), ","]),
                                DATE_FORMAT_SHORT.format(new Date(d.date * 1000)),
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
        if (state.tags_counter) return tagsTable.render(state.tags_counter.map(([k,v]) => {return {tag: k, count: v}}))
    },


});
