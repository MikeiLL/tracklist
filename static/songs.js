import {
    lindt,
    replace_content,
    on,
    DOM,
} from "https://rosuav.github.io/choc/factory.js";
const {A, P, BUTTON, DIV, FIELDSET, FORM, INPUT, LABEL, LI, SPAN, STYLE, TABLE, TBODY, TD, TEXTAREA, TH, THEAD, TR, UL} = lindt; //autoimport
import * as utils from "./utils.js$$cachebust$$";
import ws from "./ws.js$$cachebust$$";

import {sortable_table} from "./sortable_table.js";

const CHECKED_ROWS = [];

const sock = ws({
    render: (state) => {
        replace_content("dialog#main .dlg_header h2", "Add Song");
        replace_content("dialog#main .dlg_content", [
            FORM({id: "editsongform"}, [
                FIELDSET([LABEL(["Title", INPUT({type: "text", name: "title"})]),
                LABEL(["Credits", INPUT({type: "text", name: "credits"})]),
                LABEL(["Number", INPUT({type: "text", name: "song_number"})]),
                LABEL(["Notes", TEXTAREA({type: "text", name: "notes"})]),
                INPUT({type: "submit", class: "button"}, "Submit")]),
            ]),
        ]);
        replace_content("main", [
            state.song && [
                DIV({class: "notifications hidden"}),
                FORM({id: "editsongform", "data-id": state.song.id},[
                    FIELDSET([
                        LABEL(["Title", INPUT({type: "text", name: "title", value: state.song.title})]),
                        LABEL(["Credits", INPUT({type: "text", name: "credits", value: state.song.credits})]),
                        LABEL(["Song Number", INPUT({type: "number", name: "song_number", value: state.song.song_number})]),
                        LABEL(["Notes", TEXTAREA({type: "text", name: "notes", value: state.song.notes})]),
                        UL({class: "tags"}, [
                            state.song.tags.map(t => LI([t, SPAN({class: "delete", "data-tag": t, title: "delete tag"}, "x")])),
                            INPUT({type: "text", name: "new_tag", })
                        ]),
                    ]),
                ]),
            ],
            state.songs && DIV({style: "display: flex; flex-direction: row;"}, [
                TABLE({"id": "songlist_filter"}, [
                    TR([TH({colspan: 4}, [`Filter listing by title, credits, etc`, SPAN({class:"ellipsis"},"..."), ` Sort by clicking column headers.`]),TH()]),
                    TR({class:"reverse_labels"},[
                        TD(LABEL(["Title",INPUT({name: "title", value: ""})])),
                        TD(LABEL(["Credits",INPUT({name: "credits", })])),
                        TD(LABEL(["Song Number",INPUT({name: "song_number", })])),
                        TD(LABEL(["Tags", INPUT({name: "tags", })])),
                        TD({colspan: 3}, [
                            TABLE(
                                TR({class:"reverse_labels"},[
                                    TD(
                                        FORM({id: "tags"}, [
                                            INPUT({name: "addtag", value: "", placeholder: "eg: folk"}),
                                            INPUT({type: "submit", value: "Tag selected songs"})
                                    ])), // end form, TD
                                ])) // end tr, inner table
                        ]),
                    ])
                ]),

            ]),
            state.songs && TABLE({"id": "songlisting"})
        ]);


        const songTable = new sortable_table({
            element: DOM("#songlisting"),
            cols: [
                {render: () => INPUT({type:"checkbox", name: "addTag"})},
                {label: "Title", field: "title", style: "text-align: left;"},
                {label: "Credits", field: "credits", style: "text-align: left;"},
                {label: "Number", field: "song_number", style: "text-align: left;"},
                {label: "Tags", field: "tags", style: "text-align: left;", format: (tags) => UL({class: "tags"},tags.map(t=>LI(t)))},
                {label: "Notes", field: "notes", style: "text-align: left;"},
                {label: "Edit", style: "text-align: center;", class: "button", render: () => A({class: "button", href: `#`, title: "edit song"}, "edit")},
            ],
            rowAttrs: (row) => ({
                "data-id": row.id,
                "key": row.id,
            }),
        });

        function song_list_filter() {
            //const search = DOM("#search").value.toLowerCase().split(" ");
            const form_elems = DOM("#songlist_filter").querySelectorAll("input");
            const song_attributes = {};
            form_elems.forEach(elem => {
                if (elem.value) song_attributes[elem.name] = elem.value;
            });
            //song_attributes.search = search;
            songTable.set_filter(song_attributes);
        }


        on("change", "#songlist_filter input", song_list_filter);
        on("input", "#songlist_filter input", song_list_filter);

        if (state.songs) {
            return songTable.render(state.songs);
        }
    },
    sockmsg_song_created: (msg) => {
        window.location = `/song/${msg.id}`;
    },
    sockmsg_song_updated: (msg) => {
        replace_content(".notifications",
            Object.keys(msg.changes).map(
                k => k + " updated")
        ).classList.remove("hidden");
    }
});


on("click", "#songlisting tr td a", (e) => e.match.href = `/song/${e.match.closest_data("id")}`);
//update song set tags = tags || 'test again'::text where id in (8,2,9) and not 'test again' = any(tags);

on("click", "input[type=checkbox]", (e) => {
    const id = e.match.closest_data("id");
    if (CHECKED_ROWS.includes(id)) {
        let idx = CHECKED_ROWS.indexOf(id);
        if (idx > -1) {
            CHECKED_ROWS.splice(idx, 1);
        }
    } else {
        CHECKED_ROWS.push(id);
    }
});

on("submit", "form#tags", (e) => {
    e.preventDefault();
    const tag = e.match.elements[0].value;
    sock.send({cmd: "bulk_tag", song_ids: CHECKED_ROWS, tag});
    CHECKED_ROWS = [];
});

on("input", "#songs-filter input", e => {
    let css = "";
    document.querySelectorAll("#songs-filter input").forEach(i => {
        if (i.value) {
            css += "#songs-filter tbody tr:not([data-" + i.name + '*="' + i.value.toLowerCase() + '"]) {display:none}'
        }
    });
    replace_content("#songs-filter style", css);
});

on("click", "#newsong", async () => {
    sock.send({cmd: "create_song"});
});

on("change", "#editsongform input, #editsongform textarea", e => {
    sock.send({cmd: "edit_song", id: e.match.closest_data("id"), [e.match.name]: e.match.value});
    if (e.match.name === "new_tag") e.match.value = "";
});

on("click", "#editsongform span.delete", e => {
    sock.send({cmd: "del_tag", id: e.match.closest_data("id"), tag: e.match.dataset.tag})
});
