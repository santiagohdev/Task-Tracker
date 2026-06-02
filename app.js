const { useState, useEffect, useRef, useCallback } = React;
 
/* ── HELPERS ── */
const genId = () => Math.random().toString(36).slice(2,10);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'});
 
const PRIO_LABELS = { high:'High', med:'Medium', low:'Low', none:'' };
const PRIO_ICONS  = { high:'🔴', med:'🟡', low:'🔵', none:'⚪' };
 
/* ── STORAGE ── */
function loadTasks() {
  try {
    const raw = localStorage.getItem('santi-tasks');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveTasks(tasks) {
  try { localStorage.setItem('santi-tasks', JSON.stringify(tasks)); } catch {}
}
 
/* ── MAIN APP ── */
function App() {
  const [tasks, setTasks]     = useState(loadTasks);
  const [input, setInput]     = useState('');
  const [priority, setPrio]   = useState('none');
  const [filter, setFilter]   = useState('all');
  const [editing, setEditing] = useState(null); // task id being edited
  const [editVal, setEditVal] = useState('');
  const [dragId, setDragId]   = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const inputRef = useRef(null);
 
  // persist on change
  useEffect(() => saveTasks(tasks), [tasks]);
 
  /* ── CRUD ── */
  const addTask = () => {
    const text = input.trim();
    if(!text) { inputRef.current?.focus(); return; }
    setTasks(prev => [{
      id: genId(),
      text,
      done: false,
      priority,
      createdAt: Date.now(),
    }, ...prev]);
    setInput('');
    setPrio('none');
    inputRef.current?.focus();
  };
 
  const toggleDone = (id) =>
    setTasks(prev => prev.map(t => t.id===id ? {...t, done:!t.done} : t));
 
  const deleteTask = (id) =>
    setTasks(prev => prev.filter(t => t.id!==id));
 
  const clearDone = () =>
    setTasks(prev => prev.filter(t => !t.done));
 
  const startEdit = (task) => {
    setEditing(task.id);
    setEditVal(task.text);
  };
 
  const commitEdit = (id) => {
    const text = editVal.trim();
    if(text) setTasks(prev => prev.map(t => t.id===id ? {...t, text} : t));
    setEditing(null);
  };
 
  /* ── DRAG & DROP ── */
  const onDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e, idx) => {
    e.preventDefault();
    setOverIdx(idx);
  };
  const onDrop = (e, idx) => {
    e.preventDefault();
    if(dragId===null) return;
    setTasks(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(t=>t.id===dragId);
      if(fromIdx===-1) return prev;
      const [item] = arr.splice(fromIdx,1);
      arr.splice(idx,0,item);
      return arr;
    });
    setDragId(null);
    setOverIdx(null);
  };
  const onDragEnd = () => { setDragId(null); setOverIdx(null); };
 
  /* ── FILTERED LIST ── */
  const filtered = tasks.filter(t => {
    if(filter==='active') return !t.done;
    if(filter==='done')   return t.done;
    return true;
  });
 
  const total = tasks.length;
  const doneCount = tasks.filter(t=>t.done).length;
  const pct = total ? Math.round(doneCount/total*100) : 0;
 
  /* ── KEYBOARD ── */
  const onKeyDown = (e) => {
    if(e.key==='Enter') addTask();
  };
 
  return (
    <div className="app">
      {/* HEADER */}
      <div className="header">
        <div className="header-left">
          <h1 className="app-title">My<span>Tasks</span></h1>
          <p className="app-subtitle">{total} task{total!==1?'s':''} · {doneCount} completed</p>
        </div>
        <div className="stats">
          <span className="stat-pill">{total - doneCount} left</span>
          <span className={`stat-pill${doneCount>0?' done':''}`}>{doneCount} done</span>
        </div>
      </div>
 
      {/* PROGRESS */}
      {total > 0 && (
        <div className="progress-wrap">
          <div className="progress-row">
            <span className="progress-label">Progress</span>
            <span className="progress-pct">{pct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{width:`${pct}%`}} />
          </div>
        </div>
      )}
 
      {/* ADD FORM */}
      <div className="add-form">
        <div className="add-input-wrap">
          <input
            ref={inputRef}
            className="add-input"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Add a new task…"
            maxLength={120}
          />
        </div>
        <div className="priority-wrap">
          {['none','low','med','high'].map(p=>(
            <button
              key={p}
              className={`prio-btn${priority===p?' selected':''}`}
              onClick={()=>setPrio(p)}
              title={PRIO_LABELS[p]||'No priority'}
            >{PRIO_ICONS[p]}</button>
          ))}
        </div>
        <button className="add-btn" onClick={addTask}>Add</button>
      </div>
 
      {/* FILTERS */}
      <div className="filters">
        {['all','active','done'].map(f=>(
          <button
            key={f}
            className={`filter-btn${filter===f?' active':''}`}
            onClick={()=>setFilter(f)}
          >{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>
 
      {/* LIST HEADER */}
      <div className="list-header">
        <span className="list-count">
          {filtered.length} task{filtered.length!==1?'s':''}
        </span>
        {doneCount > 0 && filter !== 'active' && (
          <button className="clear-btn" onClick={clearDone}>
            clear completed
          </button>
        )}
      </div>
 
      {/* TASK LIST */}
      <div className="task-list">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              {filter==='done' ? '✓' : filter==='active' ? '○' : '◎'}
            </div>
            <p className="empty-text">
              {filter==='done' ? 'nothing completed yet' : filter==='active' ? 'all done!' : 'no tasks yet'}
            </p>
          </div>
        ) : filtered.map((task, idx) => (
          <div
            key={task.id}
            className={[
              'task-card',
              `prio-${task.priority}`,
              task.done ? 'done-card' : '',
              dragId===task.id ? 'dragging' : '',
              overIdx===idx && dragId!==task.id ? 'drag-over' : '',
            ].filter(Boolean).join(' ')}
            draggable
            onDragStart={e=>onDragStart(e,task.id)}
            onDragOver={e=>onDragOver(e,idx)}
            onDrop={e=>onDrop(e,idx)}
            onDragEnd={onDragEnd}
          >
            {/* drag handle */}
            <span className="drag-handle">⠿</span>
 
            {/* checkbox */}
            <div className="check-wrap" onClick={()=>toggleDone(task.id)}>
              <div className={`check${task.done?' checked':''}`}>
                <svg className="check-tick" viewBox="0 0 12 9" fill="none">
                  <path d="M1 4.5L4.5 8L11 1" stroke="#0E0E0F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
 
            {/* body */}
            <div className="task-body">
              {editing===task.id ? (
                <input
                  className="task-text-input"
                  value={editVal}
                  onChange={e=>setEditVal(e.target.value)}
                  onBlur={()=>commitEdit(task.id)}
                  onKeyDown={e=>{
                    if(e.key==='Enter') commitEdit(task.id);
                    if(e.key==='Escape') setEditing(null);
                  }}
                  autoFocus
                />
              ) : (
                <p
                  className={`task-text${task.done?' done-text':''}`}
                  onDoubleClick={()=>!task.done&&startEdit(task)}
                  title="Double-click to edit"
                >{task.text}</p>
              )}
              <div className="task-meta">
                <span className="task-date">{fmtDate(task.createdAt)}</span>
                {task.priority !== 'none' && (
                  <span className={`task-tag tag-${task.priority}`}>
                    {PRIO_LABELS[task.priority]}
                  </span>
                )}
              </div>
            </div>
 
            {/* actions */}
            <div className="task-actions">
              {!task.done && (
                <button
                  className="action-btn"
                  onClick={()=>startEdit(task)}
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              )}
              <button
                className="action-btn del"
                onClick={()=>deleteTask(task.id)}
                title="Delete"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
