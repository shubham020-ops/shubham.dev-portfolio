import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowUp, Inbox, LayoutDashboard, Loader2, LogOut,
  Mail, Plus, RefreshCw, Save, ShieldCheck, Trash2, X,
} from 'lucide-react';
import { apiRequest, getSession, login, logout, notifyPortfolioUpdated, setCsrfToken } from '../services/api';
import { usePortfolio } from '../context/PortfolioContext';
import { HOME_PATH } from '../services/paths';

const sections = [
  { id: 'site', label: 'Hero & SEO', type: 'object', description: 'Hero heading, intro, call-to-action, contact email, and public SEO metadata.' },
  { id: 'about', label: 'About', type: 'object', description: 'About copy, details, portrait image, focus cards, and approach list.' },
  { id: 'skillGroups', label: 'Skills', type: 'list', description: 'Skill groups, individual skills, icons, visibility, and display order.' },
  { id: 'projects', label: 'Projects', type: 'list', description: 'Project cards, images, technology lists, links, featured order, and publish status.' },
  { id: 'featured', label: 'Featured showcase', type: 'object', description: 'The existing large showcase banner and its artwork, panels, links, and visibility.' },
  { id: 'experience', label: 'Experience', type: 'list', description: 'Real education, roles, dates, organizations, and milestones.' },
  { id: 'testimonials', label: 'Testimonials', type: 'list', description: 'Genuine quotes only. Empty or hidden testimonials stay off the public site.' },
  { id: 'navLinks', label: 'Navigation', type: 'list', description: 'Navigation labels, section anchors, visibility, and order.' },
  { id: 'socials', label: 'Social links', type: 'list', description: 'Public profile names and URLs.' },
  { id: 'footer', label: 'Footer', type: 'object', description: 'Footer headings, credit line, and copyright text.' },
  { id: 'contactTypes', label: 'Contact form choices', type: 'list', description: 'The project type options shown in the contact form.' },
];

const templates = {
  navLinks: { id: '', label: '', order: 1, visible: false },
  socials: { label: '', url: '', published: false },
  skillGroups: { id: '', icon: 'Code2', title: '', skills: [], order: 1, published: false },
  projects: { id: '', number: '01', title: '', category: '', description: '', details: '', tech: [], image: '', cover: { variant: 'orbit', palette: ['#C7FF4F', '#52E5FF', '#8B5CF6'] }, liveUrl: '', repoUrl: '', caseStudyUrl: '', featured: false, order: 1, published: false },
  experience: { id: '', type: '', date: '', role: '', org: '', text: '', order: 1, published: false },
  testimonials: { id: '', quote: '', name: '', role: '', context: '', rating: 5, order: 1, published: false },
  contactTypes: '',
};

const fieldClass = 'w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm text-fg outline-none transition focus:border-lime';
const cardClass = 'rounded-2xl border border-line bg-surface/80';

