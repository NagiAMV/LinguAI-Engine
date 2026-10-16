const fs=require('node:fs'),{createHash}=require('node:crypto');
const {parse}=require('next/dist/compiled/babel/parser');
const file=process.argv[2],bytes=fs.readFileSync(file),html=bytes.toString('utf8');
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('const SECTIONS ='));
function literal(n){
 if(['StringLiteral','NumericLiteral','BooleanLiteral'].includes(n.type))return n.value;
 if(n.type==='ArrayExpression')return n.elements.map(literal);
 if(n.type==='ObjectExpression')return Object.fromEntries(n.properties.map(p=>{if(p.type!=='ObjectProperty'||p.computed)throw Error('Nonliteral property');return[p.key.name??p.key.value,literal(p.value)];}));
 throw Error('Nonliteral data: '+n.type);
}
const data={sourceFile:file.split(/[\\/]/).pop(),sourceSha256:createHash('sha256').update(bytes).digest('hex')};
function walk(n){if(!n||typeof n!=='object')return;if(n.type==='VariableDeclarator'&&['SECTIONS','PASSAGES','READING_EXPLANATIONS'].includes(n.id.name))data[n.id.name]=literal(n.init);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
walk(parse(source));fs.writeFileSync('.cache/reading-paper.json',JSON.stringify(data));
for(const [p,sections]of Object.entries(data.SECTIONS))for(const section of sections)console.log(p,JSON.stringify(section));
