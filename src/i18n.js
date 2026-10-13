// mise · i18n strings + locale-aware date helpers.

import { createContext, useContext } from 'react'

export const I18N = {
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
    // category kinds
    kind_list: 'lista',
    kind_board: 'board',
    kind_list_desc: 'checklist, agrupado por prioridade',
    kind_board_desc: 'cards em colunas de status',
    nc_hint: 'tab troca tipo · ↵ criar · esc cancelar',
    nc_hint_solo: 'tab troca tipo · ↵ criar',
    // board
    col_todo: 'a fazer',
    col_doing: 'fazendo',
    col_done: 'feito',
    board_summary: (cards, cols) => `${cards} ${cards === 1 ? 'card' : 'cards'} · ${cols} colunas`,
    add_column: 'coluna',
    column_ph: 'nome da coluna…',
    rename_col: 'duplo clique para renomear',
    remove_col: 'remover coluna',
    new_card: 'novo card',
    add_card: 'adicionar card',
    drop_here: 'soltar aqui',
    drop_hint: 'arraste para um status acima para mover',
    has_desc: 'tem descrição',
    status: 'status',
    delete_card: 'excluir card',
    sheet_done: 'pronto',
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
    // category kinds
    kind_list: 'list',
    kind_board: 'board',
    kind_list_desc: 'checklist, grouped by priority',
    kind_board_desc: 'cards in status columns',
    nc_hint: 'tab switch type · ↵ create · esc cancel',
    nc_hint_solo: 'tab switch type · ↵ create',
    // board
    col_todo: 'to do',
    col_doing: 'doing',
    col_done: 'done',
    board_summary: (cards, cols) => `${cards} card${cards === 1 ? '' : 's'} · ${cols} columns`,
    add_column: 'column',
    column_ph: 'column name…',
    rename_col: 'double-click to rename',
    remove_col: 'remove column',
    new_card: 'new card',
    add_card: 'add card',
    drop_here: 'drop here',
    drop_hint: 'drag onto a status above to move',
    has_desc: 'has description',
    status: 'status',
    delete_card: 'delete card',
    sheet_done: 'done',
  },
};

export function detectLang() {
  try {
    const saved = localStorage.getItem('mise:lang');
    if (saved === 'pt' || saved === 'en') return saved;
    const sys = (navigator.language || 'en').toLowerCase();
    return sys.startsWith('pt') ? 'pt' : 'en';
  } catch { return 'en'; }
}

export const LangCtx = createContext({ lang: 'pt', t: (k) => k, setLang: () => {} });
export const useI18n = () => useContext(LangCtx);

// ─── dates ──────────────────────────────────────────────────────────────
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

export function formatCreated(iso, lang = 'pt') {
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

export function todayLabel(lang = 'pt') {
  const d = new Date();
  const mon = (MONTHS[lang] || MONTHS.pt)[d.getMonth()];
  const dow = (DOWS[lang] || DOWS.pt)[d.getDay()];
  return `${dow} · ${d.getDate()}.${mon}.${String(d.getFullYear()).slice(2)}`;
}