function errorText(error) {
  return error?.message || 'Request could not be completed.';
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function Login({ onLoggedIn, initialError = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  useEffect(() => { if (initialError) setError(initialError); }, [initialError]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try { onLoggedIn(await login(email, password)); }
    catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };

  return (
    <main className="min-h-screen bg-ink px-5 py-16 text-fg">
      <section className={`${cardClass} mx-auto max-w-md p-7 sm:p-10`}>
        <a href={HOME_PATH} className="font-display text-xl font-extrabold">shubham<span className="text-lime">.dev</span></a>
        <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-full border border-line text-lime"><ShieldCheck size={22} /></div>
        <h1 className="display mt-6 text-4xl">Admin sign in</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">Sign in to update portfolio content and review contact messages.</p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block space-y-2 text-sm font-medium" htmlFor="admin-email">Email
            <input id="admin-email" className={fieldClass} type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block space-y-2 text-sm font-medium" htmlFor="admin-password">Password
            <input id="admin-password" className={fieldClass} type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p role="alert" className="rounded-xl border border-[#ff7a7a]/50 bg-[#ff7a7a]/5 p-3 text-sm text-[#ffaaaa]">{error}</p>}
          <button className="btn btn-primary w-full justify-center" type="submit" disabled={busy}>
            {busy ? <><Loader2 size={17} className="animate-spin" /> Signing in…</> : 'Sign in securely'}
          </button>
        </form>
        <a href={HOME_PATH} className="mt-7 inline-flex items-center gap-2 text-sm text-muted transition hover:text-lime"><ArrowLeft size={16} /> Back to portfolio</a>
      </section>
    </main>
  );
}

function FieldEditor({ value, onChange, name }) {
  if (typeof value === 'boolean') {
    return <input aria-label={name} type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-lime" />;
  }
  if (typeof value === 'number') {
    return <input aria-label={name} className={fieldClass} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />;
  }
  if (value && typeof value === 'object') {
    return <textarea aria-label={name} className={`${fieldClass} min-h-28 font-mono text-xs`} spellCheck="false" value={JSON.stringify(value, null, 2)} onChange={(event) => onChange(event.target.value)} />;
  }
  const text = String(value ?? '');
  const multiline = text.length > 100 || /description|message|quote|text|intro|bio|details|approach|skills|tech|panels|focus|image|url/i.test(name);
  return multiline
    ? <textarea aria-label={name} className={`${fieldClass} min-h-24`} value={text} onChange={(event) => onChange(event.target.value)} />
    : <input aria-label={name} className={fieldClass} type="text" value={text} onChange={(event) => onChange(event.target.value)} />;
}

function RecordForm({ item, onCancel, onSave, busy }) {
  const [draft, setDraft] = useState(() => ({ ...item }));
  const [error, setError] = useState('');
  const entries = Object.entries(draft).filter(([key]) => key !== 'recordId');

  const save = async (event) => {
    event.preventDefault();
    const next = { ...draft };
    for (const [key, value] of Object.entries(next)) {
      if (typeof value === 'string' && value.trim().startsWith('[') || (typeof value === 'string' && value.trim().startsWith('{'))) {
        try { next[key] = JSON.parse(value); }
        catch { setError(`${key} mein valid JSON chahiye. Arrays/objects ke liye brackets verify karein.`); return; }
      }
    }
    setError('');
    try { await onSave(next); }
    catch (cause) { setError(errorText(cause)); }
  };

  return (
    <form onSubmit={save} className="mt-4 space-y-4 rounded-xl border border-line bg-ink/70 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map(([key, value]) => (
          <label key={key} className={`block space-y-2 text-xs font-semibold capitalize text-muted ${value && typeof value === 'object' ? 'md:col-span-2' : ''}`}>
            {key.replace(/([A-Z])/g, ' $1')}
            <FieldEditor name={key} value={value} onChange={(next) => setDraft((current) => ({ ...current, [key]: next }))} />
          </label>
        ))}
      </div>
      <p className="text-xs text-muted">Text plain rakhein. Nested lists/objects JSON mein edit hote hain; HTML/script accept nahi hote. Image URLs ya `/images/...` paths use karein.</p>
      {error && <p role="alert" className="text-sm text-[#ffaaaa]">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save</button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}><X size={16} /> Cancel</button>
      </div>
    </form>
  );
}

