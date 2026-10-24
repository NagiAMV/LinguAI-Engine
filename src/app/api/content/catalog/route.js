import {NextResponse} from 'next/server';
import listening from '@/data/practice-listening-catalog.json';
import reading from '@/data/practice-reading-catalog.json';
import singles from '@/data/single-passage-reading-catalog.json';
import singleListening from '@/data/single-section-listening-catalog.json';
export async function GET(request){
 const params=new URL(request.url).searchParams,type=params.get('type')||'listening',query=(params.get('query')||'').toLowerCase();
 if(!['reading','listening','writing','speaking'].includes(type))return NextResponse.json({error:'Unsupported content type.'},{status:400});
 const single=params.get('format')==='single',part=Number(params.get('part'));
 if(params.has('part')&&(!Number.isInteger(part)||part<1||part>(type==='reading'?3:4)))return NextResponse.json({error:'Invalid part.'},{status:400});
 const rows=type==='listening'?(single?singleListening:listening):type==='reading'?(single?singles:reading):[];
 const items=rows.filter(item=>!single||!part||(item.passageNumber||item.sectionNumber)===part).map(item=>({...item,resource:type,url:`/practice/${type}/${single?'single/':''}${item.number}`})).filter(item=>`${item.title} ${item.topics||''} ${item.topic||''}`.toLowerCase().includes(query));
 return NextResponse.json({resource:type,source:'local-import',items});
}
