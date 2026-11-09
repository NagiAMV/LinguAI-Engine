function editableTarget(target) {
  const element = target?.nodeType === 3 ? target.parentElement : target;
  return Boolean(element?.closest?.('input, textarea') || element?.isContentEditable);
}

// Discourage ordinary clipboard export without disabling text selection used
// by annotations and translation. This is not a security boundary.
export function installContentCopyGuard(document) {
  const preventExport = event => {
    // Learners retain normal editing of their own answers, notes and essays.
    if (!editableTarget(event.target)) event.preventDefault();
  };
  const preventTextDrag = event => {
    if (!editableTarget(event.target) && document.getSelection()?.toString().trim()) event.preventDefault();
  };
  document.addEventListener('copy', preventExport, true);
  document.addEventListener('cut', preventExport, true);
  document.addEventListener('dragstart', preventTextDrag, true);
  return () => {
    document.removeEventListener('copy', preventExport, true);
    document.removeEventListener('cut', preventExport, true);
    document.removeEventListener('dragstart', preventTextDrag, true);
  };
}