function SectionEditor({ section, refreshPublic }) {
  const [value, setValue] = useState(section.type === 'list' ? [] : {});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest(`/admin/content/${section.id}`);
      setValue(result.value ?? (section.type === 'list' ? [] : {}));
    } catch (cause) { setError(errorText(cause)); }
    finally { setLoading(false); }
  }, [section.id, section.type]);

  useEffect(() => { load(); }, [load]);

  const commit = async (next) => {
    setBusy(true);
    try {
      const result = await apiRequest(`/admin/content/${section.id}`, { method: 'PUT', body: { value: next } });
      setValue(result.value);
      setToast('Changes save ho gaye.');
      notifyPortfolioUpdated();
      await refreshPublic();
    } catch (cause) { throw cause; }
    finally { setBusy(false); }
  };

  const saveItem = async (item) => {
    setBusy(true);
    try {
      const result = creating
        ? await apiRequest(`/admin/content/${section.id}/items`, { method: 'POST', body: { item } })
        : await apiRequest(`/admin/content/${section.id}/items/${encodeURIComponent(editingId)}`, { method: 'PUT', body: { item } });
      setValue(result.value);
      setEditingId(null);
      setCreating(false);
      setToast('Record save ho gaya.');
      notifyPortfolioUpdated();
      await refreshPublic();
    } finally { setBusy(false); }
  };

  const removeItem = async (item) => {
    const index = value.indexOf(item);
    if (!window.confirm(`“${itemLabel(item)}” ko permanently delete karein?`)) return;
    if (section.id === 'contactTypes') {
      try { await commit(value.filter((_, itemIndex) => itemIndex !== index)); }
      catch (cause) { setError(errorText(cause)); }
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest(`/admin/content/${section.id}/items/${encodeURIComponent(item.recordId)}`, { method: 'DELETE', body: {} });
      setValue(result.value);
      notifyPortfolioUpdated();
      setToast('Record delete ho gaya.');
      await refreshPublic();
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };

  const reorder = async (index, direction) => {
    const next = [...value];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    if (section.id === 'contactTypes') {
      try { await commit(next); }
      catch (cause) { setError(errorText(cause)); }
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest(`/admin/content/${section.id}/reorder`, { method: 'PUT', body: { ids: next.map((item) => item.recordId) } });
      setValue(result.value);
      notifyPortfolioUpdated();
      setToast('Order update ho gaya.');
      await refreshPublic();
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };

  const addItem = () => {
    const base = templates[section.id];
    const item = typeof base === 'string' ? '' : { ...(base || { title: 'New item', order: value.length + 1, published: true }) };
    if (typeof base === 'string') {
      setCreating(true);
      setNewItem({ value: item });
      return;
    }
    setCreating(true);
    setEditingId(null);
    setNewItem({ ...item, order: value.length + 1 });
  };

  const [newItem, setNewItem] = useState(null);
  const singletonItem = useMemo(() => value && !Array.isArray(value) ? value : {}, [value]);

  return (
    <section className={`${cardClass} p-5 sm:p-7`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="eyebrow text-lime">Content manager</p><h2 className="display mt-2 text-3xl">{section.label}</h2><p className="mt-2 max-w-2xl text-sm text-muted">{section.description}</p></div>
        <button type="button" onClick={load} className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted hover:border-lime hover:text-lime" aria-label="Refresh section"><RefreshCw size={17} /></button>
      </div>
      {loading ? <p role="status" className="mt-8 flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="animate-spin" /> Loading saved content…</p> : (
        <>
          {error && <p role="alert" className="mt-5 rounded-xl border border-[#ff7a7a]/50 p-3 text-sm text-[#ffaaaa]">{error}</p>}
          {toast && <p aria-live="polite" className="mt-5 rounded-xl border border-lime/40 bg-lime/5 p-3 text-sm text-lime">{toast}</p>}
          {section.type === 'object' ? (
            <div className="mt-6">
              {value === null && <p className="mb-4 text-sm text-muted">Yeh content abhi set nahi hai. Naya object bana kar save karein.</p>}
              <RecordForm key={`${section.id}:${JSON.stringify(singletonItem)}`} item={singletonItem} busy={busy} onCancel={load} onSave={commit} />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">{value.length} records saved</p><button type="button" className="btn btn-primary" onClick={addItem} disabled={busy}><Plus size={17} /> Add {section.id === 'contactTypes' ? 'choice' : 'record'}</button></div>
              {creating && newItem !== null && <RecordForm item={newItem} busy={busy} onCancel={() => { setCreating(false); setNewItem(null); }} onSave={async (item) => { if (section.id === 'contactTypes') await commit([...value, item.value]); else await saveItem(item); setNewItem(null); setCreating(false); }} />}
              {value.map((item, index) => (
                <article key={item.recordId || `${index}:${item}`} className="rounded-xl border border-line bg-ink/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0"><h3 className="truncate font-semibold">{itemLabel(item)}</h3><p className="mt-1 text-xs text-muted">{item.published === false || item.visible === false ? 'Hidden / unpublished' : 'Visible'}{item.order ? ` · order ${item.order}` : ''}</p></div>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled={busy || index === 0} onClick={() => reorder(index, -1)} aria-label="Move up" className="grid h-9 w-9 place-items-center rounded-full border border-line disabled:opacity-30"><ArrowUp size={15} /></button>
                      <button type="button" disabled={busy || index === value.length - 1} onClick={() => reorder(index, 1)} aria-label="Move down" className="grid h-9 w-9 place-items-center rounded-full border border-line disabled:opacity-30"><ArrowDown size={15} /></button>
                      <button type="button" onClick={() => { setCreating(false); setEditingId(item.recordId || String(index)); }} className="btn btn-ghost !px-3 !py-2">Edit</button>
                      <button type="button" disabled={busy} onClick={() => removeItem(item)} aria-label={`Delete ${itemLabel(item)}`} className="grid h-9 w-9 place-items-center rounded-full border border-line text-[#ffaaaa] hover:border-[#ff7a7a]"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  {editingId === (item.recordId || String(index)) && <RecordForm key={item.recordId || index} item={section.id === 'contactTypes' ? { value: item } : item} busy={busy} onCancel={() => setEditingId(null)} onSave={async (draft) => { if (section.id === 'contactTypes') { const next = [...value]; next[index] = draft.value; await commit(next); setEditingId(null); } else await saveItem(draft); }} />}
                </article>
              ))}
              {!value.length && <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">Abhi koi saved record nahi. Add button se pehla record banayein.</div>}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function itemLabel(item) {
  if (typeof item === 'string') return item;
  return item.title || item.name || item.label || item.role || item.kicker || item.id || 'Untitled record';
}

function Dashboard({ data, loading, onOpenMessages }) {
  const stats = [
    ['Projects', data?.projects ?? '—'], ['Skill groups', data?.skillGroups ?? '—'],
    ['Contact messages', data?.contactMessages ?? '—'], ['New messages', data?.newMessages ?? '—'],
    ['Unread messages', data?.unreadMessages ?? '—'], ['Email failures', data?.emailFailures ?? '—'],
  ];
  return (
    <section className="space-y-6">
      <div className={`${cardClass} p-6 sm:p-8`}><p className="eyebrow text-lime">Portfolio control room</p><h1 className="display mt-3 text-4xl sm:text-5xl">Dashboard</h1><p className="mt-3 text-sm text-muted">Ye stats MongoDB se load hote hain. Yahan se saved public content aur incoming messages manage karein.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{stats.map(([label, number]) => <div key={label} className={`${cardClass} p-5`}><p className="eyebrow">{label}</p><p className="display mt-3 text-4xl text-lime">{loading ? '…' : number}</p></div>)}</div>
      <div className={`${cardClass} p-5 sm:p-7`}>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow text-lime">Inbox preview</p><h2 className="display mt-2 text-2xl">Recent contact messages</h2></div><button className="btn btn-ghost" type="button" onClick={onOpenMessages}><Inbox size={16} /> Open inbox</button></div>
        <div className="mt-5 divide-y divide-line">{(data?.recentMessages || []).map((message) => <button key={message._id} type="button" onClick={onOpenMessages} className="flex w-full flex-wrap items-center justify-between gap-3 py-4 text-left hover:text-lime"><span><strong className="block">{message.name}</strong><span className="text-sm text-muted">{message.subject || 'No subject'} · {message.email}</span></span><span className="text-xs text-muted">{formatDate(message.createdAt)}</span></button>)}{!loading && !data?.recentMessages?.length && <p className="py-7 text-sm text-muted">Abhi koi contact message nahi aaya.</p>}</div>
      </div>
    </section>
  );
}

function Messages({ refreshDashboard }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState('');
  const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setMessages(await apiRequest('/admin/messages')); }
    catch (cause) { setError(errorText(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (message, status) => {
    setBusyId(message._id);
    try {
      await apiRequest(`/admin/messages/${message._id}`, { method: 'PATCH', body: { status } });
      await load(); await refreshDashboard();
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusyId(''); }
  };
  const retryEmail = async (message) => {
    setBusyId(message._id);
    try { await apiRequest(`/admin/messages/${message._id}/retry-email`, { method: 'POST', body: {} }); await load(); await refreshDashboard(); }
    catch (cause) { setError(errorText(cause)); }
    finally { setBusyId(''); }
  };
  const deleteMessage = async (message) => {
    if (!window.confirm(`Message from ${message.name} (${message.email}) permanently delete karein?`)) return;
    setBusyId(message._id);
    try {
      await apiRequest(`/admin/messages/${message._id}`, { method: 'DELETE', headers: { 'X-Confirm-Delete': 'true' }, body: {} });
      await load(); await refreshDashboard();
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusyId(''); }
  };

  return (
    <section className={`${cardClass} p-5 sm:p-7`}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-lime">Private inbox</p><h2 className="display mt-2 text-3xl">Contact messages</h2><p className="mt-2 text-sm text-muted">Sender details sirf signed-in admin ko dikhte hain.</p></div><button type="button" onClick={load} className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted hover:border-lime hover:text-lime" aria-label="Refresh inbox"><RefreshCw size={17} /></button></div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-[#ff7a7a]/50 p-3 text-sm text-[#ffaaaa]">{error}</p>}
      <div className="mt-6 space-y-3">{loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="animate-spin" /> Inbox load ho raha hai…</p> : messages.map((message) => (
        <article key={message._id} className="rounded-xl border border-line bg-ink/50">
          <button type="button" className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left" onClick={async () => { const opening = openId !== message._id; setOpenId(opening ? message._id : ''); if (opening && message.status === 'new') await updateStatus(message, 'read'); }}>
            <span className="min-w-0"><strong className="block truncate">{message.name}</strong><span className="text-sm text-muted">{message.email} · {message.subject || 'No subject'}</span></span><span className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-line px-2.5 py-1">{message.status}</span><span className="rounded-full border border-line px-2.5 py-1">Email: {message.emailStatus}</span><span className="text-muted">{formatDate(message.createdAt)}</span></span>
          </button>
          {openId === message._id && <div className="border-t border-line p-4">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message}</p>
            <p className="mt-4 text-xs text-muted">{message.emailAttemptCount} email attempt(s){message.emailLastAttemptAt ? ` · last attempt ${formatDate(message.emailLastAttemptAt)}` : ''}{message.emailDeliveredAt ? ` · delivered ${formatDate(message.emailDeliveredAt)}` : ''}{message.emailErrorCode ? ` · ${message.emailErrorCode}` : ''}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {message.emailStatus === 'failed' || message.emailStatus === 'not_configured' ? <button type="button" className="btn btn-ghost" disabled={busyId === message._id} onClick={() => retryEmail(message)}><RefreshCw size={15} /> Retry email</button> : null}
              {message.status !== 'archived' ? <button type="button" className="btn btn-ghost" disabled={busyId === message._id} onClick={() => updateStatus(message, 'archived')}>Archive</button> : <button type="button" className="btn btn-ghost" disabled={busyId === message._id} onClick={() => updateStatus(message, 'read')}>Restore to read</button>}
              <button type="button" className="btn btn-ghost text-[#ffaaaa]" disabled={busyId === message._id} onClick={() => deleteMessage(message)}><Trash2 size={15} /> Delete permanently</button>
            </div>
          </div>}
        </article>
      ))}{!loading && !messages.length && <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">Inbox empty hai. Public contact form se bheje gaye messages yahan dikhte hain.</div>}</div>
    </section>
  );
}

function Account({ onPasswordChanged }) {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setNotice(''); setError('');
    try { await apiRequest('/auth/password', { method: 'PUT', body: { currentPassword, newPassword } }); setNotice('Password update ho gaya; security ke liye dobara sign in karein.'); setCsrfToken(''); setTimeout(onPasswordChanged, 900); }
    catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };
  return <section className={`${cardClass} max-w-xl p-5 sm:p-7`}><p className="eyebrow text-lime">Security</p><h2 className="display mt-2 text-3xl">Change password</h2><form onSubmit={submit} className="mt-6 space-y-4"><label className="block space-y-2 text-sm" htmlFor="current-password">Current password<input id="current-password" className={fieldClass} type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} /></label><label className="block space-y-2 text-sm" htmlFor="new-password">New password (14+ characters)<input id="new-password" className={fieldClass} type="password" autoComplete="new-password" minLength={14} required value={newPassword} onChange={(e) => setNext(e.target.value)} /></label>{error && <p role="alert" className="text-sm text-[#ffaaaa]">{error}</p>}{notice && <p role="status" className="text-sm text-lime">{notice}</p>}<button className="btn btn-primary" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Update password</button></form></section>;
}

export default function AdminApp() {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [active, setActive] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [banner, setBanner] = useState('');
  const { refreshPortfolio } = usePortfolio();

  useEffect(() => {
    getSession().then(setAdmin).catch((cause) => setAuthError(errorText(cause))).finally(() => setChecking(false));
    const onUnauthorized = () => { setAdmin(null); setAuthError('Session expire ho gaya. Dobara sign in karein.'); };
    window.addEventListener('portfolio:unauthorized', onUnauthorized);
    return () => window.removeEventListener('portfolio:unauthorized', onUnauthorized);
  }, []);

  const refreshDashboard = useCallback(async () => {
    setDashLoading(true);
    try { setDashboard(await apiRequest('/admin/dashboard')); setAuthError(''); }
    catch (cause) { setAuthError(errorText(cause)); }
    finally { setDashLoading(false); }
  }, []);
  useEffect(() => { if (admin) refreshDashboard(); }, [admin, refreshDashboard]);

  const signOut = async () => {
    try { await logout(); } catch { setCsrfToken(''); }
    setAdmin(null); setAuthError('');
  };

  if (checking) return <main className="grid min-h-screen place-items-center bg-ink text-muted"><p className="flex items-center gap-3"><Loader2 className="animate-spin" /> Session check ho raha hai…</p></main>;
  if (!admin) return <Login initialError={authError} onLoggedIn={(value) => { setAdmin(value); setAuthError(''); }} />;

  const section = sections.find((item) => item.id === active);
  return (
    <div className="min-h-screen bg-ink text-fg">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-xl"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6"><a href={HOME_PATH} className="font-display text-lg font-extrabold">shubham<span className="text-lime">.dev</span><span className="ml-3 hidden text-xs font-normal uppercase tracking-[0.2em] text-muted sm:inline">Admin</span></a><div className="flex items-center gap-3"><span className="hidden text-xs text-muted sm:inline">{admin.email}</span><button type="button" onClick={signOut} className="btn btn-ghost !px-3 !py-2"><LogOut size={16} /> Sign out</button></div></div></header>
      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:py-8">
        <aside className={`${cardClass} h-fit p-2 lg:sticky lg:top-24`}><nav aria-label="Admin sections" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
          <button type="button" onClick={() => setActive('dashboard')} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${active === 'dashboard' ? 'bg-lime text-ink' : 'text-muted hover:bg-ink hover:text-fg'}`}><LayoutDashboard size={17} /> Dashboard</button>
          {sections.map((item) => <button key={item.id} type="button" onClick={() => setActive(item.id)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${active === item.id ? 'bg-lime text-ink' : 'text-muted hover:bg-ink hover:text-fg'}`}>{item.label}</button>)}
          <button type="button" onClick={() => setActive('messages')} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${active === 'messages' ? 'bg-lime text-ink' : 'text-muted hover:bg-ink hover:text-fg'}`}><Mail size={17} /> Contact inbox</button>
          <button type="button" onClick={() => setActive('account')} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${active === 'account' ? 'bg-lime text-ink' : 'text-muted hover:bg-ink hover:text-fg'}`}><ShieldCheck size={17} /> Account</button>
        </nav></aside>
        <main className="min-w-0 space-y-5">
          {authError && <p role="alert" className="rounded-xl border border-[#ff7a7a]/50 bg-[#ff7a7a]/5 p-3 text-sm text-[#ffaaaa]">{authError}</p>}
          {active === 'dashboard' && <Dashboard data={dashboard} loading={dashLoading} onOpenMessages={() => setActive('messages')} />}
          {section && <SectionEditor key={section.id} section={section} refreshPublic={refreshPortfolio} />}
          {active === 'messages' && <Messages refreshDashboard={refreshDashboard} />}
          {active === 'account' && <Account onPasswordChanged={() => { setAdmin(null); setActive('dashboard'); }} />}
          <footer className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs text-muted"><span>Portfolio CMS · changes save to MongoDB</span><a href={HOME_PATH} className="underline underline-offset-4 hover:text-lime">View public site</a></footer>
        </main>
      </div>
    </div>
  );
}
