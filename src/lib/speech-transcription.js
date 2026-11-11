const {ReviewError}=require('./ai-review-service');
const MAX_AUDIO_BYTES=20*1024*1024;
function speechConfig(env=process.env){return {available:env.AI_TRANSCRIPTION_ENABLED==='true'&&!!env.GROQ_API_KEY,key:env.GROQ_API_KEY,model:env.GROQ_TRANSCRIPTION_MODEL||'whisper-large-v3-turbo'};}
function validateAudio(file){
 if(!file||typeof file.arrayBuffer!=='function'||!file.size)throw new ReviewError('Choose a non-empty audio recording.',400);
 if(file.size>MAX_AUDIO_BYTES)throw new ReviewError('Audio must be smaller than 20 MB.',413);
 if(!/\.(webm|mp4|m4a|mp3|mpeg|mpga|ogg|wav|flac)$/i.test(file.name||'')||!/^audio\//i.test(file.type))throw new ReviewError('Use a WebM, MP4/M4A, MP3, OGG, WAV or FLAC audio file.',400);
 return file;
}
async function transcribe(file,cfg,fetcher=fetch){
 validateAudio(file);const form=new FormData();form.append('file',file,file.name);form.append('model',cfg.model);form.append('language','en');form.append('response_format','verbose_json');form.append('timestamp_granularities[]','segment');form.append('temperature','0');
 try{const response=await fetcher('https://api.groq.com/openai/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${cfg.key}`},body:form,signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw new ReviewError(response.status===429?'Speech recognition quota is temporarily unavailable. Try again later.':'Speech recognition is temporarily unavailable. Your recording is safe.',response.status===429?429:502);
 const result=await response.json();
 if(typeof result.text!=='string'||!result.text.trim())throw new ReviewError('No speech was recognised. Listen to the recording and try a clearer sample.',422);
 if(result.text.length>12000)throw new ReviewError('This recording has too much text for one review. Please use a shorter clip.',422);
 const segments=(Array.isArray(result.segments)?result.segments:[]).filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.start>=0&&s.end>=s.start&&typeof s.text==='string').slice(0,1000).map(s=>({start:s.start,end:s.end,text:s.text}));
 return {text:result.text.trim(),duration:Number.isFinite(result.duration)?result.duration:null,segments};
 }catch(error){if(error instanceof ReviewError)throw error;throw new ReviewError(['TimeoutError','AbortError'].includes(error.name)?'Transcription timed out. Your audio is safe; please retry.':'Speech recognition could not connect. Your audio is safe.',502);}
}
module.exports={MAX_AUDIO_BYTES,speechConfig,validateAudio,transcribe};
