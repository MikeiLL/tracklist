import {
    lindt,
    replace_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {DIV, H1, H2, H3, INPUT, LABEL, TABLE, TD, TR} = lindt; //autoimport
import * as utils from "./utils.js$$cachebust$$";
import ws from "./ws.js$$cachebust$$";

import {sortable_table} from "./sortable_table.js";

const sock = ws({
    render: (state) => {
        console.log({"state":state});
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
                    H1("EVENTS...")
                ])
            ]),
        ]);
    },

});
