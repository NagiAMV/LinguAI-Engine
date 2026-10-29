import { scoreExam } from '../components/content/exam-score.mjs';
import { attemptRoute } from './account-model.mjs';

// Only aggregate marks leave the exam page; no responses or passage text are stored.
export function buildFocusStats(test, questions, answers, key, sourcePart) {
  return test.parts.flatMap((part, index) => {
    const members = questions.filter(q => q.partIndex === index);
    const score = scoreExam(test, members, answers, key);
    if (!score.checked) return [];
    const blank = members.filter(q => {
      if (!key?.answers?.[q.number]?.length) return false;
      const value = answers[q.name];
      return q.multiple ? !Array.isArray(value) || value.length <= q.slot : typeof value !== 'string' || !value.trim();
    }).length;
    return [{ part: sourcePart || Number(part.id), correct: score.correct, checked: score.checked, blank: Math.min(blank, score.checked - score.correct) }];
  });
}
export function validFocusStats(value, resource) {
  return Array.isArray(value) && value.length <= 4 && value.every(s => Number.isInteger(s.part) && s.part >= 1 && s.part <= (resource === 'reading' ? 3 : 4)
    && Number.isInteger(s.checked) && s.checked > 0 && s.checked <= 40 && Number.isInteger(s.correct) && s.correct >= 0 && s.correct <= s.checked
    && Number.isInteger(s.blank) && s.blank >= 0 && s.blank <= s.checked - s.correct);
}
export function practiceIdeas(attempts, catalogs) {
  // Keep only the latest retake of each paper so improvement replaces old mistakes.
  const latest = new Map();
  for (const a of [...attempts].sort((a,b) => Date.parse(b.finished_at)-Date.parse(a.finished_at))) if (!latest.has(a.test_id)) latest.set(a.test_id,a);
  const groups = new Map(); const legacy = [];
  for (const a of latest.values()) {
    if (!['reading','listening'].includes(a.resource) || !a.checked) continue;
    if (!validFocusStats(a.focus_stats, a.resource) || !a.focus_stats.length) { if(a.correct < a.checked) legacy.push(a); continue; }
    for (const s of a.focus_stats) {
      const id = `${a.resource}:${s.part}`; const group = groups.get(id) || {resource:a.resource,part:s.part,correct:0,checked:0,blank:0,count:0,latest:a};
      if (group.count >= 5) continue;
      group.correct += s.correct;group.checked += s.checked;group.blank += s.blank;group.count++;
      groups.set(id,group);
    }
  }
  const ideas = [...groups.values()].filter(g => g.correct < g.checked).sort((a,b) => a.correct/a.checked-b.correct/b.checked || b.checked-a.checked).map(g => {
    const label = `${g.resource === 'reading' ? 'Reading Passage' : 'Listening Section'} ${g.part}`;
    const wrong = g.checked-g.correct-g.blank;
    return {kind:'focus',resource:g.resource,part:g.part,title:label,detail:`${g.correct}/${g.checked} correct · ${wrong} incorrect${g.blank ? ` · ${g.blank} unanswered` : ''} in ${g.count === 1 ? 'your latest result' : `${g.count} recent results`}.`,
      hint:g.blank > wrong ? 'Start with the unanswered questions and review what stopped you.' : g.resource === 'reading' ? 'Review the evidence for your mistakes, then practise another passage at this level.' : 'Replay the transcript around your mistakes, then practise another section at this level.',
      href:`/?view=${g.resource}&format=single&part=${g.part}`,action:'Practise this part',reviewHref:attemptRoute(g.latest)};
  });
  for (const a of legacy) {
    if(ideas.some(i=>i.resource===a.resource)) continue;
    ideas.push({kind:'review',resource:a.resource,title:`Review your ${a.resource === 'reading' ? 'Reading' : 'Listening'} result`,detail:`${a.correct}/${a.checked} correct overall. This older attempt has no breakdown by part.`,hint:'Review this attempt to add its part breakdown, or finish a new practice.',href:attemptRoute(a),action:'Review attempt'});
  }
  for (const resource of ['reading','listening']) {
    if(ideas.some(i=>i.resource===resource)) continue;
    const catalog=catalogs[resource] || [];const next=catalog.find(p=>!latest.has(p.id)) || catalog[0];
    if(!next) continue;
    const part=resource==='reading'?next.passageNumber:next.sectionNumber;
    const hasResults=[...latest.values()].some(a=>a.resource===resource && a.checked>0);
    ideas.push({kind:hasResults?'next':'start',resource,part,title:`${hasResults?'Next':'Start'}: ${resource === 'reading' ? 'Reading Passage' : 'Listening Section'} ${part}`,detail:hasResults?'Try a fresh task to build on your recent results.':'Complete one practice to get suggestions based on your results.',hint:'Your suggestions update when you submit a test.',href:attemptRoute({test_id:next.id}),action:'Open practice'});
  }
  return ideas.slice(0,3);
}
