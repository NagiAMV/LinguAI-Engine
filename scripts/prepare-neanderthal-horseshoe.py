"""Adapt reviewed static HTML and source keys; never execute source scripts."""
import json,re,runpy,html
from pathlib import Path
h=runpy.run_path('scripts/import-listening-html.py');Node,Tree=h['Node'],h['Tree']
def raw(n):
 if not n.tag:return html.escape(n.text,quote=False)
 return '<'+n.tag+''.join(f' {k}="{html.escape(v or "",quote=True)}"' for k,v in n.attrs.items())+'>'+('' if n.tag in h['VOID'] else html.escape(n.text,quote=False)+''.join(raw(c) for c in n.children)+'</'+n.tag+'>')
def select(q,options):
 n=Node('select',{'data-lq':str(q)});n.add(Node('option',{'value':''},'Choose an answer'))
 for value in options:n.add(Node('option',{'value':value},value))
 return n

neanderthal={
27:("Section A contrasts caves in Western Europe with open-air shelters further east. Its main idea is the comparison between two types of home, followed by reasons why caves provide more evidence. Heading v fits the whole section.",['We now know much more about the cave sites than the open-air ones']),
28:("Section B describes why the Périgord region was a favourable home: flint, shelter from weather, sunshine and plentiful game. These advantages explain heading iii, A perfect place to live.",['an exceptionally benign habitat for humans']),
29:("Section C concerns open-air sites where caves were unavailable. Its example from Moldova describes evidence of windbreaks or a tent made with mammoth bones. Heading i focuses on evidence of outdoor dwellings.",['evidence that has been interpreted as the remains of wind-break structures, or even a large tent']),
30:("Section D examines objects found inside caves: stones, animal foot bones, ash, shells and cobbles. Archaeologists use these contents to infer tents, bedding and drainage. Heading iv covers this examination of cave contents.",['From the west European caves more evidence of built structures is available']),
31:("Section E explains why fire was essential for survival and what remains of fires reveal. Its uses include warmth, light, cooking and defence. Heading vi, A vital source of power, covers the section; heading ii is too narrow because learning to make fire is not its central subject.",['Fire gave warmth, light, heat for cooking and defence against predatory animals.']),
32:("The burnt wood is the charred piece of birch found at Krapina in Croatia. Charred means burnt. In the List of Places, Krapina is E.",['A charred piece of birch from Krapina in Croatia']),
33:("Baume-Bonne had river cobbles laid on the cave floor, apparently to deal with a puddle. This is the evidence of preventing pools of water. Baume-Bonne is place D.",['as though to take care of a puddle area in the cave']),
34:("At Lazaret, small marine mollusc shells were found around patches of ash. Marine means connected with the sea, and shells are remains of sea creatures. Lazaret is C.",['small marine mollusc shells']),
35:("The circular arrangement is the ring of mammoth bones at Moldova, described in section C. It may have supported a windbreak or tent. Moldova is place B.",['a ring, up to about 8 x 5m in size, of mainly mammoth bones']),
36:("At Lazaret, wolf and fox foot bones without the rest of the skeletons were interpreted as evidence that pelts had been used for bed coverings. Pelts are animal skins with fur, explaining the reference to warmth. Lazaret is C.",['use of animal pelts as bed coverings']),
37:("Section E says survival in the sub-arctic conditions was inconceivable without control of fire. The summary asks what the conditions were like, so copy sub-arctic. Keep the source spelling and hyphen.",['survival in the sub-arctic conditions']),
38:("The shallow heat penetration beneath the ash suggests that a fire was only of a short duration. Duration means the length of time. The summary already supplies time, leaving the adjective short.",['this fire was only of a short duration']),
39:("Fire provided defence against predatory animals. This matches protect the occupants from dangerous animals in the summary. Copy the two-word phrase predatory animals, staying within the word limit.",['defence against predatory animals']),
40:("The article surveys what archaeological evidence reveals about Neanderthal settlements: their locations, shelters, cave contents and fires. Option C captures this overall purpose. It does not mainly argue about larger homes, explain migration, or trace developmental progress.",['Caves, moreover, aid the survival of archaeological material and can preserve the records of remote millennia.'])}
crab={
14:("Section C discusses medical uses of horseshoe crab blood, including testing equipment and vaccines for bacteria and investigating a protein as an antibiotic. The other sections focus on anatomy, reproduction, development or population decline.",['Another application is a protein from horseshoe crab blood that is under investigation as an antibiotic.']),
15:("Section B identifies the tail as the telson and explains that it helps the crab flip over when upside down under water. This is the requested function of the tail.",['Horseshoe crabs use it to flip over if they happen to be pushed on their backs']),
16:("Section B describes both how the crab eats and its food: crawling allows it to open and close its mouth, and it eats mainly worms and clams. These are feeding habits.",['Their diet consists mainly of worms and clams.']),
17:("Section D describes adults meeting on beaches, the female scent signal, breeding, nest digging and egg laying. Together these details form the description of reproduction.",['Female horseshoe crabs communicate by releasing a scent to signal to the males.']),
18:("Section E follows the life cycle from hatching through the larval and juvenile periods to maturity. It describes growth, shell shedding and adult size, so it explains development to adulthood.",['After the larval stage, horseshoe crabs move into the juvenile period.']),
19:("Choose B and D in either order. Section B says they can only eat while crawling, which supports B, and can regrow lost limbs, which supports D. They mainly crawl rather than swim; upside-down swimming is not how they bury themselves, and they breathe through gills.",['They can only eat when crawling','the rare ability to regrow lost limbs']),
20:("Choose B and D in either order. Section B says they can only eat while crawling, which supports B, and can regrow lost limbs, which supports D. They mainly crawl rather than swim; upside-down swimming is not how they bury themselves, and they breathe through gills.",['They can only eat when crawling','the rare ability to regrow lost limbs']),
21:("Choose A and E in either order. Section C contrasts copper-containing hemocyanin with iron-containing hemoglobin, supporting a different mineral composition. It also places oxygen transport on the exterior of cells rather than inside red blood cells. The colour change is blue to colourless, not blue to red.",['a copper-containing protein called hemocyanin','in a fluid on the exterior of the cell']),
22:("Choose A and E in either order. Section C contrasts copper-containing hemocyanin with iron-containing hemoglobin, supporting a different mineral composition. It also places oxygen transport on the exterior of cells rather than inside red blood cells. The colour change is blue to colourless, not blue to red.",['a copper-containing protein called hemocyanin','in a fluid on the exterior of the cell']),
23:("Section F reports a widespread decline in abundance over the last twenty years, particularly in the Florida lagoon system. Abundance means population numbers. The summary requires a noun after a, so copy decline.",['A widespread decline in their abundance in the last 20 years']),
24:("Section F says losing horseshoe crabs would affect species feeding on the animal and its eggs. The summary already mentions the crabs themselves and asks for the other food source, eggs.",['species that feed on the animal and its eggs']),
25:("Section F states that loss of the crab would decrease the biodiversity of the lagoon. The summary paraphrases this as affecting the lagoon system's biodiversity. Copy the one-word noun.",['would decrease the biodiversity of the lagoon']),
26:("The final paragraph describes using horseshoe crabs as bait to catch fish. This is the suspected reason local fishermen remove them. Copy bait, not fish: fish are what the fishermen are trying to catch.",['the use of horseshoe crabs as bait to catch fish'])}

