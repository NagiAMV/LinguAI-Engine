'use client';
import Link from 'next/link';
import { useAccount } from './AccountProvider';
import { practiceIdeas } from '@/lib/practice-ideas.mjs';
import reading from '@/data/single-passage-reading-catalog.json';
import listening from '@/data/single-section-listening-catalog.json';

export default function PracticeIdeas() {
  const { attempts, ready } = useAccount();
  const ideas = practiceIdeas(attempts, { reading, listening });
  return <div className="focus-panel personalised-practice" aria-labelledby="practice-ideas-title">
    <div className="card-heading-row"><div><p className="section-kicker">Your next step</p><h2 id="practice-ideas-title">Practice ideas</h2></div><Link className="text-action" href="/?view=profile">Your history →</Link></div>
    <p className="practice-ideas-caption">Based on your latest results, with up to five recent papers per part.</p>
    {!ready ? <p role="status">Loading your suggestions…</p> : <div className="focus-list">{ideas.map(idea => <article className="focus-item practice-idea" key={`${idea.kind}:${idea.resource}:${idea.part || 'all'}`}>
      <div><b>{idea.title}</b><span>{idea.detail}</span><p>{idea.hint}</p></div>
      <div className="practice-idea-actions"><Link href={idea.href} className="practice-idea-open">{idea.action} →</Link>{idea.reviewHref && <Link href={idea.reviewHref}>Review latest attempt ↗</Link>}</div>
    </article>)}</div>}
  </div>;
}
