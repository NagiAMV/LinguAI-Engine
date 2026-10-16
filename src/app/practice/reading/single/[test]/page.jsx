import {readFile} from 'node:fs/promises';import path from 'node:path';import {notFound} from 'next/navigation';
import CambridgeExam from '@/components/content/CambridgeExam';
import catalog from '@/data/single-passage-reading-catalog.json';import keys from '@/data/single-passage-reading-keys.json';import explanations from '@/data/single-passage-reading-explanations.json';
export async function generateStaticParams(){return catalog.map(item=>({test:String(item.number)}));}
export default async function SingleReadingPage({params}){
 const {test:number}=await params;const item=catalog.find(i=>String(i.number)===number);if(!item)notFound();
 const test=JSON.parse(await readFile(path.join(process.cwd(),'public','practice',item.id+'.json'),'utf8'));
 return <CambridgeExam key={test.id} test={test} answerKey={keys[item.id]} explanations={explanations[item.id]||{}}/>;
}
