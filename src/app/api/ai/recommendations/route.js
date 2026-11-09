import {NextResponse} from 'next/server';
import coach from '@/lib/study-coach';
import review from '@/lib/ai-review-service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const limiter=globalThis.__linguaiCoachLimiter ||= review.createLimiter();
export async function GET(){return NextResponse.json({available:coach.config().available},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request){
 let release;
 try{
  const cfg=coach.config();if(!cfg.available)return NextResponse.json({error:'AI coaching is not connected yet. Your result-based suggestions are available below.'},{status:503});
  const reader=request.body?.getReader();if(!reader)throw new review.ReviewError('A study summary is required.',400);
  let size=0;const chunks=[];try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new review.ReviewError('Study summary is too large.',413);}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
  let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new review.ReviewError('Invalid JSON summary.',400);}
  const input=coach.validateInput(body);release=limiter.acquire(cfg.daily);
  return NextResponse.json({plan:await coach.recommend(input,cfg),generatedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:error instanceof review.ReviewError?error.message:'AI coaching is temporarily unavailable.'},{status:error instanceof review.ReviewError?error.status:502});}finally{release?.();}
}
