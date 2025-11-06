import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {LI, H2, UL, A} = choc; //autoimport
import {simpleconfirm} from "./utils.js";
import ws from "./ws.js";

ws({
    render: (state) => {
        set_content("main", [
            state.songs && [
                UL({id: "songs"}, state.songs.map(s => LI([s.title, ' (', s.credits, ')']))),
            ],
        ]);
    }
})
