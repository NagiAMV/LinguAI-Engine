const test = require('node:test');
const assert = require('node:assert/strict');
const {config,validateInput,validateFeedback,createLimiter,evaluate}=require('../src/lib/ai-review-service');
const input={mode:'writing',task:'Academic Task 2',submission:'Education helps people learn.'};
const feedback={bandScore:6.5,summary:'A practice estimate.',strengths:['Clear idea'],improvements:['Develop examples'],nextSteps:['Expand the argument'],criteria:{'Task Response':'6: develop your position','Coherence and Cohesion':'6: connect ideas','Lexical Resource':'7: vary vocabulary','Grammatical Range and Accuracy':'7: vary structures'},corrections:[{original:'Education helps people learn.',corrected:'Education enables people to learn.',explanation:'An alternative expression.'}]};
test('review requires explicit activation and configured model/key',()=>{assert.equal(config({OPENAI_API_KEY:'test',OPENAI_MODEL:'model'}).available,false);assert.equal(config({AI_REVIEW_ENABLED:'true',OPENAI_API_KEY:'test',OPENAI_MODEL:'model'}).available,true);assert.equal(config({AI_REVIEW_ENABLED:'true',AI_PROVIDER:'unknown'}).available,false);});
test('Groq uses its own server-side key and endpoint, with bounded reasoning on GPT OSS',async()=>{
 const cfg=config({AI_REVIEW_ENABLED:'true',AI_PROVIDER:'groq',GROQ_API_KEY:'test-only',GROQ_MODEL:'openai/gpt-oss-120b',OPENAI_API_KEY:'other'});
 assert.equal(cfg.available,true);assert.equal(cfg.key,'test-only');assert.equal(config({AI_REVIEW_ENABLED:'true',AI_PROVIDER:'groq',GROQ_MODEL:'model',OPENAI_API_KEY:'other'}).available,false);
 await evaluate(input,cfg,async(url,options)=>{assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer test-only');const body=JSON.parse(options.body);assert.equal(body.reasoning_effort,'low');assert.equal(body.response_format.json_schema.strict,true);assert.equal(body.response_format.json_schema.schema.additionalProperties,false);assert.ok(body.response_format.json_schema.schema.properties.criteria.required.includes('Task Response'));return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(feedback)}}]})};});
});
test('optional numeric criterion bands and revised text must be valid',()=>{
 assert.throws(()=>validateFeedback({...feedback,criterionBands:{'Task Response':11}},input));
 assert.throws(()=>validateFeedback({...feedback,revisedResponse:{}},input));
});
test('case-only quote differences are grounded in source without allowing invented quotes',()=>{
 const result=validateFeedback({...feedback,corrections:[{...feedback.corrections[0],original:'education helps people learn.'}]},input);
 assert.equal(result.corrections[0].original,input.submission);
 assert.throws(()=>validateFeedback({...feedback,corrections:[{...feedback.corrections[0],original:'Education helps everyone succeed.'}]},input));
});
test('oversized and mistyped input rejected',()=>{for(const body of [{...input,submission:'x'.repeat(12001)},{...input,task:{}},null])assert.throws(()=>validateInput(body));});
test('feedback requires four criteria, real quotes and valid band',()=>{assert.deepEqual(validateFeedback(feedback,input),feedback);for(const value of [{...feedback,bandScore:9.5},{...feedback,criteria:{}},{...feedback,corrections:[{original:'Invented',corrected:'Fixed',explanation:'Reason'}]}])assert.throws(()=>validateFeedback(value,input));});
test('limiter caps simultaneous and daily calls and releases idempotently',()=>{const l=createLimiter();const a=l.acquire(3,'day1'),b=l.acquire(3,'day1');assert.throws(()=>l.acquire(3,'day1'));a();a();const c=l.acquire(3,'day1');b();c();assert.throws(()=>l.acquire(3,'day1'));l.acquire(3,'day2')();});
test('provider call is capped and validated with no paid request',async()=>{const cfg=config({AI_REVIEW_ENABLED:'true',OPENAI_API_KEY:'test',OPENAI_MODEL:'model'});const result=await evaluate(input,cfg,async(url,options)=>{const body=JSON.parse(options.body);assert.equal(body.max_completion_tokens,2400);assert.ok(options.signal);return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(feedback)}}]})};});assert.equal(result.bandScore,6.5);});
test('truncation, quota and timeout never produce a band',async()=>{const cfg=config({});await assert.rejects(evaluate(input,cfg,async()=>({ok:true,json:async()=>({choices:[{finish_reason:'length',message:{content:JSON.stringify(feedback)}}]})})));await assert.rejects(evaluate(input,cfg,async()=>({ok:false,status:429})),e=>e.status===429);await assert.rejects(evaluate(input,cfg,async()=>{throw new DOMException('timeout','TimeoutError')}),e=>e.status===504);});
test('Task 1 prompt uses achievement and exactly four schema criteria',()=>{const {buildSmartEvaluationPrompt}=require('../src/lib/ai-evaluation');const p=buildSmartEvaluationPrompt('writing','text','Academic Task 1');assert.match(p,/"Task Achievement"/);assert.doesNotMatch(p,/"Spelling and punctuation"|"Grammar Range and Accuracy"/);});
