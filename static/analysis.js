import {
    lindt,
    replace_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {H2, LI, P, SPAN, UL} = lindt; //autoimport
import * as utils from "./utils.js$$cachebust$$";
import ws from "./ws.js$$cachebust$$";
console.log("hello from analysis");
const sock = ws({
    render: (state) => {
        console.log({"state":state});
        replace_content("main", [
            H2("coming soon..."),
            P([
                SPAN({display: "inline", style: "font-weight: bold;"}, "Active Tags:"),
                UL({style: "display: inline;", class: 'inline'}, state.tags.map(([k,v]) => LI([k, ` (${v})`])))
            ]),
        ]);
    },

});
