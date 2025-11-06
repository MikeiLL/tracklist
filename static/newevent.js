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
            FORM({id: "event-form", method: "POST"}, [
                FIELDSET([
                    LEGEND("Event Details"),
                    LABEL([
                        "Date",
                        INPUT({type: "date", name: "eventdate", value: "11/04/2025"})
                    ])
                ]),
                FIELDSET([
                    LEGEND("Songs"),
                    LABEL([
                        "Title",
                        INPUT({type: "text", name: "songtitle", value: "Test Song One"})
                    ]),
                    LABEL([
                        "Credits",
                        INPUT({type: "text", name: "credits", value: "anonymous"})
                    ]),
                    LABEL([
                        "Title",
                        INPUT({type: "text", name: "songtitle", value: "Test Song Two"})
                    ]),
                    LABEL([
                        "Credits",
                        INPUT({type: "text", name: "credits", value: "Unknown"})
                    ]),
                ]),
                INPUT({type: "submit"}),
            ])
        ]);
    }
});

on("submit", "form#event-form", async (e) => {
    e.preventDefault();
    DOM("dialog#spinner").showModal();
    const formdata = new FormData(e.match);
    console.log(new URLSearchParams(formdata));
    return;
    let response = await fetch("/token", {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "Accept": "application/json, text/plain, */*",
        },
        body: new URLSearchParams(formdata),
      });
    let result = await response.json();
    window.location = "/";
    }
);
