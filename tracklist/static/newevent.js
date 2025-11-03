import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {FIELDSET, FORM, INPUT, LABEL, LEGEND} = choc; //autoimport
import {simpleconfirm} from "./utils.js";
import ws from "./ws.js";

ws({
    render: (state) => {
        set_content("main", [
            FORM({method: "POST"},[
                FIELDSET([
                    LEGEND("Event Details"),
                    LABEL([
                        "Date",
                        INPUT({type: "date", name: "eventdate"})
                    ])
                ]),
                FIELDSET([
                    LEGEND("Songs"),
                    LABEL([
                        "Title",
                        INPUT({type: "text", name: "songtitle"})
                    ]),
                    LABEL([
                        "Credits",
                        INPUT({type: "text", name: "credits"})
                    ]),
                    LABEL([
                        "Title",
                        INPUT({type: "text", name: "songtitle"})
                    ]),
                    LABEL([
                        "Credits",
                        INPUT({type: "text", name: "credits"})
                    ]),
                ]),
                INPUT({type: "submit"}),
            ])
        ]);
    }
})
