export function transcriptTime(text) {
 const match = String(text || '').trim().match(/^\[?(?:(\d+):)?(\d{1,2}):(\d{2})\]?$/);
 if (!match || Number(match[3]) > 59 || (match[1] && Number(match[2]) > 59)) return null;
 return Number(match[1] || 0)*3600+Number(match[2])*60+Number(match[3]);
}
export function currentTranscriptIndex(entries, time, end = Infinity) {
 if (!Number.isFinite(time) || time >= end) return -1;
 let current = -1;
 entries.forEach((entry,index) => { if (entry.start <= time && (current < 0 || entry.start >= entries[current].start)) current=index; });
 return current;
}
