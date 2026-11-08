"""Validate every catalog clock and discard matches outside known section boundaries."""
import json, re
from pathlib import Path

cue = re.compile(r'<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)</span>')
report = []
for path in sorted(Path('public/practice').glob('*listening-*.json')):
    if not re.fullmatch(r'(practice|single)-listening-\d+\.json', path.name):
        continue
    paper = json.loads(path.read_text(encoding='utf8'))
    changed = False
    for part in paper['parts']:
        original = part['passage']
        start, end = part.get('transcriptStartSeconds', 0), part.get('transcriptEndSeconds', float('inf'))
        passage = cue.sub(lambda m: m[0] if float(m[1]) >= start and float(m[2]) <= end else m[3], original)
        clocks = [(float(m[1]), float(m[2])) for m in cue.finditer(passage)]
        assert clocks, (path.name, part['id'], 'missing clocks')
        assert all(0 <= a < b for a,b in clocks), (path.name, part['id'], 'invalid duration')
        assert all(a[0] <= b[0] for a,b in zip(clocks, clocks[1:])), (path.name, part['id'], 'backward clock')
        assert re.sub('<[^>]*>', '', original) == re.sub('<[^>]*>', '', passage)
        if passage != original:
            part['passage'] = passage
            changed = True
        if 'transcriptStartSeconds' not in part:
            part['transcriptStartSeconds'] = clocks[0][0]
            part['transcriptEndSeconds'] = clocks[-1][1]
            changed = True
        report.append({'file':path.name,'part':part['id'],'words':len(clocks)})
    if changed:
        path.write_text(json.dumps(paper, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
Path('docs/listening-word-clock-coverage.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf8')
print(f'Validated {len(report)} sections, {sum(r["words"] for r in report)} word cues.')