out=[]
for d in json.loads(Path('.cache/relocated-extracted.json').read_text(encoding='utf8')):
 root=Tree(Path(d['file']).read_text(encoding='utf-8-sig')).root
 left=next(n for n in root.all() if n.attrs.get('id')=='passage-text');right=next(n for n in root.all() if n.attrs.get('id')=='questions')
 is_crab='horseshoe' in d['name'];title='The horseshoe crab' if is_crab else 'Neanderthal Technology';notes=crab if is_crab else neanderthal
 answers={str(n):[a] for n,a in d['vars']['answers'].items()};groups=[]
 if is_crab:
  for name,values in d['vars']['groups'].items():
   qs=list(map(int,re.findall(r'\d+',name)));groups.append({'questions':qs,'acceptedSets':[values]})
   for q,value in zip(qs,values):answers[str(q)]=[value]
   checks=[n for n in right.all() if n.tag=='input' and n.attrs.get('name')==name]
   holder=checks[0].parent
   while holder.parent and not all(any(c is x for c in holder.all()) for x in checks):holder=holder.parent
   options=[n.attrs['value'] for n in checks]
   for n in checks:h['remove'](n)
   for q in qs:holder.add(select(q,options))
 for n in right.all():
  if n.tag in ['input','select']:
   q=n.attrs.get('data-lq') or re.sub(r'\D','',n.attrs.get('id') or n.attrs.get('name',''));assert q
   n.attrs['data-lq']=q
   if n.tag=='input' and n.attrs.get('type')=='radio':
    host=n.parent
    while host.parent and host.parent is not right and {c.attrs.get('data-lq') or re.sub(r'\D','',c.attrs.get('name','')) for c in host.parent.all() if c.tag=='input' and c.attrs.get('type')=='radio'}=={q}:host=host.parent
    host.attrs['class']=' '.join([*h['cls'](host),'q-card'])
 passage=''.join(raw(n) for n in left.children);questions=''.join(raw(n) for n in right.children)
 _,fields=h['adapt'](questions,'preview',1,{})
 assert sorted(int(s.replace('Question ','')) for s in fields.values())==sorted(map(int,answers))
 out.append({'file':d['file'],'sourceFile':d['name'],'sha256':d['sha256'],'PASSAGE_TITLE':title,'PASSAGE_HTML':passage,'questions':questions,'ANSWERS':answers,'groups':groups,'reviewLanguages':['en'],'EXPLANATIONS':{str(q):{'en':ex,'uz':''} for q,(ex,_) in notes.items()},'HIGHLIGHTS':[{'q':q,'txt':quote} for q,(_,quotes) in notes.items() for quote in quotes]})
Path('.cache/single-reading-batch.json').write_text(json.dumps(out,ensure_ascii=False),encoding='utf8')
