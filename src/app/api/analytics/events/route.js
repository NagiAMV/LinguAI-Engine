import {analyticsStore,validateAnalyticsEvent} from '@/lib/analytics-store.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin&&origin!==`${request.headers.get('x-forwarded-proto')||'https'}://${request.headers.get('x-forwarded-host')||request.headers.get('host')}`)return new Response(null,{status:403});
 if(request.headers.get('dnt')==='1'||request.headers.get('sec-gpc')==='1')return new Response(null,{status:204});
 try{const text=await request.text();if(text.length>1500)return new Response(null,{status:413});const event=validateAnalyticsEvent(JSON.parse(text));if(!event)return new Response(null,{status:400});await analyticsStore.record(event);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});}catch{return new Response(null,{status:503});}
}
