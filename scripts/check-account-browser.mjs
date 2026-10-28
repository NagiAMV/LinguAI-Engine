import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const base = process.env.ACCOUNT_BASE_URL || 'http://localhost:3014';
const mocked = process.env.ACCOUNT_MOCK_AUTH === '1';
const delay = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=9795', '--user-data-dir=' + process.cwd() + '/.cache/account-browser-' + Date.now(), '--no-first-run', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
try {
  let tabs;
  for (let n = 0; n < 60; n++) { try { tabs = await (await fetch('http://127.0.0.1:9795/json/list')).json(); break; } catch { await delay(200); } }
  ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(); const exceptions = []; let oauthUrl = '';
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); } else if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails.text); else if (m.method === 'Fetch.requestPaused') { oauthUrl = m.params.request.url; send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html' }], body: Buffer.from('<html><body>Test OAuth redirect</body></html>').toString('base64') }); } };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  const until = async expression => { for (let n = 0; n < 150; n++) { if (await ev(expression)) return; await delay(100); } throw Error('Timeout: ' + expression); };
  const visit = async path => { await send('Page.navigate', { url: base + path }); await until('document.readyState === "complete"'); };
  const click = text => ev(`(()=>{const b=[...document.querySelectorAll('button')].findLast(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing button '+${JSON.stringify(text)});b.click();})()`);
  const fill = (selector, value) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing field');const p=e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  if (mocked) await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    (()=>{
      const original=window.fetch.bind(window);window.__authCalls=[];window.__offline=false;
      const users={a:'11111111-1111-4111-8111-111111111111',b:'22222222-2222-4222-8222-222222222222'};
      const store=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}};
      const jwt=id=>btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:id,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600}))+'.signature';
      const user=email=>{const id=users[email.startsWith('bob')?'b':'a'];return {id,email,aud:'authenticated',role:'authenticated',email_confirmed_at:'2026-10-28T06:00:00Z',created_at:'2026-10-28T06:00:00Z',app_metadata:{provider:'email',providers:['email']},user_metadata:store('__profile:'+id,{display_name:email.startsWith('bob')?'Bob':'Alice',target_band:7,learning_language:'en',avatar_color:'sage'}),identities:[{id,provider:'email'}]}};
      const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
      window.fetch=async(input,init={})=>{
        const url=new URL(typeof input==='string'?input:input.url);if(url.port!=='54321')return original(input,init);
        const method=init.method||'GET';const body=init.body?JSON.parse(init.body):{};window.__authCalls.push({path:url.pathname,method,body});
        if(url.pathname.endsWith('/token')){const u=user(body.email||'alice@example.com');localStorage.setItem('__activeMockEmail',u.email);return response({access_token:jwt(u.id),refresh_token:'mock-refresh',token_type:'bearer',expires_in:3600,user:u});}
        if(url.pathname.endsWith('/user')){let u=user(localStorage.getItem('__activeMockEmail')||'alice@example.com');if(method==='PUT'){if(body.data){u.user_metadata={...u.user_metadata,...body.data};localStorage.setItem('__profile:'+u.id,JSON.stringify(u.user_metadata));}return response(u);}return response(u);}
        if(url.pathname.endsWith('/signup'))return response({user:user(body.email),session:null});
        if(url.pathname.endsWith('/otp')||url.pathname.endsWith('/recover'))return response({});
        if(url.pathname.endsWith('/logout'))return new Response(null,{status:204});
        if(url.pathname.includes('/rest/v1/practice_attempts')){
          if(window.__offline)throw Error('Network unavailable');let rows=store('__mockRows',[]);
          if(method==='POST'){for(const a of body){rows=rows.filter(r=>!(r.id===a.id&&r.user_id===a.user_id));rows.push(a)}localStorage.setItem('__mockRows',JSON.stringify(rows));return new Response(null,{status:201});}
          const owner=(url.searchParams.get('user_id')||'').replace(/^eq\\./,'');return response(rows.filter(a=>a.user_id===owner));
        }
        return response({});
      };
    })();` });
  await visit('/?view=profile');
  await until("!!document.querySelector('.account-auth-form')");
  assert.equal(await ev("document.querySelector('.profile-card strong').textContent"), 'Guest learner');
  if (mocked) {
    await send('Fetch.enable', { patterns: [{ urlPattern: 'http://127.0.0.1:54321/auth/v1/authorize*' }] });
    await ev("document.querySelector('.account-social').click()"); await until("document.body.textContent.includes('Test OAuth redirect')");
    const url = new URL(oauthUrl); assert.equal(url.searchParams.get('provider'), 'google'); assert.ok(url.searchParams.get('code_challenge')); assert.equal(url.searchParams.get('redirect_to'), base + '/auth/callback');
    await send('Fetch.disable'); await visit('/?view=profile'); await until("!!document.querySelector('.account-auth-form')");
  }
  await click('Create account'); await until("!!document.querySelector('input[name=name]')");
  await fill('input[name=name]', 'Alice'); await fill('input[name=email]', 'alice@example.com'); await fill('input[name=password]', 'LongEnoughPassword9!');
  if (mocked) {
    await click('Create account →'); await until("!!document.querySelector('.account-success')");
    assert.ok(await ev("window.__authCalls.some(c=>c.path.endsWith('/signup')&&c.body.data.display_name==='Alice')"));
    await click('Sign in without a password'); await click('Email me a sign-in link'); await until("window.__authCalls.some(c=>c.path.endsWith('/otp'))");
    await click('Forgot password?'); await click('Send reset link'); await until("window.__authCalls.some(c=>c.path.endsWith('/recover'))");
    assert.ok(await ev("window.__authCalls.find(c=>c.path.endsWith('/recover')).body.code_challenge"));
    await click('Sign in'); await until("!!document.querySelector('input[name=password]')"); await fill('input[name=password]', 'LongEnoughPassword9!'); await click('Sign in →');
    await delay(700); await until("document.querySelector('.account-identity h2')?.textContent==='Alice'");
    await fill('.account-profile-grid input[autocomplete=name]', 'Alice Karim');
    await fill('.account-profile-grid select', '8');
    await fill('.account-profile-grid input[type=date]', '2026-12-10');
    await click('Save profile'); await until("document.querySelector('.account-identity h2')?.textContent==='Alice Karim'");
    await send('Page.reload'); await until("document.querySelector('.profile-card strong')?.textContent==='Alice Karim'");
    assert.ok(await ev("document.querySelector('.profile-card span').textContent.includes('8.0')"));
    const takeTest=async()=>{await visit('/practice/listening/single/1');await until("!!document.querySelector('.exam-start button')");await ev("document.querySelector('.exam-start button').click()");await until("!document.querySelector('.exam-start')");await ev("document.querySelector('input[name]').value='station';document.querySelector('input[name]').dispatchEvent(new Event('input',{bubbles:true}))");await ev("window.__offline=true;document.querySelector('.exam-submit').click()");await until("document.querySelector('dialog')?.open");await click('Submit and review');await until("!!document.querySelector('.exam-results')");};
    await takeTest();
    await until("JSON.parse(localStorage.getItem('linguai-attempts-v1:11111111-1111-4111-8111-111111111111')||'[]').length===1");
    assert.equal(await ev("localStorage.getItem('linguai-cd-single-listening-1')"), null);
    await visit('/?view=profile');await until("document.querySelectorAll('.account-history tbody tr').length===1");
    await until("document.querySelector('.account-history tbody tr td:last-child').textContent==='Cloud ✓'");
    const saved=await ev("JSON.parse(localStorage.getItem('__mockRows'))");
    assert.equal(saved.length,1);assert.equal(saved[0].total,10);assert.equal(saved[0].band,null);assert.equal(saved[0].answers,undefined);
    await ev("window.__export=null;URL.createObjectURL=b=>{window.__export=b.text();return 'blob:mock-export'};HTMLAnchorElement.prototype.click=function(){};");
    await click('Export my data ↓'); const exported=JSON.parse(await ev('window.__export'));assert.equal(exported.profile.name,'Alice Karim');assert.ok(!JSON.stringify(exported).includes('access_token'));
    const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.cache/account-profile-desktop.png',Buffer.from(shot.data,'base64'));
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
    assert.ok(await ev('document.documentElement.scrollWidth<=window.innerWidth'));
    const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.cache/account-profile-mobile.png',Buffer.from(mobile.data,'base64'));
    await click('Sign out ↗');await until("!!document.querySelector('.account-auth-form')");
    await fill('input[name=email]','bob@example.com');await fill('input[name=password]','LongEnoughPassword9!');await click('Sign in →');await delay(700);await until("document.querySelector('.account-identity h2')?.textContent==='Bob'");
    assert.equal(await ev("document.querySelectorAll('.account-history tbody tr').length"),0);
    await visit('/practice/listening/single/1');await until("!!document.querySelector('.exam-start')");assert.deepEqual(await ev("JSON.parse(localStorage.getItem('linguai-cd-account:22222222-2222-4222-8222-222222222222:single-listening-1')).answers"),{});
    console.log('PASS mocked Auth: sign-up, PKCE email links/reset, login, profile persistence, offline result queue/reconnect sync, export, mobile, logout, separate account drafts/history.');
  } else {
    assert.equal(await ev("document.querySelector('.account-social').disabled"), process.env.ACCOUNT_CONNECTED !== '1');
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
    assert.ok(await ev('document.documentElement.scrollWidth<=window.innerWidth'));
    assert.ok(await ev("document.querySelectorAll('.app-nav-item').length===6"));
    const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.cache/account-guest-mobile.png',Buffer.from(shot.data,'base64'));
    console.log(process.env.ACCOUNT_CONNECTED === '1' ? 'PASS connected profile: registration controls enabled, account tabs and mobile layout.' : 'PASS unconfigured guest profile, disabled connection, account tabs and mobile layout.');
  }
  assert.deepEqual(exceptions,[]);
} finally { ws?.close(); chrome.kill(); }
