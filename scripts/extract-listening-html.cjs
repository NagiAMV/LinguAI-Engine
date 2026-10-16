// One-time extraction of reviewed data and pure markup builders, never page startup code.
const fs = require('node:fs');
const vm = require('node:vm');
const {parse} = require('next/dist/compiled/babel/parser');
const inputs = process.argv.slice(2);
if (inputs.length !== 2) throw Error('Pass the two supplied HTML paths in test order');
function literal(node) {
  if (['StringLiteral','NumericLiteral','BooleanLiteral'].includes(node.type)) return node.value;
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(p => {
    if (p.type !== 'ObjectProperty' || p.computed) throw Error('Not static data');
    return [p.key.name ?? p.key.value, literal(p.value)];
  }));
  throw Error('Not static data: '+node.type);
}
const results = inputs.map((file, index) => {
  const html = fs.readFileSync(file,'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  const code = scripts.find(s=>s.includes(index ? 'const LISTENING_ANSWERS' : 'var LQUESTIONS'));
  const ast = parse(code); const declarations = new Map(); const functions = new Map();
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') declarations.set(node.id.name,node.init);
    if (node.type === 'FunctionDeclaration') functions.set(node.id.name,node);
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value==='object') walk(value);
  }
  walk(ast);
  let questions;
  if (!index) questions=Object.values(literal(declarations.get('LQUESTIONS')));
  else {
    // These exact functions were inspected: string templates, array maps and joins only.
    const names=['nb','gapInput','mcqOption','mcqCard','kbHelp','msCard','matchRows','buildSection1','buildSection2','buildSection3','buildSection4'];
    const builders=names.map(name=>{const n=functions.get(name);if(!n)throw Error(name);return code.slice(n.start,n.end);}).join('\n');
    const context=vm.createContext({}, {codeGeneration:{strings:false,wasm:false}});
    questions=vm.runInContext(builders+'\n[buildSection1(),buildSection2(),buildSection3(),buildSection4()]',context,{timeout:1000});
  }
  const audio = index ? html.match(/<source[^>]+src="([^"]+\.mp3)"/i)?.[1] : literal(declarations.get('AUDIO_URL'));
  return {sourceFile:file.split(/[\\/]/).pop(), questions, audio,
    answers:literal(declarations.get(index?'LISTENING_ANSWERS':'ANSWERS_L')),
    groups:index?{a:{qs:[17,18],correct:['D','E']},b:{qs:[19,20],correct:['A','E']}}:literal(declarations.get('GROUPS_L')),
    transcript:index?literal(declarations.get('TRANSCRIPT')):[],
    explanations:index?{}:literal(declarations.get('EXPL_L'))};
});
fs.mkdirSync('.cache',{recursive:true});
fs.writeFileSync('.cache/listening-extracted.json',JSON.stringify(results));
console.log(results.map((r,i)=>({test:i+1,parts:r.questions.length,audio:r.audio,transcriptLines:r.transcript.length})));
