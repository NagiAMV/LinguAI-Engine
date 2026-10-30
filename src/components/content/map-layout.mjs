// Group standalone map images with their following answer rows.
// Diagrams with fields positioned on the image keep their original layout.
export function layoutMapQuestions(html) {
  return html.replace(/(<div class="native-diagram-scroll"><div class="inline-worksheet-page native-diagram"><img[^>]+><\/div><\/div>)((?:\s*<p\b[^>]*>[\s\S]*?<\/p>)+)/g, (match, diagram, rows) => {
    if (!rows.includes('<select')) return match;
    return `<div class="listening-map-task"><div class="listening-map-image">${diagram}</div><div class="listening-map-answers">${rows}</div></div>`;
  });
}

// Imported full tests use several different map wrappers. Group existing DOM
// nodes so input names, selected answers and question navigation stay intact.
export function arrangeImportedMaps(root) {
  for (const image of root.querySelectorAll('img')) {
    if (image.closest('.listening-map-task,.native-diagram-scroll')) continue;
    let diagram = image.closest('.floorplan-wrap,.map-container,.map-wrap,.eh-diagram') || image;
    if (diagram === image && image.parentElement?.tagName === 'DIV' && image.parentElement.children.length === 1) diagram = image.parentElement;
    const rows = [];
    let next = diagram.nextElementSibling;
    while (next && (next.matches('.matching-item') || (!rows.length && next.querySelector('select,input[name]')))) {
      rows.push(next); next = next.nextElementSibling;
      if (!rows[rows.length - 1].matches('.matching-item')) break;
    }
    if (!rows.length) continue;
    const group = document.createElement('div'); group.className = 'listening-map-task';
    const left = document.createElement('div'); left.className = 'listening-map-image';
    const right = document.createElement('div'); right.className = 'listening-map-answers';
    diagram.before(group); group.append(left,right); left.append(diagram); right.append(...rows);
  }
}
