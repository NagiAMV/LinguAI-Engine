import {analyticsStore} from '@/lib/analytics-store.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request){
 if(!await analyticsStore.authorized(request.headers.get('authorization')?.replace(/^Bearer /,'')))return Response.json({error:'Неверный ключ доступа.'},{status:401,headers:{'Cache-Control':'no-store'}});
 let days=30;try{days=(await request.json()).days;}catch{}
 return Response.json(await analyticsStore.report(days),{headers:{'Cache-Control':'no-store'}});
}
