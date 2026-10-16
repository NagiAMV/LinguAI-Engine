const fs=require('fs'),vm=require('vm'),{parse}=require('next/dist/compiled/babel/parser');const ds=JSON.parse(fs.readFileSync('.cache/batch27-extracted.json','utf8'));
function ids(code){const set=new Set();function walk(n){if(!n||typeof n!=='object')return;if(n.type==='Identifier')set.add(n.name);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}walk(parse(code));return set;}
function deps(d,root){const found=new Set();function add(code){for(const n of ids(code))if(d.functions[n]&&!found.has(n)){found.add(n);add(d.functions[n]);}}add(root);return [...found].map(n=>d.functions[n]).join('\n');}
const builders={"Australia's Camouflaged Creatures.html":['buildDQ','buildDQ1','buildDQ2','buildSent'],'effects_population (2).html':['buildBank','buildDQ','buildGap'],'mind music reading p2 (2).html':['buildParaBlocks','buildMatchBlocks'],'olmec reading p1 (2).html':['buildTFN'],'sound in ocean (2).html':['buildTFN','buildDQ','buildMCQ'],'The Dead Sea Scrolls (2).html':['buildFill','buildTFN'],'Antarctica_Passage_1 (2).html':['buildTFNG','buildSC']};
for(const d of ds){
 const context=vm.createContext(Object.fromEntries(Object.entries(d.vars).filter(([n])=>!/^VALID_|PASSWORD/.test(n))),{codeGeneration:{strings:false,wasm:false}});
 if(d.templates.QUESTIONS_HTML){const code=deps(d,'const questions='+d.templates.QUESTIONS_HTML+';')+'\n'+d.templates.QUESTIONS_HTML;if(/\b(?:document|window|fetch|require|process|eval)\s*[.(]/.test(code))throw Error('Review template '+d.name);d.questions=vm.runInContext(code,context,{timeout:1000});}
 else if(d.vars.QUESTIONS_HTML)d.questions=d.vars.QUESTIONS_HTML;
 if(builders[d.name]){
  const panels={};context.document={getElementById(id){return panels[id]??= {innerHTML:'',addEventListener(){}}},querySelectorAll(){return []}};const code=builders[d.name].map(n=>d.functions[n]).join('\n')+'\n'+builders[d.name].filter(n=>n!=='buildDQ'||!d.functions.buildDQ1).map(n=>n+'()').join(';');vm.runInContext(code,context,{timeout:1000});d.panels=Object.fromEntries(Object.entries(panels).filter(([,v])=>v.innerHTML).map(([k,v])=>[k,v.innerHTML]));
 }
 if(d.name==='Listening test 16_1 (2).html'){
  const html=fs.readFileSync(d.file,'utf8');for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){const code=m[1];let raw;function walk(n){if(!n||typeof n!=='object')return;if(n.type==='VariableDeclarator'&&n.id.name==='L_HTML')raw=code.slice(n.init.start,n.init.end);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v)}walk(parse(code));if(raw){d.L_HTML=vm.runInContext(deps(d,'const L_HTML='+raw)+'\n('+raw+')',context,{timeout:1000});}}
 }
 console.log(d.name,d.questions?'template '+d.questions.length:d.panels?Object.keys(d.panels):d.L_HTML?'Listening markup':'static/data');
}
fs.writeFileSync('.cache/rendered-27.json',JSON.stringify(ds));
