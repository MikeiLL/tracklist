import {lindt, replace_content, choc, set_content} from "https://rosuav.github.io/choc/factory.js";
const { TH, TR, TD} = lindt; //autoimport

/*
Usage:
import {sortable_table} from "./sortable_table.js";
const someTable = new sortable_table({
	element: DOM("#some-table-in-the-dom"),
	cols: [
		{label: "Name", field: "name", style: "text-align: left;"},
		{label: "Description", field: "description", style: "text-align: left;"},
		{label: "Delete", style: "text-align: center;", class: "button", render: () => BUTTON({ class: "delete-thing" }, "🗑")},
	],
	rowAttrs: (row) => ({
		"data-id": row.id,
		"key": row.id,
	}),
});

if (state.stuff) {
		return someTable.render(state.stuff);
	}
*/

export class sortable_table {
	/**
	 * @param {*} params
	 */
	constructor(params) {
		this.params = params;
		this.table = params.element || choc.TABLE();
		set_content(this.table, [
			this._thead = choc.THEAD(),
			this._tbody = choc.TBODY(),
		]).classList.add("sortable_table");
		this.table.sortable_table = this; // refloop (could linger in memory)
	}

	set_filter(filter) {
		this.filter = filter;
		if (this.items) this.render(this.items);
	}

	sort_by(col) {
		if (this.params.cols[col].nosort) return;
		if (this._sortidx === col) this._sortdir = -this._sortdir;
		else {this._sortidx = col; this._sortdir = 1;}
		if (this.items) this.render();
	}

	render(items) {
		if (items) this.items = items;
		replace_content(this._thead, TR(this.params.cols
			.map((col, idx) => TH({title: "Click to Sort"},
				[col.label, idx === this._sortidx ? this._sortdir > 0 ? "▲" : "▼" : ""])))
		);
		replace_content(this._tbody, this.items.filter((item) => {
			if (!this.filter) return true;
			let display = true;
			Object.entries(this.filter).forEach(([key, value]) => {
				if (key === "search") {
					for (let val of value) {
						if (!Object.values(item).some(cell_content => ("" + cell_content).toLowerCase().includes(("" + val).toLowerCase()))) display = false;
					}
				} else if (item[key] != value) display = false; // coerce as needed
			});
			return display;
		}).sort((a, b) => {
			const col = this.params.cols[this._sortidx];
			if (!col) return 0;
			if (col.numeric) return (a[col.field] - b[col.field]) * this._sortdir;
			return ("" + a[col.field]).localeCompare(("" + b[col.field])) * this._sortdir;
		}).map(item => TR(this.params.rowAttrs(item) || {},
			this.params.cols.map(col => TD({style: col.style, class: col.class || ""},
				col.render ? col.render(item)
				: col.format ? col.format(item[col.field])
				: item[col.field]
			)))// end TR
		));
	}
}

on("click", ".sortable_table th", e => {
	const table = e.match.closest(".sortable_table").sortable_table;
	if (table) table.sort_by(e.match.cellIndex);
});
