import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {FIELDSET, FORM, INPUT, LABEL, LEGEND, PRE} = choc; //autoimport
import {simpleconfirm} from "./utils.js";
import ws from "./ws.js";

const sock = ws({
    render: (state) => {
        console.log(state)
        if (state.event) {
            return set_content("main", [
                FORM({id: "event"}, [
                    FIELDSET([
                        LEGEND("Event Details"),
                        INPUT({
                            type: "date", name: "date", value: new Date(state.event.date * 1000)
                                .toISOString().split("T")[0]
                        }),
                        LABEL(["Title", INPUT({type: "text", name:"title", value: state.event.title})]),
                        LABEL(["Desc", INPUT({type: "text", name:"description", value: state.event.description})]),
                        LABEL(["Presenter", INPUT({type: "text", name:"presenter", value: state.event.presenter})]),
                    ])
                ]),
                PRE(JSON.stringify(state.event)),
                PRE(JSON.stringify(state.songs)),
            ]);
        }
        if (state.events) {
            set_content("main", PRE(JSON.stringify(state.events)));
        }
    }
})

on("change", "form#event input", (e) => {
    sock.send({cmd: "updateevent", [e.match.name]: e.match.value});
})
