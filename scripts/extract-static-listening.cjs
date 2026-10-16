// Read literal data only. Never execute the supplied HTML or its scripts.
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {parse}=require('next/dist/compiled/babel/parser');
const file=process.argv[2];
const html=fs.readFileSync(file,'utf8');
const code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('const SC_ACCEPT'));
if(!code)throw Error('Unsupported paper: no static SC_ACCEPT data');
function literal(n){
 if(['StringLiteral','NumericLiteral','BooleanLiteral'].includes(n.type))return n.value;
 if(n.type==='ArrayExpression')return n.elements.map(literal);
 if(n.type==='ObjectExpression')return Object.fromEntries(n.properties.map(p=>{if(p.type!=='ObjectProperty'||p.computed)throw Error('Not literal data');return[p.key.name??p.key.value,literal(p.value)];}));
 throw Error('Not literal data: '+n.type);
}
const wanted=new Set(['SC_ACCEPT','MCQ_CORRECT','LETTERBANK_CORRECT','MULTI_GROUPS','TRANSCRIPTS']);const data={};
for(const node of parse(code).program.body)if(node.type==='VariableDeclaration')for(const d of node.declarations)if(wanted.has(d.id.name))data[d.id.name]=literal(d.init);
for(const name of wanted)if(!data[name])throw Error('Missing '+name);
data._sourceSha256=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.mkdirSync('.cache',{recursive:true});fs.writeFileSync('.cache/static-listening-paper.json',JSON.stringify(data));
console.log('Extracted static keys and four transcripts; no source scripts executed.');
