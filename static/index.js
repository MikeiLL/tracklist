import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, DIV, H2, H3, LI, P, SPAN, UL, BR,} = choc; //autoimport
import * as utils from "./utils.js$$cachebust$$";
import ws from "./ws.js$$cachebust$$";

const sock = ws({
    render: (state) => {
        console.log(state);
        set_content("main", DIV({class: "flexrow"},[
            state.events && DIV([
                H2("Upcoming Events"),
                A({href: "/event", title:"see all events"}, "See all ->"),
                UL({id: "events", class: "eventlist"}, Object.values(state.events).map(e => LI(
                    {"data-date": utils.formatdate(e.date)}, [
                    DIV({class: "date"}, utils.formatdate(e.date)),
                    DIV({class: "card"}, [
                    H2([e.title, A({
                        href: `/event/${e.id}`,
                        title: "View or edit event."
                    }, "✎")]),
                    P({class: "personelle", }, [
                        SPAN({class:"label"}, "Presenter "), e.presenter || "not set", " – ",
                        SPAN({class:"label"}, "Service Leader "), e.contact || "not set",
                    ]),
                        UL({class: "eventsongs"}, e.songs.map(s => LI(
                            [
                                H3([SPAN({class: "songnum", }, [s.song_number ? ["#", s.song_number] : ""]),
                                    SPAN(" "),
                                s.title,
                                SPAN(" "),
                                s.usage && [BR(), SPAN({class: "usage",}, " ("+s.usage+")")],]),
                                DIV([
                                    s.songcomments && P({class:"songcomments", }, s.songcomments),
                                    s.songlinks && UL({class: "songlinks", }, s.songlinks.map(n => LI(n)))
                                ]),
                    ])))
                    ])]
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
