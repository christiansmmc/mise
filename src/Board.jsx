// mise · board view (kanban-style category).
// `done` stays the source of truth: a card sits in the last column iff it's done,
// so list view, board view and the CLI never disagree.

import { useState, useEffect, useRef } from 'react'
import { I18N, useI18n, formatCreated } from './i18n.js'
import { autoGrow } from './utils.js'

const PRIO_RANK = { alta: 0, media: 1, baixa: 2 };
const byPrioThenNew = (a, b) =>
  ((PRIO_RANK[a.prio] ?? 3) - (PRIO_RANK[b.prio] ?? 3)) ||
  (b.created || '').localeCompare(a.created || '');

export function defaultColumns(lang) {
  const d = I18N[lang] || I18N.pt;
  return [
    { id: 'todo', label: d.col_todo },
    { id: 'doing', label: d.col_doing },
    { id: 'done', label: d.col_done },
  ];
}

// a stored status that disagrees with `done` (toggled in list view or via the
// CLI) is ignored and the card falls back to the first / last column
export function statusOf(task, cols) {
  const last = cols[cols.length - 1].id;
  const known = cols.some(c => c.id === task.status);
  if (known && (task.status === last) === !!task.done) return task.status;
  return task.done ? last : cols[0].id;
}

function useWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return w;
}

const COL_MIN = 168;

