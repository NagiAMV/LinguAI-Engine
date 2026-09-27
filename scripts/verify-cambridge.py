"""Check source fidelity, answer widgets and safe HTML across imported CD tests."""
import importlib.util
import json
from pathlib import Path
from bs4 import BeautifulSoup
root = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('cambridge_import',root/'scripts/import-cambridge.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
malicious='<script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)"><iframe src="https://evil.example"></iframe><input name="ielts_reading_answer_1" type="text" onclick="alert(1)"><p>Keep me</p>'
clean=module.clean_html(malicious,'https://engnovate.com/')
assert all(x not in clean for x in ('script','onerror','onclick','iframe'))
assert 'Keep me' in clean and '<input' in clean
report={'tests':0,'parts':0,'audioParts':0,'images':0,'answerFields':0}
for path in (root/'public/cambridge').glob('*.json'):
    test=json.loads(path.read_text(encoding='utf-8'))
    raw_path=root/'.cache/cambridge-import'/path.name
    raw=json.loads(raw_path.read_text(encoding='utf-8')) if raw_path.exists() else None
    assert len(test['parts'])==(3 if test['resource']=='reading' else 4),path
    for i,part in enumerate(test['parts']):
        soup=BeautifulSoup(part['passage']+part['questions'],'html.parser')
        original=BeautifulSoup(raw['parts'][i]['passage']+raw['parts'][i]['questions'],'html.parser') if raw else soup
        source_names={t.get('name') for t in original.select('input[name],select[name]') if str(t.get('name','')).startswith(('ielts_reading_answer_','ielts_listening_answer_'))}
        assert set(part['fieldNames'])==source_names,(path,i,'Missing answer fields')
        source_numbers={e['id'] for e in original.select('[id]') if '-question-number-' in e['id']}
        numbers={e['id'] for e in soup.select('[id]') if '-question-number-' in e['id']}
        assert numbers==source_numbers,(path,i,'Missing question numbers')
        for el in soup.find_all():
            assert el.name in module.ALLOWED,(path,el.name)
            assert set(el.attrs).issubset(module.ATTRS),(path,el.attrs)
        assert soup.select('input,select'),path
        assert not soup.select('input[type="hidden"]'),path
        report['parts']+=1
        report['answerFields']+=len(part['fieldNames'])
        report['images']+=len(soup.select('img'))
        if test['resource']=='listening':
            assert part['audioUrls'],(path,part['id'])
            report['audioParts']+=1
    report['tests']+=1
print(json.dumps(report,indent=2))
