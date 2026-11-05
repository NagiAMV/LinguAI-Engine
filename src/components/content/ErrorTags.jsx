"use client";
import {ERROR_TAGS} from './error-tags.mjs';
export default function ErrorTags({number, part, tags = {}, onToggle, language = 'en', expanded = false}) {
 const key = `${part}:${number}`;
 const selected = tags[key] || [];
 const ru = language === 'ru', uz = language === 'uz';
 const title = ru ? 'Причина ошибки' : uz ? 'Xato sababi' : 'Error tags';
 const hints = ru ? ['Не расслышал','Ошибка написания','Попался на отвлекающий вариант','Не хватило времени'] : uz ? ['Noto‘g‘ri eshitdim','Imlo xatosi','Chalg‘ituvchi variant','Vaqtni boshqarish'] : ['Heard the audio incorrectly','Incorrect spelling','Chose a misleading option','Ran out of time'];
 const controls = <fieldset className="error-tag-options"><legend>{expanded ? `${ru?'Вопрос':uz?'Savol':'Question'} ${number} · ` : ''}{title}</legend>{ERROR_TAGS.map((tag,index) => <button key={tag} type="button" disabled={!onToggle} aria-pressed={selected.includes(tag)} title={hints[index]} onClick={() => onToggle?.(key,tag)}>{selected.includes(tag)?'✓ ':''}{tag}</button>)}</fieldset>;
 if (expanded) return controls;
 return <details className="error-tags"><summary>{selected.length ? selected.join(' · ') : title+' +'}</summary>{controls}</details>;
}
