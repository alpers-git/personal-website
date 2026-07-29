My personal publication list, and personal website. Had a large AI refactor over a cursed HTML codebase. I bet its still shit...

## Adding a publication

All publications live in one place: [`js/publications-data.js`](js/publications-data.js).

Add an object to the top of the `PUBLICATIONS` array and everything else
updates itself:

- the year-grouped list on `publications.html`
- the "Recent Publications" block on `index.html` (the newest
  `RECENT_PUBLICATION_COUNT` entries, currently 3)
- the BibTeX dialog for that paper

There are no per-paper `#modalN` / `#paperN` ids to keep in sync any more —
one dialog is created at runtime and refilled on demand.

Write the `bibtex` field with ``String.raw`...` `` so LaTeX escapes such as
`\"` and `\&` survive verbatim.

To refresh `sahistanpubs.bib` from the same data (needs Node):

    node tools/export-bib.js

## Layout of the source

    css/style.css            all site styling; tokens in :root, components as classes
    css/webgl-ui.css         controls for the WebGL demo pages
    js/publications-data.js  the publication list (the only file you edit for papers)
    js/publications.js       renders the lists and the BibTeX dialog
    js/main.js               nav, smooth scrolling, hover previews
    tools/export-bib.js      regenerates sahistanpubs.bib

`css/style.css` is loaded *after* materialize.min.css on every page, so plain
class selectors override Materialize without needing `!important`. Keep that
order when adding a page.
