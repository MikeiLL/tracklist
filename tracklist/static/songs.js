import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {LI} = choc; //autoimport
import {simpleconfirm} from "./utils.js";
import ws from "./ws.js";

ws({
    render: (state) => {
        state.songs && set_content("#songlist", state.songs.map(s => LI([s.title, ' (', s.credits, ')'])))
        state.events && set_content("#eventlist", state.events.map(s => LI([s.title, ' (', new Date(s.date * 1000).toISOString(), ')'])))
    }
})
