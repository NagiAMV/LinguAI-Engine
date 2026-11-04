// Preserve the table's column widths inside a narrow review pane.
export function prepareReviewTables(root) {
 for(const table of root.querySelectorAll('table')) {
  if(table.parentElement.classList.contains('review-table-scroll'))continue;
  const wrapper=document.createElement('div');wrapper.className='review-table-scroll';wrapper.tabIndex=0;
  wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','Answer review table — scroll horizontally to see all columns');
  table.before(wrapper);wrapper.append(table);
 }
}