export default function Board({ cat, tasks, addTask, setStatus, updTask, deleteTask, updCategory, askConfirm }) {
  const { t, lang } = useI18n();
  const cols = cat.columns;
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const narrow = width > 0 && width < cols.length * COL_MIN + (cols.length - 1) * 10;
  const [focusCol, setFocusCol] = useState(cols[0].id);
  const [adding, setAdding] = useState(null); // column id getting a new card
  const [addingCol, setAddingCol] = useState(false);
  const [renaming, setRenaming] = useState(null); // column id
  const [openId, setOpenId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  useEffect(() => { if (!cols.find(c => c.id === focusCol)) setFocusCol(cols[0].id); }, [cols]);

  const inCol = (cid) => tasks.filter(tk => statusOf(tk, cols) === cid).sort(byPrioThenNew);
  const lastId = cols[cols.length - 1].id;
  const open = tasks.find(tk => tk.id === openId);

  const dropProps = (cid) => ({
    onDragOver: (e) => { if (dragId) { e.preventDefault(); setOverCol(cid); } },
    onDragLeave: () => setOverCol(o => o === cid ? null : o),
    onDrop: (e) => { e.preventDefault(); if (dragId) setStatus(dragId, cid); setDragId(null); setOverCol(null); },
  });

  const renameCol = (cid, label) => updCategory(cat.id, c => {
    const col = c.columns.find(x => x.id === cid);
    if (col && label) col.label = label;
  });
  // new columns go before the last one, which always means "done"
  const addCol = (label) => updCategory(cat.id, c => {
    c.columns.splice(c.columns.length - 1, 0, { id: 'c_' + Date.now().toString(36), label });
  });
  const delCol = (cid) => updCategory(cat.id, c => { c.columns = c.columns.filter(x => x.id !== cid); });

  const column = (col, single) => {
    const list = inCol(col.id);
    const removable = list.length === 0 && cols.length > 2 && col.id !== lastId;
    return (
      <div key={col.id} className={`bd-col ${overCol === col.id ? 'over' : ''} ${col.id === lastId ? 'last' : ''}`} {...dropProps(col.id)}>
        {!single && (
          <div className="bd-colhead">
            {renaming === col.id ? (
              <InlineInput className="bd-col-in" initial={col.label} placeholder={t('column_ph')}
                onDone={(v) => { if (v && v !== col.label) renameCol(col.id, v); setRenaming(null); }} />
            ) : (
              <span className="nm" title={t('rename_col')} onDoubleClick={() => setRenaming(col.id)}>{col.label}</span>
            )}
            <span className="ct">{list.length}</span>
            {removable && <span className="x" title={t('remove_col')} onClick={() => delCol(col.id)}>×</span>}
            <span className="add" title={t('new_card')} onClick={() => setAdding(col.id)}>+</span>
          </div>
        )}
        <div className="bd-cards">
          {adding === col.id && (
            <NewCard onDone={(title) => {
              if (title) addTask(title, 'none', { status: col.id, done: col.id === lastId });
              setAdding(null);
            }} />
          )}
          {list.map(tk => (
            <div key={tk.id}
              className={`bd-card ${dragId === tk.id ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => { setDragId(tk.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', tk.id); }}
              onDragEnd={() => { setDragId(null); setOverCol(null); }}
              onClick={() => setOpenId(tk.id)}>
              <div className="top">
                <span className={`prio ${tk.prio || 'none'}`}></span>
                <span className="ttl">{tk.title}</span>
              </div>
              <div className="meta">
                <span>{formatCreated(tk.created, lang)}</span>
                {tk.notes && tk.notes.trim() && <span className="has-notes" title={t('has_desc')}>≡</span>}
              </div>
            </div>
          ))}
          {list.length === 0 && adding !== col.id && (
            <div className="bd-empty" onClick={() => setAdding(col.id)}>{dragId ? t('drop_here') : `+ ${t('add_card')}`}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bd" ref={wrapRef}>
      <div className="lb-bar">
        {narrow ? (
          <div className="seg bd-status">
            {cols.map(c => (
              <span key={c.id} className={`${focusCol === c.id ? 'on' : ''} ${overCol === c.id ? 'over' : ''}`}
                onClick={() => setFocusCol(c.id)} {...dropProps(c.id)}>
                {c.label} <i>{inCol(c.id).length}</i>
              </span>
            ))}
          </div>
        ) : (
          <span>{t('board_summary', tasks.length, cols.length)}</span>
        )}
        {!narrow && (addingCol ? (
          <InlineInput className="bd-col-in bd-addcol" placeholder={t('column_ph')}
            onDone={(v) => { if (v) addCol(v); setAddingCol(false); }} />
        ) : (
          <span className="bd-addcol" onClick={() => setAddingCol(true)}>+ {t('add_column')}</span>
        ))}
        <span className="new" onClick={() => setAdding(narrow ? focusCol : cols[0].id)}>+ {t('new_card')}</span>
      </div>

      {narrow ? (
        <div className="bd-single">{column(cols.find(c => c.id === focusCol) || cols[0], true)}</div>
      ) : (
        <div className="bd-grid" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(${COL_MIN}px, 1fr))` }}>
          {cols.map(c => column(c, false))}
        </div>
      )}
      {narrow && dragId && <div className="bd-drophint">{t('drop_hint')}</div>}

      {open && (
        <CardSheet task={open} cols={cols} status={statusOf(open, cols)}
          close={() => setOpenId(null)} setStatus={setStatus} updTask={updTask}
          del={() => askConfirm({
            message: t('confirm_del_task', open.title),
            confirmLabel: t('delete'),
            danger: true,
            onConfirm: () => { deleteTask(open.id); setOpenId(null); },
          })} />
      )}
    </div>
  );
}

// commits once: Enter or blur with the trimmed value, Escape with ''
function InlineInput({ initial = '', placeholder, className, onDone }) {
  const [v, setV] = useState(initial);
  const done = useRef(false);
  const finish = (val) => { if (done.current) return; done.current = true; onDone(val.trim()); };
  return (
    <input className={className} autoFocus value={v} placeholder={placeholder}
      onChange={e => setV(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') finish(v);
        else if (e.key === 'Escape') finish('');
      }}
      onBlur={() => finish(v)} />
  );
}

function NewCard({ onDone }) {
  const { t } = useI18n();
  const [v, setV] = useState('');
  const done = useRef(false);
  const finish = (val) => { if (done.current) return; done.current = true; onDone(val.trim()); };
  return (
    <div className="bd-card new">
      <textarea autoFocus rows={2} value={v} placeholder={t('task_ph')}
        onChange={e => setV(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(v); }
          else if (e.key === 'Escape') finish('');
        }}
        onBlur={() => finish(v)} />
      <span className="hint">{t('hint_save')}</span>
    </div>
  );
}

function CardSheet({ task, cols, status, close, setStatus, updTask, del }) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      // the confirm dialog on top handles its own Escape
      if (document.querySelector('.confirm-bd')) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="modal-bd" onClick={(e) => { if (e.target.classList.contains('modal-bd')) close(); }}>
      <div className="sheet">
        <div className="sh-head">
          <textarea
            className="ttl-in"
            rows={1}
            ref={autoGrow}
            defaultValue={task.title}
            onInput={(e) => autoGrow(e.target)}
            onBlur={(e) => {
              const v = e.target.value.replace(/\s+/g, ' ').trim();
              if (v && v !== task.title) updTask(task.id, { title: v });
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur(); } }}
          />
          <button className="close" onClick={close}>×</button>
        </div>
        <div className="sh-body">
          <div className="sh-row">
            <span className="lbl">{t('status')}</span>
            <div className="seg">
              {cols.map(c => (
                <button key={c.id} className={status === c.id ? 'on' : ''} onClick={() => setStatus(task.id, c.id)}>{c.label}</button>
              ))}
            </div>
          </div>
          <div className="sh-row">
            <span className="lbl">{t('priority')}</span>
            <div className="seg">
              {['alta', 'media', 'baixa'].map((p) => (
                <button key={p} className={task.prio === p ? 'on' : ''} onClick={() => updTask(task.id, { prio: p })}>
                  <span className={`prio ${p}`}></span>{t('prio_' + p)}
                </button>
              ))}
              <button className={!(task.prio in PRIO_RANK) ? 'on' : ''} onClick={() => updTask(task.id, { prio: 'none' })}>{t('prio_none_btn')}</button>
            </div>
          </div>
          <textarea className="notes" defaultValue={task.notes} placeholder={t('notes_ph')}
            onBlur={(e) => updTask(task.id, { notes: e.target.value })} />
          <div className="sh-foot">
            <span className="danger" onClick={del}>{t('delete_card')}</span>
            <span onClick={close}>{t('sheet_done')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
