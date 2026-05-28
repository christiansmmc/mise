// mise · tauri app · single-file React frontend.
// Falls back to localStorage when not running inside Tauri.

import { useState, useEffect, useRef, createContext, useContext } from 'react'

// ─── persistence ────────────────────────────────────────────────────────
const tauri = typeof window !== 'undefined' ? window.__TAURI__?.core : null;
const STORAGE_KEY = 'mise:db';

function defaultDb() {
  return {
    categories: [],
    tasks: [],
  };
}

async function loadDb() {
  if (tauri) {
    try { return await tauri.invoke('load_db'); }
    catch (e) { console.error('load_db failed:', e); }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultDb();
}

async function saveDb(state) {
  if (tauri) {
    try { await tauri.invoke('save_db', { state }); return; }
    catch (e) { console.error('save_db failed:', e); }
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

async function getDbPath(lang) {
  if (tauri) {
    try { return await tauri.invoke('db_path'); }
    catch { return '~/.config/mise/db.json'; }
  }
  return lang === 'en' ? 'localStorage (browser)' : 'localStorage (navegador)';
}

// ─── i18n ─────────────────────────────────────────────────────────────────
const I18N = {
  pt: {
    count_items: (n) => `${n} ${n === 1 ? 'item' : 'itens'}`,
    t_settings: 'configurações',
    t_minimize: 'minimizar',
    t_maximize: 'maximizar',
    t_close_win: 'fechar',
    new_category: 'nova categoria',
    new_category_ph: 'nova categoria…',
    empty_msg: 'nada por aqui ainda — uma página em branco.',
    empty_sub: 'comece adicionando o que estiver na sua cabeça.',
    new_task: 'nova tarefa',
    no_cats_msg: 'nenhuma categoria ainda.',
    no_cats_sub: 'crie uma categoria para começar a organizar suas tarefas.',
    sort: 'ordenar:',
    sort_prio: 'prioridade',
    sort_created: 'criação',
    group_new: 'nova',
    task_ph: 'o que precisa ser feito?',
    hint_save: '↵ salvar · esc cancelar',
    prio_alta: 'alta',
    prio_media: 'média',
    prio_baixa: 'baixa',
    grp_none: 'sem prioridade',
    prio_none_btn: 'nenhuma',
    todo_header: 'a fazer',
    done_header: 'feitas',
    close: 'fechar',
    delete: 'excluir',
    priority: 'prioridade',
    notes_ph: 'descreva contexto, links, sub-passos…',
    show_desc: 'mostrar descrição',
    hide_desc: 'ocultar descrição',
    synced: 'sincronizado',
    creed: 'uma coisa de cada vez.',
    cancel: 'cancelar',
    confirm: 'confirmar',
    confirm_del_task: (title) => `excluir "${title}"?`,
    confirm_del_cat: (label, n) => `excluir categoria "${label}" e suas ${n} ${n === 1 ? 'tarefa' : 'tarefas'}?`,
    sec_categories: 'categorias',
    sec_appearance: 'aparência',
    sec_language: 'idioma',
    sec_storage: 'armazenamento',
    sec_about: 'sobre',
    your_categories: 'suas categorias',
    tasks_count: (n) => `${n} ${n === 1 ? 'tarefa' : 'tarefas'}`,
    create: 'criar',
    theme: 'tema',
    palette: 'paleta',
    theme_hint: 'o tema fica salvo localmente. ainda não tem opção "auto" via sistema.',
    language: 'idioma',
    lang_hint: 'o idioma fica salvo localmente. o padrão segue o sistema.',
    data_file: 'arquivo de dados',
    path: 'caminho',
    storage_hint: 'tudo fica num único JSON local. nada vai pra nuvem.',
    about: 'sobre',
    about_l1: 'mise — um app simples de tarefas em Tauri 2.',
    about_l2: 'paleta linen · accent sage · estilo galley.',
  },
  en: {
    count_items: (n) => `${n} item${n === 1 ? '' : 's'}`,
    t_settings: 'settings',
    t_minimize: 'minimize',
    t_maximize: 'maximize',
    t_close_win: 'close',
    new_category: 'new category',
    new_category_ph: 'new category…',
    empty_msg: 'nothing here yet — a blank page.',
    empty_sub: 'start by adding whatever is on your mind.',
    new_task: 'new task',
    no_cats_msg: 'no categories yet.',
    no_cats_sub: 'create a category to start organizing your tasks.',
    sort: 'sort:',
    sort_prio: 'priority',
    sort_created: 'created',
    group_new: 'new',
    task_ph: 'what needs doing?',
    hint_save: '↵ save · esc cancel',
    prio_alta: 'high',
    prio_media: 'medium',
    prio_baixa: 'low',
    grp_none: 'no priority',
    prio_none_btn: 'none',
    todo_header: 'to do',
    done_header: 'done',
    close: 'close',
    delete: 'delete',
    priority: 'priority',
    notes_ph: 'add context, links, sub-steps…',
    show_desc: 'show description',
    hide_desc: 'hide description',
    synced: 'synced',
    creed: 'one thing at a time.',
    cancel: 'cancel',
    confirm: 'confirm',
    confirm_del_task: (title) => `delete "${title}"?`,
    confirm_del_cat: (label, n) => `delete category "${label}" and its ${n} task${n === 1 ? '' : 's'}?`,
    sec_categories: 'categories',
    sec_appearance: 'appearance',
    sec_language: 'language',
    sec_storage: 'storage',
    sec_about: 'about',
    your_categories: 'your categories',
    tasks_count: (n) => `${n} task${n === 1 ? '' : 's'}`,
    create: 'create',
    theme: 'theme',
    palette: 'palette',
    theme_hint: 'the theme is saved locally. there is no "auto" (system) option yet.',
    language: 'language',
    lang_hint: 'the language is saved locally. the default follows your system.',
    data_file: 'data file',
    path: 'path',
    storage_hint: 'everything lives in a single local JSON. nothing goes to the cloud.',
    about: 'about',
    about_l1: 'mise — a simple task app in Tauri 2.',
    about_l2: 'linen palette · sage accent · galley style.',
  },
};

function detectLang() {
  try {
    const saved = localStorage.getItem('mise:lang');
    if (saved === 'pt' || saved === 'en') return saved;
    const sys = (navigator.language || 'en').toLowerCase();
    return sys.startsWith('pt') ? 'pt' : 'en';
  } catch { return 'en'; }
}

const LangCtx = createContext({ lang: 'pt', t: (k) => k, setLang: () => {} });
const useI18n = () => useContext(LangCtx);

// ─── utils ──────────────────────────────────────────────────────────────
function newId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const MONTHS = {
  pt: ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'],
  en: ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],
};
const DOWS = {
  pt: ['dom','seg','ter','qua','qui','sex','sáb'],
  en: ['sun','mon','tue','wed','thu','fri','sat'],
};
const REL = {
  pt: { now: 'agora', min: (n) => `há ${n} min`, hr: (n) => `há ${n}h`, day: (n) => `há ${n} ${n === 1 ? 'dia' : 'dias'}` },
  en: { now: 'now', min: (n) => `${n} min ago`, hr: (n) => `${n}h ago`, day: (n) => `${n} day${n === 1 ? '' : 's'} ago` },
};

function formatCreated(iso, lang = 'pt') {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const r = REL[lang] || REL.pt;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return r.now;
  if (diff < 3600) return r.min(Math.floor(diff / 60));
  if (diff < 86400) return r.hr(Math.floor(diff / 3600));
  if (diff < 86400 * 7) return r.day(Math.floor(diff / 86400));
  return `${d.getDate()}.${(MONTHS[lang] || MONTHS.pt)[d.getMonth()]}`;
}

function todayLabel(lang = 'pt') {
  const d = new Date();
  const mon = (MONTHS[lang] || MONTHS.pt)[d.getMonth()];
  const dow = (DOWS[lang] || DOWS.pt)[d.getDay()];
  return `${dow} · ${d.getDate()}.${mon}.${String(d.getFullYear()).slice(2)}`;
}

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function autoGrow(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function groupByPrio(list) {
  return {
    alta:  list.filter(t => t.prio === 'alta'),
    media: list.filter(t => t.prio === 'media'),
    baixa: list.filter(t => t.prio === 'baixa'),
    none:  list.filter(t => !['alta','media','baixa'].includes(t.prio)),
  };
}

// ─── icons ──────────────────────────────────────────────────────────────
const Cog = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const Dash = () => <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 6h8" /></svg>;
const Square = () => <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="2" width="8" height="8" /></svg>;
const Cross = () => <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M3 3l6 6M9 3l-6 6" /></svg>;

// ─── App ────────────────────────────────────────────────────────────────
function App() {
  const [lang, setLang] = useState(detectLang);
  const [db, setDb] = useState(null);
  const [activeCat, setActiveCat] = useState('');
  const [theme, setTheme] = useState(() => {
    const t = localStorage.getItem('mise:theme');
    return (t === 'light' || t === 'dark') ? t : 'dark';
  });
  const [expandedId, setExpandedId] = useState(null);
  const [sort, setSort] = useState('prio'); // 'prio' | 'created'
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dbPath, setDbPath] = useState('');
  const [confirmState, setConfirmState] = useState(null);
  const askConfirm = (opts) => setConfirmState(opts);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');

  const saveTimer = useRef(null);
  const firstRender = useRef(true);

  const dict = I18N[lang] || I18N.pt;
  const t = (key, ...args) => {
    const v = dict[key];
    if (typeof v === 'function') return v(...args);
    return v !== undefined ? v : key;
  };

  // load on mount
  useEffect(() => {
    (async () => {
      const loaded = await loadDb();
      setDb(loaded);
      setDbPath(await getDbPath(lang));
      if (loaded.categories.length && !loaded.categories.find(c => c.id === activeCat)) {
        setActiveCat(loaded.categories[0].id);
      }
    })();
  }, []);

  // debounce-save on changes
  useEffect(() => {
    if (!db) return;
    if (firstRender.current) { firstRender.current = false; return; }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveDb(db); }, 250);
  }, [db]);

  useEffect(() => { localStorage.setItem('mise:theme', theme); }, [theme]);
  useEffect(() => { try { localStorage.setItem('mise:lang', lang); } catch {} }, [lang]);

  // reload db when the window regains focus, so external edits (e.g. the
  // mise-todo CLI) show up and don't get clobbered by a stale in-memory save
  useEffect(() => {
    const reload = async () => {
      const fresh = await loadDb();
      setDb(fresh);
      setActiveCat(prev => fresh.categories.find(c => c.id === prev) ? prev : (fresh.categories[0]?.id || ''));
    };
    const onVisible = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', reload);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!db) return null;

  // ─ mutations
  const upd = (mut) => setDb(prev => {
    const next = structuredClone(prev);
    mut(next);
    return next;
  });
  const updTask = (id, patch) => upd(d => {
    const t = d.tasks.find(x => x.id === id);
    if (t) Object.assign(t, patch);
  });
  const addTask = (title, prio = 'none') => {
    if (!activeCat) return;
    const t = {
      id: newId(),
      title: title.trim(),
      prio,
      done: false,
      notes: '',
      category: activeCat,
      created: new Date().toISOString(),
    };
    upd(d => { d.tasks.unshift(t); });
  };
  const deleteTask = (id) => upd(d => { d.tasks = d.tasks.filter(x => x.id !== id); });
  const toggleDone = (id) => upd(d => {
    const t = d.tasks.find(x => x.id === id);
    if (t) t.done = !t.done;
  });
  const addCategory = (label) => {
    const id = slugify(label);
    if (!id) return;
    if (db.categories.find(c => c.id === id)) { setActiveCat(id); return; }
    upd(d => { d.categories.push({ id, label }); });
    setActiveCat(id);
  };
  const deleteCategory = (id) => {
    upd(d => {
      d.categories = d.categories.filter(c => c.id !== id);
      d.tasks = d.tasks.filter(t => t.category !== id);
    });
    if (activeCat === id) {
      const left = db.categories.find(c => c.id !== id);
      setActiveCat(left ? left.id : '');
    }
  };

  const submitNew = () => {
    const v = newTitle.trim();
    if (v) addTask(v);
    setNewTitle('');
    setCreating(false);
  };

  const submitNewCat = () => {
    const v = newCatLabel.trim();
    if (v) addCategory(v);
    setNewCatLabel('');
    setAddingCat(false);
  };

  // ─ derived
  const tasksHere = db.tasks.filter(t => t.category === activeCat);
  const active = tasksHere.filter(t => !t.done);
  const done   = tasksHere.filter(t => t.done);
  const sortedActive = sort === 'created'
    ? [...active].sort((a, b) => (b.created || '').localeCompare(a.created || ''))
    : active;
  const groups = sort === 'prio' ? groupByPrio(sortedActive) : null;

  const counts = {};
  db.categories.forEach(c => {
    counts[c.id] = db.tasks.filter(t => t.category === c.id && !t.done).length;
  });

  const catLabel = db.categories.find(c => c.id === activeCat)?.label || '';
  const noCats = db.categories.length === 0;

  return (
    <LangCtx.Provider value={{ lang, t, setLang }}>
    <div className={`app theme-${theme}`}>
      {/* titlebar */}
      <div className="tb" data-tauri-drag-region>
        <div className="tb-left" data-tauri-drag-region>
          <span className="tb-path" data-tauri-drag-region>
            <span className="app-name" data-tauri-drag-region>mise</span>
            {catLabel && <span className="slash" data-tauri-drag-region>/</span>}
            {catLabel && <span className="cat" data-tauri-drag-region>{catLabel}</span>}
          </span>
          {!noCats && <span className="tb-count" data-tauri-drag-region>{t('count_items', tasksHere.length)}</span>}
        </div>
        <div className="tb-right">
          <div className="tb-theme">
            <span className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>dark</span>
            <span className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>light</span>
          </div>
          <button className="tb-iconbtn" title={t('t_settings')} onClick={() => setSettingsOpen(true)}><Cog /></button>
          <button className="tb-iconbtn" title={t('t_minimize')} onClick={() => tauri && window.__TAURI__?.window?.getCurrentWindow?.().minimize()}><Dash /></button>
          <button className="tb-iconbtn" title={t('t_maximize')} onClick={() => tauri && window.__TAURI__?.window?.getCurrentWindow?.().toggleMaximize()}><Square /></button>
          <button className="tb-iconbtn close" title={t('t_close_win')} onClick={() => tauri && window.__TAURI__?.window?.getCurrentWindow?.().close()}><Cross /></button>
        </div>
      </div>

      {/* main */}
      <div className="lb-wrap">
        <div className="lb-col">
          <div className="lb-head">
            <h1>{catLabel || 'mise'}</h1>
            <span className="date">{todayLabel(lang)}</span>
          </div>

          {noCats ? (
            <div className="lb-empty">
              <div className="msg">{t('no_cats_msg')}</div>
              <div className="sub">{t('no_cats_sub')}</div>
              <input
                className="cat-add-in solo"
                autoFocus
                value={newCatLabel}
                placeholder={t('new_category_ph')}
                onChange={(e) => setNewCatLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewCat();
                  else if (e.key === 'Escape') { setNewCatLabel(''); }
                }}
              />
            </div>
          ) : (
            <>
              <div className="lb-tabs">
                {db.categories.map(c => (
                  <span key={c.id} className={`t ${c.id === activeCat ? 'on' : ''}`} onClick={() => { setActiveCat(c.id); setExpandedId(null); setCreating(false); }}>
                    {c.label} <span className="ct">{counts[c.id]}</span>
                  </span>
                ))}
                {addingCat ? (
                  <input
                    className="cat-add-in"
                    autoFocus
                    value={newCatLabel}
                    placeholder={t('new_category_ph')}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitNewCat();
                      else if (e.key === 'Escape') { setNewCatLabel(''); setAddingCat(false); }
                    }}
                    onBlur={submitNewCat}
                  />
                ) : (
                  <span className="add" title={t('new_category')} onClick={() => setAddingCat(true)}>+</span>
                )}
              </div>

              {tasksHere.length === 0 && !creating ? (
                <div className="lb-empty">
                  <div className="msg">{t('empty_msg')}</div>
                  <div className="sub">{t('empty_sub')}</div>
                  <div className="new" onClick={() => setCreating(true)}>+ {t('new_task')}</div>
                </div>
              ) : (
                <>
                  <div className="lb-bar">
                    <span>{t('sort')}</span>
                    <div className="seg">
                      <span className={sort === 'prio' ? 'on' : ''} onClick={() => setSort('prio')}>{t('sort_prio')}</span>
                      <span className={sort === 'created' ? 'on' : ''} onClick={() => setSort('created')}>{t('sort_created')}</span>
                    </div>
                    <span className="new" onClick={() => setCreating(true)}>+ {t('new_task')}</span>
                  </div>

                  {creating && (
                    <>
                      <div className="lb-group">
                        <span className="prio none"></span>
                        <span>{t('group_new')}</span>
                      </div>
                      <div className="lb-new">
                        <span className="cb"></span>
                        <span className="prio none"></span>
                        <input
                          autoFocus
                          value={newTitle}
                          placeholder={t('task_ph')}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitNew();
                            else if (e.key === 'Escape') { setCreating(false); setNewTitle(''); }
                          }}
                          onBlur={submitNew}
                        />
                        <span className="hint">{t('hint_save')}</span>
                      </div>
                    </>
                  )}

                  {sort === 'prio' ? (
                    <>
                      <Group prioKey="alta" tasks={groups.alta} {...{ expandedId, setExpandedId, toggleDone, updTask, deleteTask, askConfirm }} />
                      <Group prioKey="media" tasks={groups.media} {...{ expandedId, setExpandedId, toggleDone, updTask, deleteTask, askConfirm }} />
                      <Group prioKey="baixa" tasks={groups.baixa} {...{ expandedId, setExpandedId, toggleDone, updTask, deleteTask, askConfirm }} />
                      <Group prioKey="none" tasks={groups.none} {...{ expandedId, setExpandedId, toggleDone, updTask, deleteTask, askConfirm }} />
                    </>
                  ) : (
                    <>
                      {sortedActive.length > 0 && (
                        <div className="lb-group">
                          <span className="prio none"></span>
                          <span>{t('todo_header')}</span>
                          <span className="ct">{sortedActive.length}</span>
                        </div>
                      )}
                      {sortedActive.map(tk => (
                        <TaskRow key={tk.id} task={tk} expanded={tk.id === expandedId} {...{ setExpandedId, toggleDone, updTask, deleteTask, askConfirm }} />
                      ))}
                    </>
                  )}

                  {done.length > 0 && (
                    <>
                      <div className="lb-group">
                        <span className="prio none" style={{ borderColor: 'var(--c-overlay)' }}></span>
                        <span>{t('done_header')}</span>
                        <span className="ct">{done.length}</span>
                      </div>
                      {done.map(tk => (
                        <TaskRow key={tk.id} task={tk} expanded={false} {...{ setExpandedId, toggleDone, updTask, deleteTask, askConfirm }} />
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* statusline */}
      <div className="sl">
        <span className="seg"><span className="dot"></span><span>{t('synced')}</span></span>
        <span className="seg" title={dbPath}>{dbPath}</span>
        <span className="creed">{t('creed')}</span>
      </div>

      {settingsOpen && (
        <SettingsModal
          db={db}
          dbPath={dbPath}
          theme={theme}
          setTheme={setTheme}
          addCategory={addCategory}
          deleteCategory={deleteCategory}
          close={() => setSettingsOpen(false)}
          askConfirm={askConfirm}
        />
      )}

      {confirmState && (
        <ConfirmModal {...confirmState} close={() => setConfirmState(null)} />
      )}
    </div>
    </LangCtx.Provider>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────
function ConfirmModal({ message, confirmLabel, danger = false, alertOnly = false, onConfirm, close }) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="confirm-bd" onClick={(e) => { if (e.target.classList.contains('confirm-bd')) close(); }}>
      <div className="confirm-box">
        <div className="msg">{message}</div>
        <div className="actions">
          {!alertOnly && <button onClick={close}>{t('cancel')}</button>}
          <button
            className={danger ? 'danger' : 'primary'}
            autoFocus
            onClick={() => { if (onConfirm) onConfirm(); close(); }}
          >{confirmLabel || t('confirm')}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Group ──────────────────────────────────────────────────────────────
function Group({ prioKey, tasks, expandedId, setExpandedId, toggleDone, updTask, deleteTask, askConfirm }) {
  const { t } = useI18n();
  if (!tasks.length) return null;
  const color =
    prioKey === 'alta'  ? 'var(--c-danger)' :
    prioKey === 'media' ? 'var(--c-warn)' :
    prioKey === 'baixa' ? 'var(--c-accent)' :
    null;
  const label = prioKey === 'none' ? t('grp_none') : t('prio_' + prioKey);
  return (
    <>
      <div className="lb-group">
        {color
          ? <span className="prio" style={{ background: color }}></span>
          : <span className="prio none"></span>
        }
        <span>{label}</span>
        <span className="ct">{tasks.length}</span>
      </div>
      {tasks.map(tk => (
        <TaskRow
          key={tk.id}
          task={tk}
          expanded={tk.id === expandedId}
          {...{ setExpandedId, toggleDone, updTask, deleteTask, askConfirm }}
        />
      ))}
    </>
  );
}

// ─── TaskRow ────────────────────────────────────────────────────────────
function TaskRow({ task, expanded, setExpandedId, toggleDone, updTask, deleteTask, askConfirm }) {
  const { t, lang } = useI18n();
  const [showDesc, setShowDesc] = useState(false);
  const hasNotes = !!(task.notes && task.notes.trim());
  const rootRef = useRef(null);

  useEffect(() => {
    if (!expanded) return;
    const onClick = (e) => {
      const el = rootRef.current;
      if (!el || el.contains(e.target)) return;
      // clicking another task switches; modals handle their own dismissal
      if (e.target.closest('.lb-task') || e.target.closest('.confirm-bd') || e.target.closest('.modal-bd')) return;
      setExpandedId(null);
    };
    // defer to next tick so the click that opened this row doesn't close it
    const id = setTimeout(() => document.addEventListener('click', onClick), 0);
    return () => { clearTimeout(id); document.removeEventListener('click', onClick); };
  }, [expanded]);

  if (expanded) {
    return (
      <div className="lb-task expanded" ref={rootRef}>
        <div className="row1">
          <span className={`cb ${task.done ? 'on' : ''}`} onClick={() => toggleDone(task.id)}
                style={ task.done ? { background:'var(--c-accent)', borderColor:'var(--c-accent)' } : null }
          ></span>
          <span className={`prio ${task.prio || 'none'}`}></span>
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
          <span className="acts">
            <span onClick={() => setExpandedId(null)}>{t('close')}</span>
            <span className="danger" onClick={() => {
              askConfirm({
                message: t('confirm_del_task', task.title),
                confirmLabel: t('delete'),
                danger: true,
                onConfirm: () => { deleteTask(task.id); setExpandedId(null); },
              });
            }}>{t('delete')}</span>
          </span>
        </div>
        <div className="body">
          <div className="prio-row">
            <span className="lbl">{t('priority')}</span>
            <div className="seg">
              {['alta','media','baixa'].map((p) => (
                <button key={p} className={task.prio === p ? 'on' : ''} onClick={() => updTask(task.id, { prio: p })}>
                  <span className={`prio ${p}`}></span>{t('prio_' + p)}
                </button>
              ))}
              <button className={!['alta','media','baixa'].includes(task.prio) ? 'on' : ''} onClick={() => updTask(task.id, { prio: 'none' })}>{t('prio_none_btn')}</button>
            </div>
          </div>
          <textarea
            className="notes"
            defaultValue={task.notes}
            placeholder={t('notes_ph')}
            onBlur={(e) => updTask(task.id, { notes: e.target.value })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`lb-task ${task.done ? 'done' : ''}`} onClick={(e) => {
      if (e.target.tagName === 'SPAN' && e.target.classList.contains('cb')) return;
      setExpandedId(task.id);
    }}>
      <span className="cb" onClick={(e) => { e.stopPropagation(); toggleDone(task.id); }}></span>
      <span className={`prio ${task.prio || 'none'}`}></span>
      <div className="ttl-wrap">
        <span className="ttl">{task.title}</span>
        {hasNotes && (
          <span
            className={`desc-toggle ${showDesc ? 'on' : ''}`}
            onClick={(e) => { e.stopPropagation(); setShowDesc(s => !s); }}
          >{showDesc ? t('hide_desc') : t('show_desc')}</span>
        )}
        {showDesc && hasNotes && (
          <div className="lb-desc" onClick={(e) => e.stopPropagation()}>{task.notes}</div>
        )}
      </div>
      <span className="when">{formatCreated(task.created, lang)}</span>
    </div>
  );
}

// ─── SettingsModal ──────────────────────────────────────────────────────
function SettingsModal({ db, dbPath, theme, setTheme, addCategory, deleteCategory, close, askConfirm }) {
  const { t, lang, setLang } = useI18n();
  const [newCat, setNewCat] = useState('');
  const [section, setSection] = useState('categories');

  const sections = [
    ['categories', t('sec_categories')],
    ['appearance', t('sec_appearance')],
    ['language', t('sec_language')],
    ['storage', t('sec_storage')],
    ['about', t('sec_about')],
  ];

  return (
    <div className="modal-bd" onClick={(e) => { if (e.target.classList.contains('modal-bd')) close(); }}>
      <div className="modal">
        <div className="mhead">
          <h2>{t('t_settings')}</h2>
          <button className="close" onClick={close}>×</button>
        </div>
        <div className="mnav">
          {sections.map(([key, label]) => (
            <a key={key} className={section === key ? 'on' : ''} onClick={() => setSection(key)}>{label}</a>
          ))}
        </div>
        <div className="mbody">
          {section === 'categories' && (
            <>
              <h4>{t('your_categories')}</h4>
              <div className="cfg-list">
                {db.categories.map(c => {
                  const count = db.tasks.filter(t => t.category === c.id).length;
                  return (
                    <div key={c.id} className="row">
                      <span className="ic">◆</span>
                      <span className="nm">{c.label}</span>
                      <span className="meta">{t('tasks_count', count)}</span>
                      <span className="act danger" onClick={() => {
                        askConfirm({
                          message: t('confirm_del_cat', c.label, count),
                          confirmLabel: t('delete'),
                          danger: true,
                          onConfirm: () => deleteCategory(c.id),
                        });
                      }}>{t('delete')}</span>
                    </div>
                  );
                })}
                {db.categories.length === 0 && (
                  <div className="row"><span className="meta">{t('no_cats_msg')}</span></div>
                )}
              </div>
              <div className="cfg-add">
                <input
                  placeholder={t('new_category_ph')}
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newCat.trim()) { addCategory(newCat.trim()); setNewCat(''); } }}
                />
                <button className="btn" onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat(''); } }}>{t('create')}</button>
              </div>
            </>
          )}

          {section === 'appearance' && (
            <>
              <h4>{t('theme')}</h4>
              <div className="field">
                <span className="lbl">{t('palette')}</span>
                <div className="seg">
                  <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>linen dark</button>
                  <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>linen light</button>
                </div>
                <span className="hint">{t('theme_hint')}</span>
              </div>
            </>
          )}

          {section === 'language' && (
            <>
              <h4>{t('language')}</h4>
              <div className="field">
                <span className="lbl">{t('language')}</span>
                <div className="seg">
                  <button className={lang === 'pt' ? 'on' : ''} onClick={() => setLang('pt')}>português</button>
                  <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>english</button>
                </div>
                <span className="hint">{t('lang_hint')}</span>
              </div>
            </>
          )}

          {section === 'storage' && (
            <>
              <h4>{t('data_file')}</h4>
              <div className="field">
                <span className="lbl">{t('path')}</span>
                <div className="path-row">{dbPath}</div>
                <span className="hint">{t('storage_hint')}</span>
              </div>
            </>
          )}

          {section === 'about' && (
            <>
              <h4>{t('about')}</h4>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--c-subtext)', lineHeight: 1.7 }}>
                {t('about_l1')}<br />
                {t('about_l2')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App
