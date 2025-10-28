import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {PRE} = choc; //autoimport
import {simpleconfirm} from "./utils.js";
import ws from "./ws.js";

ws({
    render: (state) => {
        console.log(state)
        if (state.event) {
            return set_content("main", [
                PRE(JSON.stringify(state.event)),
                PRE(JSON.stringify(state.songs)),
            ]);
        }
        if (state.events) {
            set_content("main", PRE(JSON.stringify(state.events)));
        }
    }
})
