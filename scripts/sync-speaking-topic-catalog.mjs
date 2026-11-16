import fs from 'node:fs';
const bank=JSON.parse(fs.readFileSync(new URL('../src/data/speaking-question-bank.json',import.meta.url),'utf8'));
const topics=bank.sessions.map(({n,t2})=>({n,t2}));
fs.writeFileSync(new URL('../src/data/speaking-topic-catalog.json',import.meta.url),JSON.stringify(topics,null,2)+'\n');
console.log(`Updated ${topics.length} Speaking topic summaries without model answers.`);
