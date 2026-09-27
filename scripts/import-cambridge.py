"""Normalize browser-exported, permissioned Engnovate CD materials for LinguAI.
Run: .venv/Scripts/python.exe scripts/import-cambridge.py
Only a strict HTML subset is published; source scripts and handlers are discarded.
"""
import json
import re
from pathlib import Path
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup, Comment

ROOT = Path(__file__).resolve().parent.parent
ALLOWED = set('p div span strong em b i u s sub sup br hr h2 h3 h4 ul ol li table thead tbody tfoot tr td th caption blockquote img input label select option'.split())
ATTRS = {'class', 'id', 'for', 'name', 'type', 'value', 'placeholder', 'aria-label', 'colspan', 'rowspan', 'scope', 'start', 'alt', 'src'}

def media_url(value, base):
    url = urljoin(base, value)
    parsed = urlparse(url)
    host = parsed.hostname or ''
    if parsed.scheme == 'https' and (host == 'engnovate.com' or host.endswith('.engnovate.com') or host == 'engnovatemedia.com' or host.endswith('.engnovatemedia.com') or host == 'i0.wp.com'):
        return url
    return ''

def clean_html(html, base, option_html=""):
    options_soup = BeautifulSoup(option_html, "html.parser")
    soup = BeautifulSoup(html, 'html.parser')
    for tag in soup.select('script, style, iframe, object, embed, form, button, .ielts-reading-practice-section-button, .ielts-listening-practice-section-button'):
        tag.decompose()
    # Replace source drag/drop widgets with native accessible selects.
    for zone in soup.select('.dnd-zone'):
        field = zone.find('input')
        if not field:
            continue
        group = zone.get('data-dnd-group', '')
        panel = next((p for p in soup.select('.dnd-panel') if p.get('data-dnd-group') == group), None)
        if panel is None:
            panel = next((p for p in options_soup.select('.dnd-panel') if p.get('data-dnd-group') == group), None)
        choices = panel.select('.dnd-card') if panel else []
        if choices:
            select = soup.new_tag('select', attrs={k:field.get(k,'') for k in ('id','name')})
            empty = soup.new_tag('option', value='')
            empty.string = 'Choose an answer'
            select.append(empty)
            for choice in choices:
                option = soup.new_tag('option', value=choice.get('data-value', ''))
                option.string = choice.get('data-text') or choice.get_text(' ', strip=True)
                select.append(option)
            field.replace_with(select)
        else:
            field['type'] = 'text'
    for tag in soup.select('.dnd-panel, .dnd-drop-placeholder, .dnd-drop-value'):
        tag.decompose()
    for comment in soup.find_all(string=lambda text:isinstance(text, Comment)):
        comment.extract()
    for tag in list(soup.find_all()):
        if tag.name not in ALLOWED:
            tag.unwrap()
            continue
        attrs = {key:value for key,value in tag.attrs.items() if key in ATTRS}
        if 'src' in attrs:
            attrs['src'] = media_url(attrs['src'], base)
            if not attrs['src']:
                tag.decompose()
                continue
        if tag.name == 'input':
            if not str(attrs.get('name','')).startswith(('ielts_reading_answer_', 'ielts_listening_answer_')):
                tag.decompose()
                continue
            if attrs.get('type') not in ('text','radio','checkbox'):
                attrs['type'] = 'text'
            if attrs['type'] == 'text':
                attrs.pop('value', None)
        if tag.name in ('input','select'):
            parent = tag.find_parent(class_=re.compile('question-item'))
            number = parent.find(class_=re.compile('question-number')) if parent else None
            if number:
                attrs['aria-label'] = 'Question ' + number.get_text(strip=True)
                if attrs.get('type') in ('radio', 'checkbox'):
                    attrs['aria-label'] += ': ' + str(attrs.get('value', ''))
            elif not attrs.get('aria-label'):
                attrs['aria-label'] = 'Answer ' + str(attrs.get('name', '')).split('_')[-1]
        tag.attrs = attrs
    return str(soup).strip()

def main():
    destination = ROOT / 'public' / 'cambridge'
    destination.mkdir(parents=True, exist_ok=True)
    catalog = []
    for file in sorted((ROOT / '.cache' / 'cambridge-import').glob('*.json')):
        raw = json.loads(file.read_text(encoding='utf-8'))
        resource, book, test = raw['resource'], raw['book'], raw['test']
        if resource not in ('reading','listening') or not (1 <= book <= 99 and 1 <= test <= 4):
            raise ValueError(f'Invalid identity: {file}')
        expected = 3 if resource == 'reading' else 4
        if len(raw['parts']) != expected:
            raise ValueError(f'Incomplete test: {file}')
        parts = []
        for index, part in enumerate(raw['parts']):
            questions = clean_html(part['questions'], raw['url'], part['passage'])
            passage = clean_html(part['passage'], raw['url'], part['questions'])
            parsed = BeautifulSoup(passage + questions, 'html.parser')
            fields = list(dict.fromkeys(tag.get('name') for tag in parsed.select('input[name],select[name]')))
            labels = {tag.get('name'): tag.get('aria-label', 'Answer').split(':')[0] for tag in parsed.select('input[name],select[name]')}
            if not fields:
                raise ValueError(f'Missing answer fields: {file} part {index+1}')
            parts.append({'id':index+1, 'passage':passage, 'questions':questions, 'fieldNames':fields, 'fieldLabels':labels, 'audioUrls':[u for value in part.get('audioUrls',[]) if (u:=media_url(value,raw['url']))]})
        name = f'{resource}-{book}-{test}'
        payload = {'id':name, 'resource':resource, 'book':book, 'test':test, 'title':f'Cambridge {book} · Test {test}', 'sourceUrl':raw['url'], 'parts':parts}
        (destination / f'{name}.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        catalog.append({'title':raw['title'],'url':raw['url'],'resource':resource,'bookId':book,'testNumber':test,'contentUrl':f'/cambridge/{name}.json','partCount':len(parts)})
    (ROOT / 'src' / 'data').mkdir(exist_ok=True)
    (ROOT / 'src' / 'data' / 'cambridge-import.json').write_text(json.dumps({'items':catalog},ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Published {len(catalog)} complete tests')

if __name__ == '__main__':
    main()
