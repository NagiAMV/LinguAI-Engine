const opinionTitles = {
  Education: 'Practical skills or academic study?', Technology: 'Does AI do more good than harm?',
  Environment: 'Should cities limit private cars?', Health: 'Prevention or treatment?',
  Work: 'Is it time for a four-day week?', Cities: 'Should public transport be free?',
  Culture: 'Who should fund local culture?', Media: 'Who is responsible for misinformation?',
  Science: 'Is space exploration worth the cost?', Family: 'Should parents limit screen time?',
  Economy: 'Is growth the best measure of success?', Sport: 'Should school sport be optional?',
};
function cardTitle(task) {
  if (task.task === 1) return `${task.topic}: patterns across age groups`;
  if (task.type === 'Opinion') return opinionTitles[task.topic] || task.title;
  const title = task.title[0].toUpperCase() + task.title.slice(1);
  if (task.type === 'Discussion') return `${title}: two perspectives`;
  if (task.type === 'Advantages / disadvantages') return `The trade-offs of ${task.title}`;
  if (task.type === 'Problem / solution') return `${title}: finding solutions`;
  return `${title} and the next generation`;
}

export default function WritingLibrary({ tasks, filter, search, onFilter, onSearch, onSelect }) {
  const visible = tasks.filter(task => (filter === 'all' || String(task.task) === filter)
    && `${task.topic} ${task.type} ${task.title} ${cardTitle(task)}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="writing-library" aria-label="Writing topic library">
    <div className="writing-controls">
      <label>Practice type<select value={filter} onChange={event => onFilter(event.target.value)}><option value="all">All writing tasks</option><option value="1">Task 1 · Tables</option><option value="2">Task 2 · Essays</option></select></label>
      <label className="writing-search">Find a topic<input type="search" placeholder="Try education, technology, opinion…" value={search} onChange={event => onSearch(event.target.value)}/></label>
    </div>
    <div className="writing-library-heading"><div><p className="section-kicker">A little practice. A stronger voice.</p><h2>What will you write today?</h2></div><span role="status">{visible.length} {visible.length === 1 ? 'prompt' : 'prompts'}</span></div>
    <div className="writing-practice-guide" aria-label="Writing task guide"><span><b>Task 1</b> 150+ words <i aria-hidden="true">·</i> 20 min</span><span><b>Task 2</b> 250+ words <i aria-hidden="true">·</i> 40 min <small>Counts twice as much</small></span></div>
    <div className="writing-catalog">{visible.map(task => <button type="button" className="writing-topic-card" data-task={task.task} key={task.id} onClick={() => onSelect(task)}>
      <div className="writing-card-meta"><span className="writing-task-badge">TASK {task.task}</span><span className="writing-topic-label">{task.topic}</span></div>
      <span className="writing-type-label">{task.type}</span>
      <h3>{cardTitle(task)}</h3>
      <p className="writing-prompt-preview">{task.prompt}</p>
      <div className="writing-card-footer"><span>{task.task === 1 ? '150+ words · 20 min' : '250+ words · 40 min'}</span><span className="writing-card-arrow" aria-hidden="true">↗</span></div>
    </button>)}</div>
    {!visible.length && <div className="writing-library-empty"><h3>No matching topics yet.</h3><p>Try another keyword or explore the full library.</p><button type="button" onClick={() => { onFilter('all'); onSearch(''); }}>Show all prompts →</button></div>}
  </section>;
}
