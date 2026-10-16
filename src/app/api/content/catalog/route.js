import {NextResponse} from 'next/server';
import listening from '@/data/practice-listening-catalog.json';
import reading from '@/data/practice-reading-catalog.json';
import singles from '@/data/single-passage-reading-catalog.json';
export async function GET(request){
 const params=new URL(request.url).searchParams,type=params.get('type')||'listening',query=(params.get('query')||'').toLowerCase();
 if(!['reading','listening','writing','speaking'].includes(type))return NextResponse.json({error:'Unsupported content type.'},{status:400});
 const rows=type==='listening'?listening:type==='reading'?(params.get('format')==='single'?singles:reading):[];
 const items=rows.map(item=>({...item,resource:type,url:`/practice/${type}/${type==='reading'&&params.get('format')==='single'?'single/':''}${item.number}`})).filter(item=>`${item.title} ${item.topics||''}`.toLowerCase().includes(query));
 return NextResponse.json({resource:type,source:'local-import',items});
}
