"""Resumable local word clocks. Preserve supplied transcripts and match only actual ASR words."""
import argparse, difflib, hashlib, html, json, os, re
from pathlib import Path

def normal(text):
    return re.sub(r'[^a-z0-9]', '', html.unescape(text).lower())

def align(passage, words):
    # Skip metadata and speaker names without changing their original markup.
    refs = []
    stack = []
    for match in re.finditer(r'<[^>]*>|[^<>\s]+', passage):
        value = match.group()
        if value.startswith('<'):
            tag = re.match(r'</?([\w-]+)', value)
            if not tag:
                continue
            name = tag[1].lower()
            if value.startswith('</'):
                if name in [x[0] for x in stack]:
                    while stack:
                        if stack.pop()[0] == name:
                            break
            elif name not in ('br', 'hr', 'img', 'input'):
                stack.append((name, name in ('strong', 'b', 'small', 'time') or 'transcript-source-note' in value))
        elif not any(skip for _, skip in stack) and normal(value):
            refs.append((match.start(), match.end(), normal(value)))
    edits = []
    matcher = difflib.SequenceMatcher(None, [x[2] for x in refs], [normal(w[0]) for w in words], autojunk=False)
    for a, b, count in matcher.get_matching_blocks():
        # Single-word matches can be accidental, especially on repeated function words.
        if count < 2:
            continue
        for i in range(count):
            start, end, _ = refs[a+i]
            _, t, u = words[b+i]
            if u > t:
                edits.append((start, end, t, u))
    result = passage
    for start, end, t, u in reversed(edits):
        result = result[:start] + f'<span data-cue-start="{t:.2f}" data-cue-end="{u:.2f}">' + result[start:end] + '</span>' + result[end:]
    assert re.sub(r'<span data-cue-start="[^"]+" data-cue-end="[^"]+">([^<]*)</span>', r'\1', result) == passage
    return result, len(edits), len(refs)

def save(path, data):
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
    temp.replace(path)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cached-only', action='store_true')
    parser.add_argument('--retry', action='store_true', help='Retry missing parts without voice activity filtering')
    parser.add_argument('--device', default='cuda', choices=['cuda', 'cpu'])
    args = parser.parse_args()
    cache = Path('.cache/listening-word-clocks'); cache.mkdir(parents=True, exist_ok=True)
    handles = []
    if os.name == 'nt':
        folders = [Path(os.environ.get('LOCALAPPDATA', ''))/'Programs/Ollama/lib/ollama/cuda_v12', *Path('.cache/cuda-runtime').glob('nvidia/*/bin')]
        for folder in folders:
            if folder.exists():
                handles.append(os.add_dll_directory(str(folder.resolve())))
                os.environ['PATH'] = str(folder.resolve())+os.pathsep+os.environ.get('PATH', '')
    pipeline = None
    report = []
    for path in sorted(Path('public/practice').glob('*listening-*.json')):
        if not re.fullmatch(r'(practice|single)-listening-\d+\.json', path.name):
            continue
        paper = json.loads(path.read_text(encoding='utf8'))
        changed = False
        for part in paper['parts']:
            passage = part.get('passage', '')
            if 'data-cue-start' in passage:
                report.append({'file':path.name, 'part':part['id'], 'status':'existing'})
                continue
            urls = part.get('audioUrls', [])
            if not urls:
                report.append({'file':path.name, 'part':part['id'], 'status':'missing-audio'})
                continue
            source = Path('public') / urls[0].lstrip('/')
            digest = hashlib.sha256(source.read_bytes()).hexdigest()
            checkpoint = cache/(digest+('-unfiltered' if args.retry else '')+'.json')
            if not checkpoint.exists():
                if args.cached_only:
                    report.append({'file':path.name, 'part':part['id'], 'status':'pending'})
                    continue
                if pipeline is None:
                    from faster_whisper import WhisperModel, BatchedInferencePipeline
                    pipeline = BatchedInferencePipeline(WhisperModel('small.en', device=args.device, compute_type='int8_float16' if args.device=='cuda' else 'int8', download_root='.cache/speech-models', local_files_only=True))
                print('TRANSCRIBING', source.name, flush=True)
                import av
                import numpy as np
                chunks = []
                resampler = av.AudioResampler(format='fltp', layout='mono', rate=16000)
                with av.open(str(source)) as container:
                    for frame in container.decode(audio=0):
                        chunks.extend(f.to_ndarray().flatten() for f in resampler.resample(frame))
                    chunks.extend(f.to_ndarray().flatten() for f in resampler.resample(None))
                samples = np.concatenate(chunks)
                options = {}
                if args.retry:
                    duration = len(samples)/16000
                    options['clip_timestamps'] = [{'start':t,'end':min(t+25,duration)} for t in range(0, int(duration), 25)]
                segments, _ = pipeline.transcribe(samples, language='en', word_timestamps=True, batch_size=4, **options)
                words = [(w.word, round(w.start, 2), round(w.end, 2)) for s in segments for w in s.words or []]
                save(checkpoint, words)
            words = json.loads(checkpoint.read_text(encoding='utf8'))
            words = [w for w in words if w[1] >= part.get('transcriptStartSeconds', 0) and w[2] <= part.get('transcriptEndSeconds', float('inf'))]
            result, matched, total = align(passage, words)
            status = 'attached' if total and matched/total >= .55 else 'needs-review'
            if status == 'attached':
                part['passage'] = result
                part['transcriptWordTiming'] = {'source':'local-asr-match', 'audioSha256':digest, 'matchedWords':matched, 'totalWords':total}
                changed = True
            report.append({'file':path.name, 'part':part['id'], 'status':status, 'matched':matched, 'total':total})
            print(path.name, part['id'], status, matched, '/', total, flush=True)
        if changed:
            save(path, paper)
        save(cache/'report.json', report)

if __name__ == '__main__':
    main()
