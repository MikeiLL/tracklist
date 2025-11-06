import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, DIV, H2, H3, LI, P, UL} = choc; //autoimport
import * as utils from "./utils.js";
import ws from "./ws.js";

const sock = ws({
    render: (state) => {
        set_content("main", DIV({class: "flexrow"},[
            state.songs && DIV([
                H2("Songs"),
                A({href: "/song", title:"see all songs"}, "See all ->"),
                UL({id: "songs"}, state.songs.map(s => LI([s.title, ' (', s.credits, ')']))),
            ]),
            state.events && DIV([
                H2("Upcoming Events"),
                A({href: "/event", title:"see all events"}, "See all ->"),
                UL({id: "events"}, state.events.map(s => LI(A({
                    href: `/event/${s.id}`,
                    title: "View or edit event."
                },
                DIV({class: "card"}, [
                    H3([utils.formatdate(s.date), " ", s.title]),
                    P(s.presenter),
                    P(s.description),
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
