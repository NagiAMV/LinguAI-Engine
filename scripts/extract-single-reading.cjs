const fs=require('node:fs'),vm=require('node:vm'),{createHash}=require('node:crypto'),{parse}=require('next/dist/compiled/babel/parser');
function literal(n){if(['StringLiteral','NumericLiteral','BooleanLiteral'].includes(n.type))return n.value;if(n.type==='TemplateLiteral'&&!n.expressions.length)return n.quasis[0].value.cooked;if(n.type==='ArrayExpression')return n.elements.map(literal);if(n.type==='ObjectExpression')return Object.fromEntries(n.properties.map(p=>{if(p.type!=='ObjectProperty'||p.computed)throw Error('Nonliteral');return[p.key.name??p.key.value,literal(p.value)];}));throw Error(n.type);}
const result=process.argv.slice(2).map(file=>{
 const bytes=fs.readFileSync(file),html=bytes.toString('utf8'),data={file,sourceFile:file.split(/[\\/]/).pop(),sha256:createHash('sha256').update(bytes).digest('hex')};
 for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  const code=match[1],vars=new Map();function walk(n){if(!n||typeof n!=='object')return;if(n.type==='VariableDeclarator')vars.set(n.id.name,n.init);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}walk(parse(code));
  for(const name of ['ANSWERS','EXPLANATIONS','HIGHLIGHTS','PASSAGE_HTML','PASSAGE_TITLE'])if(vars.has(name))data[name]=literal(vars.get(name));
  if(vars.has('QUESTIONS_HTML')){
   const names=['LETTERS','PARAS','ROW','MCQ','YNNG','TFNG','endSel','PEOPLE','HEAD_OPTS','headSel','THREE_OPTS','threeBox','paraSel','eventSel','G','WORD','SA','QUESTIONS_HTML'].filter(n=>vars.has(n));const selected=names.map(n=>`const ${n}=${code.slice(vars.get(n).start,vars.get(n).end)};`).join('\n');
   // Reviewed pure option/row templates, with no page startup code or event handlers.
   data.questions=vm.runInNewContext(selected+'\nQUESTIONS_HTML',{}, {timeout:1000,contextCodeGeneration:{strings:false,wasm:false}});
  }
 }
 return data;
});fs.writeFileSync('.cache/single-reading-batch.json',JSON.stringify(result));console.log(result.map(d=>({file:d.sourceFile,questions:Object.keys(d.ANSWERS).length})));
