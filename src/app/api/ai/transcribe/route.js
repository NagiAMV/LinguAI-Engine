import {NextResponse} from 'next/server';
import speech from '@/lib/speech-transcription';
import review from '@/lib/ai-review-service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const limiter=globalThis.__linguaiSpeechLimiter ||= review.createLimiter();
export async function GET(){return NextResponse.json({available:speech.speechConfig().available},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request){let release;try{
 const cfg=speech.speechConfig();if(!cfg.available)throw new review.ReviewError('Audio transcription is not enabled. You can still save, play or download your recording.',503);
 release=limiter.acquire(30);
 const reader=request.body?.getReader();if(!reader)throw new review.ReviewError('Audio is required.',400);
 let total=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>speech.MAX_AUDIO_BYTES+65536){await reader.cancel();throw new review.ReviewError('Upload exceeds 20 MB.',413);}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
 let form;try{form=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('Content-Type')||''},body:Buffer.concat(chunks)}).formData();}catch{throw new review.ReviewError('Use a multipart audio upload.',400);}
 return NextResponse.json(await speech.transcribe(form.get('file'),cfg),{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:error instanceof review.ReviewError?error.message:'Transcription is temporarily unavailable.'},{status:error instanceof review.ReviewError?error.status:502});}finally{release?.();}}
