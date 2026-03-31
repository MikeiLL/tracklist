import {
    lindt,
    replace_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {DIV, H1, H3, H4, H5, LI, P, SPAN, TABLE, UL} = lindt; //autoimport
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
    /* hour: "numeric", */
});

let tags_dict;

const sock = ws({
    render: (state) => {
        console.log(state);
        const CALENDAR = {}

        Object.entries(state.events).map(([date, details]) => {
            let month = DATE_FORMAT_MONTH.format(new Date(date * 1000));
            if (!CALENDAR[month]) CALENDAR[month] = [];
            CALENDAR[month].push(details);
        });
        tags_dict = state.tags_dict;

        replace_content("main", [
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
                    UL({class: "wrapped-rows"}, Object.entries(CALENDAR).map(([month, date]) => {
                        let tags_by_date = {};
                        return LI([
                            UL(date.sort((a, b) => a.date - b.date).map(d => {
                                d.songs.forEach(s => {
                                    s.tags.forEach(t => {
                                        if (!tags_by_date[t]) tags_by_date[t] = [s.title]
                                        else {tags_by_date[t].push(s.title)};
                                    })
                                });
                                const listing =  LI([
                                    H4(DATE_FORMAT_SHORT.format(new Date(d.date * 1000))),
                                    DIV({class: "event-wrap"}, [
                                        DIV({class: "title"}, d.title),
                                        DIV({class: ""}, d.contact),
                                        DIV({class: ""}, d.presenter),
                                        UL({style: "display: inline;"}, Object.entries(tags_by_date)
                                            .map(([tag, songs]) => LI({style: "display: inline-block;"},SPAN(
                                                {
                                                    class: "tag-songs",
                                                    style: `
                                                    height: 20px;
                                                    width: 20px;
                                                    display: inline-block;
                                                    border-radius: 50%;
                                                    margin: 0.5em;
                                                    background-color: ${tags_dict[tag].color}`,
                                                    title: tag + ": " + songs.join(", ")
                                                }
                                            ))
                                        ))
                                    ]),
                                ])
                                tags_by_date = {};
                                return listing;
                            })),
                            H3(month),
                        ]);
                    }))
                ])
            ]),
        ]);

        const tagsTable = new sortable_table({
            element: DOM("#tags_counter"),
            cols: [
                {
                    render: (item) => [
                        SPAN({
                            style: `
                            flex: 0 0 20px;
                            display: inline-block;
                            height: 20px;
                            /* width: 20px; now handled by flexbox*/
                            border-radius: 50%;
                            margin: 0.5em;
                            background-color: ${tags_dict[item.tag].color}`
                        }),
                        SPAN({style: "flex: 1;"}, item.tag)
                ], style: "padding: 0; display: flex; align-items: center; justify-content: flex-start;"},
                {label: "Count", field: "count", style: "text-align: left;"},
            ],
            rowAttrs: (row) => ({
                "data-tag": row.tag,
                "data-count": row.count,
            }),
        });
        if (state.tags_counter) return tagsTable.render(state.tags_counter.map(([k,v]) => {return {tag: k, count: v}}))
    },


});
