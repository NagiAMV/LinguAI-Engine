// Browser translation rewrites DOM text before React hydrates and invalidates
// transcript offsets. Explanations use the app's own language selector.
export default function PracticeLayout({ children }) {
  return <div translate="no" className="notranslate">{children}</div>;
}
