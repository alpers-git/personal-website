/**
 * Regenerates sahistanpubs.bib from js/publications-data.js so the .bib file
 * never drifts away from what the site actually shows.
 *
 *   node tools/export-bib.js
 *
 * The data file is a plain script (no module system) because the browser loads
 * it with a <script> tag, so it is evaluated here in a throwaway context.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const dataFile = path.join(root, 'js', 'publications-data.js');
const outFile = path.join(root, 'sahistanpubs.bib');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(dataFile, 'utf8'), sandbox, { filename: dataFile });

if (!Array.isArray(sandbox.PUBLICATIONS)) {
  console.error('Could not read PUBLICATIONS from ' + dataFile);
  process.exit(1);
}

const bib = sandbox.PUBLICATIONS
  .slice()
  .sort((a, b) => a.year - b.year)
  .map((pub) => pub.bibtex.trim())
  .join('\n\n');

fs.writeFileSync(outFile, bib + '\n', 'utf8');
console.log('Wrote ' + sandbox.PUBLICATIONS.length + ' entries to ' + path.relative(root, outFile));
