const fs=require('node:fs'),path=require('node:path');
const filename=path.resolve(__dirname,'../../src/components/content/ErrorTags.jsx');
const compiled=require('next/dist/compiled/babel/core').transformSync(fs.readFileSync(filename,'utf8'),{filename,presets:[require.resolve('next/babel')]}).code;
const component={exports:{}};
new Function('require','module','exports',compiled)(id=>{
 if(id==='./error-tags.mjs')return require('../../src/components/content/error-tags.mjs');
 if(id.startsWith('@babel/runtime/'))return require('next/dist/compiled/'+id);
 return require(id);
},component,component.exports);
module.exports=component.exports;
