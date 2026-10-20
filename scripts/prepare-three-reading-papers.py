"""Normalize this reviewed three-paper batch without running source page code."""
import json,re,runpy
from pathlib import Path
h=runpy.run_path('scripts/import-listening-html.py');Node,Tree=h['Node'],h['Tree']
def raw(n):
 import html
 if not n.tag:return html.escape(n.text,quote=False)
 return '<'+n.tag+''.join(f' {k}="{html.escape(v or "",quote=True)}"' for k,v in n.attrs.items())+'>'+('' if n.tag in h['VOID'] else html.escape(n.text,quote=False)+''.join(raw(c) for c in n.children)+'</'+n.tag+'>')
explanations=[
('clay',"In the paragraph about Egypt in 2000 BC, the dolls have wooden bodies and hair made of clay. The gap asks for the hair material, so choose clay, not wood.","'hair' made of clay"),
('goddesses',"The paragraph about ancient Greece and Rome says that older girls offered their wooden dolls to goddesses when they had outgrown playing with them. The gap asks who received the dolls.",'offered their wooden dolls to goddesses'),
('limbs',"To make dolls lifelike, makers introduced movable limbs and removable garments by 600 BC. The question paraphrases movable as being put in different positions; garments means clothes.",'movable limbs and removable garments'),
('wax',"The paragraph on the 17th and 18th centuries says wax dolls grew in popularity. More common paraphrases grew in popularity, and the gap needs the material wax.",'wax dolls grew in popularity in the 17th and 18th centuries'),
('plaster',"The modeller first shaped a head in wax or clay, then covered it with plaster to create a mould. The gap asks about the mould, not the material later poured into it.",'cover it with plaster to create a mould'),
('composition',"The paragraph beginning with Composition defines it as a collective term for mixtures of pulped wood or paper. It also mentions pressure moulding and secret recipes. These details match the notes; copy the one-word term composition.","'Composition' is a collective term for mixtures of pulped wood or paper"),
('FALSE',"The porcelain paragraph says bisque looked more like skin than china did. More like skin means more realistic. The statement says bisque is less realistic, reversing the comparison, so it is FALSE.",'looked more like skin than china did'),
('TRUE',"The paragraph about French and German dolls says German bisque dolls became popular because they were not as expensive. This means French dolls generally cost more, which agrees with the statement.",'German bisque dolls became quite popular because they were not as expensive'),
('FALSE',"Rag dolls had been made by mothers for many centuries. The 1850s date refers only to the first commercially produced rag dolls, not the first rag dolls of any kind. The statement confuses commercial production with their original creation.",'For many centuries, rag dolls were made by mothers for their children.'),
('TRUE',"The text distinguishes rag dolls made of any fabric from the narrower category cloth dolls, made of linen or cotton. The statement uses the specific category cloth dolls and therefore agrees with this definition.","'Cloth doll' refers to a subset of rag dolls made of linen or cotton."),
('TRUE',"The celluloid paragraph describes its propensity to fade in bright light. Propensity means tendency, and fade means lose colour. This directly agrees with the statement.",'propensity to fade in bright light'),
('FALSE',"The final paragraph describes hard plastic dolls made in the 1940s: they resembled composition dolls but were much more durable. Durable means long-lasting. The statement reverses which type lasted longer.",'They resembled composition dolls, but they were much more durable.'),
('NOT GIVEN',"The final paragraph mentions collectible dolls and the materials modern makers use. It does not state whether collectors prefer original clothing. There is no comparison of collectors' clothing preferences, so neither TRUE nor FALSE can be established.",'many modern doll makers are still using the traditional materials of the past to make collectible dolls.')]
out=[]
for d in json.loads(Path('.cache/twelve-extracted.json').read_text(encoding='utf8')):
 v=d['vars']
 if v.get('PASSAGE_HTML'):
  out.append({'file':d['file'],'sourceFile':d['name'],'sha256':d['sha256'],'PASSAGE_TITLE':v['PASSAGE_TITLE'],'PASSAGE_HTML':v['PASSAGE_HTML'],'questions':v['QUESTIONS_HTML'],'ANSWERS':v['ANSWERS'],'EXPLANATIONS':v['EXPLANATIONS'],'HIGHLIGHTS':v.get('HIGHLIGHTS',[]),'groups':[],'reviewLanguages':['en','uz']})
 else:
  root=Tree(Path(d['file']).read_text(encoding='utf-8-sig')).root
  left=next(n for n in root.all() if n.attrs.get('id')=='passagePane');right=next(n for n in root.all() if n.attrs.get('id')=='qPane')
  for n in right.all():
   if n.tag in ['input','select']:
    m=re.search(r"pick(?:Text|Select)\('q(\d+)'",n.attrs.get('oninput','')+n.attrs.get('onchange',''));assert m
    n.attrs['data-lq']=m[1]
  passage=''.join(raw(n) for n in left.children)
  answers={str(i):[v['CORRECT']['q'+str(i)]] for i in range(1,14)}
  assert all(answers[str(i)][0]==a for i,(a,_,_) in enumerate(explanations,1))
  out.append({'file':d['file'],'sourceFile':d['name'],'sha256':d['sha256'],'PASSAGE_TITLE':'Dolls through the ages','PASSAGE_HTML':passage,'questions':''.join(raw(n) for n in right.children),'ANSWERS':answers,'EXPLANATIONS':{str(i):{'en':a+'. '+ex,'uz':''} for i,(a,ex,_) in enumerate(explanations,1)},'HIGHLIGHTS':[{'q':i,'txt':quote} for i,(_,_,quote) in enumerate(explanations,1)],'groups':[],'reviewLanguages':['en']})
Path('.cache/single-reading-batch.json').write_text(json.dumps(out,ensure_ascii=False),encoding='utf8')
