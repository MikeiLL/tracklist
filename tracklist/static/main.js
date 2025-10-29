import {
    choc,
    set_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, BUTTON, FIELDSET, FORM, H2, H3, H4, INPUT, LABEL, LEGEND, P, TD, IMG, SPAN} = choc; //autoimport
import {simpleconfirm} from "./utils.js";

const PURCHASE = {
  price_id: null,
  recurring: null,
}


function render_maindlg(heading, content, footer, alerts) {
    const dlg = DOM("dialog#main");
    heading && set_content("dialog#main h2", heading || "General Task");
    set_content("dialog#main #alertmessages", alerts)
    content && set_content("dialog#main #dlg_content", content || "content not found");
    footer && set_content("dialog#main footer", footer || "");
    dlg.open || dlg.showModal();
  }


  function login(e, error_msg) {
    return render_maindlg(
      "Login",
      [
        FORM({id: "login"}, [
          FIELDSET([
            LEGEND("Login"),
            LABEL([INPUT({name: "username", type: "text", "required": true}), "Username"]),
            LABEL([INPUT({name: "password", type: "password", "required": true, minlength: 6}), "Password"]),
            INPUT({type: "submit"}, "Submit"),
          ]),
        ]),
      ],
      error_msg && error_msg
    );
  }

on("click", "button#loginbutton", login);
on("click", "button#logoutbutton", async (e) => {
    await browser.cookies.remove("tracklist_access_token")
    window.location.reload();
 });


on("submit", "form#login", async (e) => {
    e.preventDefault();
    DOM("dialog#spinner").showModal();
    const formdata = new FormData(e.match);
    formdata.set("grant_type", "password");
    let response = await fetch("/token", {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "Accept": "application/json, text/plain, */*",
        },
        body: new URLSearchParams(formdata),
      });
    let result = await response.json();
    localStorage.setItem("tracklist_access_token", result.access_token);
    window.location.reload();
    }
);
