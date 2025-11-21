import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, DIV, H2, LI, P, SPAN, UL} = choc; //autoimport
import * as utils from "./utils.js$$cachebust$$";
import ws from "./ws.js$$cachebust$$";

const sock = ws({
    render: (state) => {
        set_content("main", DIV({class: "flexrow"},[
            state.events && DIV([
                H2("Upcoming Events"),
                A({href: "/event", title:"see all events"}, "See all ->"),
                UL({id: "events", class: "eventlist"}, Object.values(state.events).map(e => LI({"data-date": utils.formatdate(e.date)}, DIV({class:"card"},[
                    H2([e.title, A({
                        href: `/event/${e.id}`,
                        title: "View or edit event."
                    }, "✎")]),
                    P({class: "personelle", }, [
                        SPAN({class:"label"}, "Presenter "), e.presenter || "not set", " – ",
                        SPAN({class:"label"}, "Service Leader "), e.contact || "not set",
                    ]),
                    UL({class: "eventsongs"}, e.songs.map(s => LI({"data-number": s.song_number || ""}, [
                        s.title,
                        s.usage && SPAN({style: "color:var(--grey);",}, " ("+s.usage+")"),
                    ])))
                    ])
                ))), // end UL
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
