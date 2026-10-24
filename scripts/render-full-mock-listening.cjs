// Only reviewed pure markup builders are evaluated; source startup code never runs.
const fs=require('fs'),vm=require('vm');
const d=JSON.parse(fs.readFileSync('.cache/mock-extracted.json','utf8')).find(x=>x.name==='mock-listening.html');
const names=['nb','gapInput','mcqOption','mcqCard','kbHelp','dropInline','mapZone','poolChips','flowArrow','flowChart','msCard','msCard3','matchRows','dragGroup','buildSection1','buildSection2','buildSection3','buildSection4'];
const code=names.filter(n=>d.functions[n]).map(n=>d.functions[n]).join('\n');
if(/\b(?:fetch|require|process|eval)\s*\(/.test(code))throw Error('Unexpected side effect in markup builder');
const context=vm.createContext({}, {codeGeneration:{strings:false,wasm:false}});vm.runInContext(code,context,{timeout:1000});
const parts=[];for(let n=1;n<=4;n++){const html=vm.runInContext('buildSection'+n+'()',context,{timeout:1000});parts.push({id:n,html});console.log(n,html.length,'images',(html.match(/<img/g)||[]).length);}
fs.writeFileSync('.cache/mock-listening-rendered.json',JSON.stringify({parts,answers:d.vars.LISTENING_ANSWERS,transcript:d.vars.TRANSCRIPT,answerTimes:d.vars.ANSWER_TIMES}));
