// Only reviewed pure HTML builders are evaluated; no page initialization runs.
const fs=require('node:fs'),vm=require('node:vm'),{createHash}=require('node:crypto');
const {parse}=require('next/dist/compiled/babel/parser');
const file=process.argv[2],blob=fs.readFileSync(file),html=blob.toString('utf8');
const code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('const L_HTML='));
const ast=parse(code),vars=new Map(),funcs=new Map();
for(const node of ast.program.body){if(node.type==='VariableDeclaration')for(const d of node.declarations)vars.set(d.id.name,d.init);if(node.type==='FunctionDeclaration')funcs.set(node.id.name,node);}
const names=['mcq','optBox','gridRow','gridTable','sentQ'];
const builders=names.map(n=>{const a=funcs.get(n);return code.slice(a.start,a.end);}).join('\n');
const dataNames=['AD','AH','L_HTML','KEY'];
const declarations=dataNames.map(n=>`const ${n}=${code.slice(vars.get(n).start,vars.get(n).end)};`).join('\n');
const data=vm.runInNewContext('function flagBtn(){return "";}\n'+builders+'\n'+declarations+'\n({questions:Object.values(L_HTML),answers:KEY})',{}, {timeout:1000,contextCodeGeneration:{strings:false,wasm:false}});
data.audio=html.match(/<source[^>]+src="([^"]+)"/)[1];data.sourceFileSha256=createHash('sha256').update(blob).digest('hex');data.sourceFile=file.split(/[\\/]/).pop();
fs.writeFileSync('.cache/grid-listening-paper.json',JSON.stringify(data));console.log('Extracted four question sections and 40 keys.');
