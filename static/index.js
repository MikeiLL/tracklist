import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, DIV, H2, H3, LI, P, UL} = choc; //autoimport
import * as utils from "./utils.js$$cachebust$$";
import ws from "./ws.js$$cachebust$$";

const sock = ws({
    render: (state) => {
        set_content("main", DIV({class: "flexrow split"},[
            state.songs && DIV({class:"card"}, [
                H2("Songs"),
                A({href: "/song", title:"see all songs"}, "See all ->"),
                UL({id: "songs"}, state.songs.map(s => LI(A({href:`/song/${s.id}`, title:"view/edit song"},[s.title, ' (', s.credits, ')'])))),
            ]),
            state.events && DIV({class:"card"}, [
                H2("Upcoming Events"),
                A({href: "/event", title:"see all events"}, "See all ->"),
                UL({id: "events"}, Object.values(state.events).map(e => LI(A({
                    href: `/event/${e.id}`,
                    title: "View or edit event."
                },
                DIV({}, [
                    H3([utils.formatdate(e.date), " ", e.title]),
                    P(e.presenter),
                    P(e.description),
                    UL(e.songs.map(s => LI(s.title)))
                    ])
                )))), // end UL
                BUTTON({id: "newevent", type: "button"}, "Create Event"),
            ]),
        ]));
    }
});

on("click", "#newevent", async (e) => {
    const response = await fetch("/events", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "date": new Date().toISOString(),
            "description": "",
            "presenter": ""
        }),
    });
    const event = await response.json();
    window.location = `/event/${event.id}`;
});
