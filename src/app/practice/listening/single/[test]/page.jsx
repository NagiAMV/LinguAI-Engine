import {readFile} from 'node:fs/promises';import path from 'node:path';import {notFound} from 'next/navigation';
import ExamPlayer from '@/components/content/ExamPlayer';
import catalog from '@/data/single-section-listening-catalog.json';import keys from '@/data/single-section-listening-keys.json';
export async function generateStaticParams(){return catalog.map(item=>({test:String(item.number)}));}
export default async function SingleListeningPage({params}){
 const {test:number}=await params,item=catalog.find(i=>String(i.number)===number);if(!item)notFound();
 const test=JSON.parse(await readFile(path.join(process.cwd(),'public','practice',item.id+'.json'),'utf8'));
 return <ExamPlayer key={test.id} test={test} answerKey={keys[item.id]} explanations={{}}/>;
}
