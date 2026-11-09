import test from 'node:test';
import assert from 'node:assert/strict';
import {installContentCopyGuard} from '../src/lib/content-copy-guard.mjs';

test('protects page text while preserving learner editing, selection and cleanup',()=>{
 const listeners=new Map();
 const document={addEventListener:(type,handler)=>listeners.set(type,handler),removeEventListener:type=>listeners.delete(type),getSelection:()=>({toString:()=> 'selected passage'})};
 const remove=installContentCopyGuard(document);
 function dispatch(type,editable=false){const event={target:{closest:()=>editable,isContentEditable:false},defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};listeners.get(type)?.(event);return event.defaultPrevented;}
 for(const type of ['copy','cut','dragstart']){
  assert.equal(dispatch(type),true,`${type} on passage`);
  assert.equal(dispatch(type,true),false,`${type} in learner input`);
 }
 assert.equal(dispatch('paste'),false);
 assert.equal(dispatch('selectstart'),false);
 assert.equal(dispatch('click'),false);
 remove();assert.equal(listeners.size,0);
});
