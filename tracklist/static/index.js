import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, H2, LI, UL} = choc; //autoimport
import {simpleconfirm} from "./utils.js";
import ws from "./ws.js";

ws({
    render: (state) => {
        set_content("main", [
            state.songs && [
                H2("Recent songs"),
                UL({id: "songs"}, state.songs.map(s => LI([s.title, ' (', s.credits, ')']))),
            ],
            state.events && [
                H2("Recent and coming events"),
                UL({id: "events"}, state.events.map(s => LI(A({
                    href: `/event/${s.id}`,
                    title: "View or edit event."
                }, [s.title, ' (', new Date(s.date * 1000).toISOString(), ')'])))),
                BUTTON({id: "newevent", type: "button"}, "New Event"),
            ],
        ]);
    }
})
