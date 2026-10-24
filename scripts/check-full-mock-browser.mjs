// Reuse the established browser regression checks against the new full mock only.
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
let reading=fs.readFileSync('scripts/check-imported-reading-browser.mjs','utf8').replaceAll('/practice/reading/1','/practice/reading/9').replaceAll('practice-reading-1','practice-reading-9').replaceAll('imported-reading-1','full-mock-reading-9');
fs.writeFileSync('.cache/full-mock-reading-check.mjs',reading);
let listening=fs.readFileSync('scripts/check-imported-listening-browser.mjs','utf8').replace('for(const {number} of catalog)','for(const {number} of catalog.filter(x=>x.number===17))');
// The default catalogue now also contains single sections and filter links.
listening=listening.replaceAll("document.querySelectorAll('.listening-practice-collection a')",`document.querySelectorAll('.cd-test-card:not([href*="/single/"])')`);
listening=listening.replaceAll('docs/imported-listening-browser-check.json','.cache/full-mock-listening-check.json');
fs.writeFileSync('.cache/full-mock-listening-check.mjs',listening);
for(const path of ['.cache/full-mock-reading-check.mjs','.cache/full-mock-listening-check.mjs']){const result=spawnSync(process.execPath,[path],{stdio:'inherit',env:process.env});if(result.status)process.exit(result.status);}
