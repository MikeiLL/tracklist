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

async function make_transaction(purchase) {
  let resp = await fetch("/payment/create-checkout-session",
    {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({
        "price_id": purchase.price_id,
        "recurring": purchase.recurring,
      }),
    }
  );
  let result = await resp.json();
  PURCHASE.price_id = null;
  if (result.url) {
    window.location = result.url;
  } else {
    set_content("dialog#main section", [H2("Something went wrong."), P([result.error || '', result.message]), H4(common_strings.help_text)])
  }
}

on("click", ".transaction", (e) => {
  PURCHASE.price_id = e.match.id;
  PURCHASE.recurring = e.match.dataset.recurring;
  if (e.match.dataset.loggedin) {
    make_transaction(PURCHASE);
  } else {
    login(e);
  };
});

function login(e) {
  set_content("dialog#main h2", "Login");
  set_content("dialog#main section", [
    FORM({id: "login"}, [
      FIELDSET([
        LEGEND("Login"),
        LABEL([INPUT({name: "email", type: "email", "aria-required": true, "required": true}), "Email"]),
        LABEL([INPUT({name: "password", type: "password", "aria-required": true, "required": true, minlength: 12}), "Password"]),
        INPUT({type: "submit"}, "Submit"),
      ]),
    ]),
  ]);
  set_content("dialog#main footer", [
    BUTTON({id: "register"}, "Register"),
    A({href: "forgotpassword"}, "Forgot password"),
    BUTTON({class: "dialog_close"}, "Cancel"),
  ]);
  DOM("dialog#main").showModal();
}

on("click", "a[href=forgotpassword]", (e) => {
  e.preventDefault();
  set_content("dialog#main header h2", "Forgot Your Password?");
  set_content("dialog#main section", H3(common_strings.help_text));
  set_content("dialog#main footer", BUTTON({class: "dialog_close"}, "Cancel"));
})

on("submit", "form#login", async (e) => {
  e.preventDefault();
  DOM("dialog#spinner").showModal();
  let response = await fetch("/login", {
    method: "POST",
    body: new FormData(e.match),
  });
  let result = await response.json();
  DOM("dialog#spinner").close()
  if (result.error) {
    set_content("dialog#main #alertmessages", [H2(result.error || "Something went wrong."), P(result.message), H4(common_strings.help_text)])
  } else {
    if (PURCHASE.price_id) make_transaction(PURCHASE);
    let actionmsg = result.user_level && result.grade_level >= 1 ? "Let's go to your dashboard..." : "Make a purchase or subscription below";
    set_content("dialog#main section", `Welcome back, ${result.ifaorishaname || result.fullname}. ${actionmsg}`);
    setTimeout(() => {
      if (result.user_level > 1) return window.location = "/admin";
      if (result.user_level <= 1) {
        if (result.grade_level < 1) return window.location = "/";
        return window.location = "/student";
      };
    }, 1000);
  }
})
function signup(e) {
  replace_content("dialog#main h2", "Register");
  replace_content("dialog#main section", [
    FORM({id: "signup"}, [
      FIELDSET([
        LEGEND("Register"),
        LABEL([INPUT({name: "fullname", "aria-required": true, "required": true}), "Full Name"]),
        LABEL([INPUT({name: "orishaname"}), "Ifa/Orisha Name"]),
        LABEL([INPUT({name: "email", type: "email", "aria-required": true, "required": true}), "Email"]),
        LABEL([INPUT({name: "password", type: "password", "aria-required": true, "required": true, minlength: 12}), "Password (at least 12 characters)"]),
        INPUT({type: "submit"}, "Submit"),
      ])
    ]),
  ]);
  set_content("dialog#main footer", [
    BUTTON({class: "dialog_close"}, "Cancel"),
  ]);
  if (DOM("dialog#main:modal" === null)) DOM("dialog#main").showModal();
}
on("click", "button#loginbutton", login);
on("click", "button#signup", signup);
on("click", "button#register", signup);
on("submit", "form#signup", async (e) => {
  e.preventDefault();
  let response = await fetch("/signup", {
    method: "POST",
    body: new FormData(e.match),
  });
  let result = await response.json();
  if (result.error) {
    set_content("dialog#main section", [H2(result.error || "Something went wrong."), P(result.message), H4("Call Iya or better yet, email Pinpin at help@oghtolal.com.")])
  }
});

on("click", "button.cancel_user_edit", (e) => { window.location.reload()})
on("click", "button.useredit", (e) => {
  let row = e.match.closest("tr");
  set_content(row, [...row.querySelectorAll("td")].map(c => {
    if (c.className == "useredit") {
      return TD({cellspan: 2},[
        BUTTON({type: "submit"}, "Submit"),
        INPUT({type: "hidden", value: row.id.replace("user_", ""), name: "userid"})
      ])
    }
    if (c.className == "userremove") {
      return TD({cellspan: 2},[
        BUTTON({type: "button", class: "cancel_user_edit"}, "Cancel"),
        INPUT({type: "hidden", value: row.id.replace("user_", ""), name: "userid"})
      ])
    }
    return TD([
    INPUT({name: c.dataset.name, type: c.className, style: "background-color: aliceblue;", value: c.innerText})
  ])}
  ))
})
on("click", "button.userremove", simpleconfirm("Delete user?", async (e) => {
  let row = e.match.closest("tr");
  let response = await fetch("/admin/users", {
    method: "DELETE",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({"user_id": row.id.replace("user_", "")}),
  });
  let result = await response.json();
  window.location.reload();
}));
on("click", "button.documentremove", simpleconfirm("Delete document?", async (e) => {
  let response = await fetch("/admin/docs", {
    method: "DELETE",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({"document_id": e.match.id.replace("document_", "")}),
  });
  let result = await response.json();
  window.location.reload();
}));

on("click", ".imgthumb", (e) => {
  set_content("dialog#main h2", ["Class Preview", SPAN("(Close this window and click view pdf to open or download file.)")]);
  set_content("dialog#main section", [IMG({src: `/images/thumbs/${e.match.dataset.id}`})]);
  set_content("dialog#main footer", []);
  DOM("dialog#main").showModal();
});

on("click", ".subscription_cancel", simpleconfirm("Cancel membership/tithe?", async (e) => {
  DOM("dialog#spinner").showModal();
  let response = await fetch("/payment/subscription", {
    method: "PUT",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({"subscription_id": e.match.id.replace("subscription_", "")}),
  });
  let result = await response.json();
  window.location.reload();
}));


on("submit", "#libraryadmin", (e) => {
  DOM("dialog#spinner").showModal();
});
