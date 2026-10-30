import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { axiosClient } from '../services/axiosClient';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { TextArea } from '../components/ui/TextArea';
import { useToast } from '../context/ToastContext';

const emptyPage = () => ({ name: 'New page', slug: 'new-page', isHome: false, published: true, seoTitle: '', seoDesc: '', content: { sections: [{ heading: 'Welcome', text: 'Share your story.' }] } });
const blankField = () => ({ key: 'title', label: 'Title', type: 'TEXT', required: true });

export function BuilderPage({ area }) {
  const [params, setParams] = useSearchParams();
  const id = params.get('website');
  const [sites, setSites] = useState([]);
  const [site, setSite] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(null);
  const [settings, setSettings] = useState(null);
  const [definition, setDefinition] = useState({ name: '', key: '', fields: [blankField()] });
  const [record, setRecord] = useState({});
  const [recordId, setRecordId] = useState('');
  const [recordPublished, setRecordPublished] = useState(true);
  const [collectionId, setCollectionId] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [exportType, setExportType] = useState('FULLSTACK');
  const { showToast } = useToast();
  const base = `/builder/websites/${id}`;

  useEffect(() => {
    let active = true;
    Promise.all([axiosClient.get('/websites', { params: { pageSize: 100 } }), axiosClient.get('/builder/templates')])
      .then(([a, b]) => { if (active) { setSites(a.data.data); setTemplates(b.data.data); } })
      .catch(e => active && setError(e.response?.data?.message || 'Unable to load websites'));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setSite(null); setPage(null); setSettings(null); setPreview(''); setError('');
    if (!id) return;
    setLoading(true);
    axiosClient.get(`/builder/websites/${id}/workspace`).then(({ data }) => {
      if (!active) return;
      setSite(data.data); setPage(data.data.pages[0] || emptyPage()); setSettings(data.data.settings);
    }).catch(e => active && setError(e.response?.data?.message || 'Unable to load website')).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const reload = async () => { const { data } = await axiosClient.get(`${base}/workspace`); setSite(data.data); return data.data; };
  const run = async (task, message = 'Saved successfully') => {
    setBusy(true); setError('');
    try { await task(); await reload(); showToast(message, 'success'); }
    catch (e) { setError(e.response?.data?.message || e.message || 'Unable to save'); }
    finally { setBusy(false); }
  };
  const remove = (url, label) => { if (window.confirm(`Delete ${label}? This cannot be undone.`)) run(() => axiosClient.delete(url), 'Deleted'); };
  const sectionChange = (index, changes) => setPage(p => ({ ...p, content: { sections: p.content.sections.map((s, i) => i === index ? { ...s, ...changes } : s) } }));
  const collection = site?.collections.find(c => c.id === collectionId) || site?.collections[0];
  const titles = { templates: 'Templates', editor: 'Website Editor', cms: 'CMS Manager', media: 'Media Library', forms: 'Forms & Submissions', settings: 'Website Settings', export: 'Export & Download' };

  const definitionForm = (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); run(async () => { await axiosClient[definition.id ? 'put' : 'post'](`${base}/${area === 'cms' ? 'collections' : 'forms'}${definition.id ? `/${definition.id}` : ''}`, definition); setDefinition({ name: '', key: '', fields: [blankField()] }); }); }}>
      <h3 className="text-lg font-semibold">{definition.id ? 'Edit' : 'Create'} {area === 'cms' ? 'collection' : 'form'}</h3>
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Name" value={definition.name} required onChange={e => setDefinition({ ...definition, name: e.target.value })} /><Input label="Key (lowercase letters and hyphens)" value={definition.key} required pattern="[a-z][a-z0-9-]*" onChange={e => setDefinition({ ...definition, key: e.target.value })} /></div>
      {definition.fields.map((f, i) => <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-4">
        <Input label="Field key" value={f.key} required onChange={e => setDefinition({ ...definition, fields: definition.fields.map((x, j) => j === i ? { ...x, key: e.target.value } : x) })} />
        <Input label="Label" value={f.label} required onChange={e => setDefinition({ ...definition, fields: definition.fields.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
        <label className="grid gap-1 text-sm">Type<select className="rounded border bg-transparent p-2" value={f.type} onChange={e => setDefinition({ ...definition, fields: definition.fields.map((x, j) => j === i ? { ...x, type: e.target.value } : x) })}>{(area === 'forms' ? ['TEXT', 'EMAIL'] : ['TEXT', 'LONG_TEXT', 'EMAIL', 'URL', 'NUMBER', 'BOOLEAN', 'DATE']).map(t => <option key={t}>{t}</option>)}</select></label>
        <div className="flex items-center gap-2"><label><input type="checkbox" checked={f.required} onChange={e => setDefinition({ ...definition, fields: definition.fields.map((x, j) => j === i ? { ...x, required: e.target.checked } : x) })} /> Required</label><Button type="button" variant="ghost" disabled={definition.fields.length === 1} onClick={() => setDefinition({ ...definition, fields: definition.fields.filter((_, j) => i !== j) })}>Remove</Button></div>
      </div>)}
      <div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => setDefinition({ ...definition, fields: [...definition.fields, { ...blankField(), key: `field-${definition.fields.length + 1}`, label: 'New field' }] })}>Add field</Button><Button loading={busy}>{definition.id ? 'Save changes' : 'Create'}</Button>{definition.id && <Button type="button" variant="secondary" onClick={() => setDefinition({ name: '', key: '', fields: [blankField()] })}>Cancel edit</Button>}</div>
    </form>
  );

  return <div className="space-y-6 text-slate-900 dark:text-slate-100">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-bold">{titles[area]}</h1><label className="flex items-center gap-3 text-sm">Website<select aria-label="Website" className="max-w-xs rounded-lg border bg-white p-2 text-slate-900 dark:bg-slate-900 dark:text-white" value={id || ''} onChange={e => setParams(e.target.value ? { website: e.target.value } : {})}><option value="">Select a website</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    {!id && <Card className="p-8"><p>Select a website above to start.</p><Link className="text-brand-600 underline" to="/websites/new">Create a website</Link></Card>}
    {loading && <p role="status">Loading website...</p>}
    {site && <>
      <div className="flex flex-wrap gap-3 text-sm">{Object.entries(titles).map(([key, title]) => <Link key={key} className={key === area ? 'font-bold text-brand-600' : 'text-slate-500 hover:underline'} to={`/${key}?website=${id}`}>{title}</Link>)}<a className="text-brand-600 underline" target="_blank" rel="noreferrer" href={`${axiosClient.defaults.baseURL.replace(/\/api\/?$/, '')}/sites/${site.slug}`}>View published website</a></div>
      {area === 'templates' && <div className="grid gap-4 md:grid-cols-3">{templates.map(t => <Card className="space-y-4 p-6" key={t.key}><div className="rounded-lg bg-gradient-to-br from-blue-600 to-slate-900 p-6 text-white"><p className="text-xs uppercase tracking-widest">{t.category}</p><h2 className="my-6 text-2xl font-bold">{t.heading}</h2><p>{t.text}</p></div><h3 className="font-semibold">{t.name}</h3><Button disabled={busy || site.pages.length > 0} onClick={() => run(() => axiosClient.post(`${base}/templates`, { key: t.key }), 'Template applied. Open the editor to customize it.')}>Apply template</Button>{site.pages.length > 0 && <p className="text-xs text-slate-500">Templates require an empty website to preserve your existing pages.</p>}</Card>)}</div>}
      {area === 'editor' && page && <div className="space-y-4">
        <div className="flex flex-wrap gap-2">{site.pages.map(p => <Button key={p.id} variant={page.id === p.id ? 'primary' : 'secondary'} onClick={() => { setPage(p); setPreview(''); }}>{p.name}</Button>)}<Button variant="secondary" onClick={() => { setPage(emptyPage()); setPreview(''); }}>New page</Button></div>
        <Card className="p-6"><form className="space-y-4" onSubmit={e => { e.preventDefault(); run(async () => { const { data } = await axiosClient[page.id ? 'put' : 'post'](`${base}/pages${page.id ? `/${page.id}` : ''}`, page); setPage(data.data); }, 'Page saved'); }}>
          <div className="grid gap-4 sm:grid-cols-2"><Input label="Page name" required value={page.name} onChange={e => setPage({ ...page, name: e.target.value })} /><Input label="Page slug" required pattern="[a-z][a-z0-9-]*" value={page.slug} onChange={e => setPage({ ...page, slug: e.target.value })} /><Input label="SEO title" value={page.seoTitle || ''} onChange={e => setPage({ ...page, seoTitle: e.target.value })} /><Input label="SEO description" value={page.seoDesc || ''} onChange={e => setPage({ ...page, seoDesc: e.target.value })} /></div>
          <div className="flex gap-5"><label><input type="checkbox" checked={page.isHome} onChange={e => setPage({ ...page, isHome: e.target.checked })} /> Home page</label><label><input type="checkbox" checked={page.published} onChange={e => setPage({ ...page, published: e.target.checked })} /> Include in published website</label></div>
          {page.content.sections.map((s, i) => <div key={i} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap items-center gap-2"><strong className="mr-auto">Section {i + 1}</strong><Button type="button" size="sm" variant="ghost" disabled={i === 0} onClick={() => { const sections = [...page.content.sections]; [sections[i - 1], sections[i]] = [sections[i], sections[i - 1]]; setPage({ ...page, content: { sections } }); }}>Move up</Button><Button type="button" size="sm" variant="danger" onClick={() => setPage({ ...page, content: { sections: page.content.sections.filter((_, j) => j !== i) } })}>Remove</Button></div><Input label="Heading" value={s.heading || ''} onChange={e => sectionChange(i, { heading: e.target.value })} /><TextArea label="Text" rows={4} value={s.text || ''} onChange={e => sectionChange(i, { text: e.target.value })} /><Input label="Image URL (upload in Media Library, then copy URL)" value={s.imageUrl || ''} onChange={e => sectionChange(i, { imageUrl: e.target.value })} /><div className="grid gap-3 sm:grid-cols-2"><Input label="Button text" value={s.buttonText || ''} onChange={e => sectionChange(i, { buttonText: e.target.value })} /><Input label="Button URL" value={s.buttonUrl || ''} onChange={e => sectionChange(i, { buttonUrl: e.target.value })} /></div></div>)}
          <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => setPage({ ...page, content: { sections: [...page.content.sections, { heading: 'New section', text: '' }] } })}>Add section</Button><Button loading={busy}>Save page</Button>{page.id && <><Button type="button" variant="secondary" disabled={busy} onClick={() => run(async () => { const { data } = await axiosClient.get(`${base}/preview/${page.id}`); setPreview(data); }, 'Preview loaded from saved page')}>Preview saved page</Button><Button type="button" variant="danger" disabled={busy} onClick={() => { if (window.confirm('Delete this page?')) run(async () => { await axiosClient.delete(`${base}/pages/${page.id}`); const updated = await reload(); setPage(updated.pages[0] || emptyPage()); }); }}>Delete page</Button></>}</div>
        </form></Card>
        {preview && <iframe title="Website preview" sandbox="" srcDoc={preview} className="h-[650px] w-full rounded-xl border bg-white" />}
      </div>}
      {area === 'settings' && settings && <Card className="p-6"><form className="max-w-xl space-y-4" onSubmit={e => { e.preventDefault(); run(() => axiosClient.put(`${base}/settings`, { primaryColor: settings.primaryColor, secondaryColor: settings.secondaryColor, fontFamily: settings.fontFamily, seo: { title: settings.seo?.title || '', description: settings.seo?.description || '' }, contact: { email: settings.contact?.email || '', phone: settings.contact?.phone || '' } })); }}><Input label="Primary color" type="color" value={settings.primaryColor} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} /><Input label="Secondary color" type="color" value={settings.secondaryColor} onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })} /><label className="grid gap-2">Font<select className="rounded border bg-transparent p-2" value={settings.fontFamily} onChange={e => setSettings({ ...settings, fontFamily: e.target.value })}>{['Inter', 'Georgia', 'Arial', 'Verdana'].map(f => <option key={f}>{f}</option>)}</select></label><Input label="Default SEO title" value={settings.seo?.title || ''} onChange={e => setSettings({ ...settings, seo: { ...settings.seo, title: e.target.value } })} /><TextArea label="Default description" value={settings.seo?.description || ''} onChange={e => setSettings({ ...settings, seo: { ...settings.seo, description: e.target.value } })} /><Input label="Contact email" type="email" value={settings.contact?.email || ''} onChange={e => setSettings({ ...settings, contact: { ...settings.contact, email: e.target.value } })} /><Input label="Phone" value={settings.contact?.phone || ''} onChange={e => setSettings({ ...settings, contact: { ...settings.contact, phone: e.target.value } })} /><Button loading={busy}>Save settings</Button></form></Card>}
      {area === 'media' && <><Card className="space-y-3 p-6"><h2 className="font-semibold">Upload an image</h2><p className="text-sm text-slate-500">PNG, JPEG, or WebP, up to 5 MB.</p><input aria-label="Upload image" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { const file = e.target.files[0]; if (file) run(() => { const form = new FormData(); form.append('file', file); return axiosClient.post(`${base}/media`, form); }, 'Image uploaded'); e.target.value = ''; }} /></Card><div className="grid gap-4 sm:grid-cols-3">{site.media.map(m => { const url = `${axiosClient.defaults.baseURL.replace(/\/api\/?$/, '')}${m.url}`; return <Card key={m.id} className="space-y-3 overflow-hidden p-4"><img src={url} alt="Uploaded website asset" className="h-40 w-full rounded object-cover" /><p className="text-xs">{Math.ceil(m.size / 1024)} KB</p><div className="flex gap-2"><Button variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(new URL(url, window.location.origin).href); showToast('Image URL copied', 'success'); } catch { showToast('Unable to access clipboard', 'error'); } }}>Copy URL</Button><Button variant="danger" disabled={busy} onClick={() => remove(`${base}/media/${m.id}`, 'image')}>Delete</Button></div></Card>; })}</div>{!site.media.length && <p>No images uploaded yet.</p>}</>}
      {area === 'cms' && <><Card className="p-6">{definitionForm}</Card>{site.collections.length > 0 ? <Card className="space-y-5 p-6"><label>Collection <select className="rounded border bg-transparent p-2" value={collection?.id || ''} onChange={e => { setCollectionId(e.target.value); setRecord({}); setRecordId(''); }}>{site.collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><form className="space-y-3" onSubmit={e => { e.preventDefault(); run(async () => { await axiosClient[recordId ? 'put' : 'post'](`${base}/collections/${collection.id}/records${recordId ? `/${recordId}` : ''}`, { data: record, published: recordPublished }); setRecord({}); setRecordId(''); setRecordPublished(true); }, 'Record added'); }}>{collection?.fields.map(f => f.type === 'BOOLEAN' ? <label key={f.key} className="block"><input type="checkbox" checked={record[f.key] || false} onChange={e => setRecord({ ...record, [f.key]: e.target.checked })} /> {f.label}</label> : <Input key={f.key} label={f.label} type={{ NUMBER: 'number', EMAIL: 'email', URL: 'url', DATE: 'date' }[f.type] || 'text'} required={f.required} value={record[f.key] ?? ''} onChange={e => setRecord({ ...record, [f.key]: e.target.value })} />)}<label className="block"><input type="checkbox" checked={recordPublished} onChange={e => setRecordPublished(e.target.checked)} /> Published</label><Button loading={busy}>{recordId ? 'Save record' : 'Add record'}</Button>{recordId && <Button type="button" variant="secondary" onClick={() => { setRecord({}); setRecordId(''); }}>Cancel edit</Button>}</form>{collection?.records.map(r => <div key={r.id} className="flex items-center justify-between gap-3 rounded border p-3"><dl className="min-w-0 text-sm">{collection.fields.map(f => <div key={f.key} className="break-words"><dt className="inline font-semibold">{f.label}: </dt><dd className="inline">{String(r.data[f.key] ?? '')}</dd></div>)}</dl><Button variant="secondary" size="sm" onClick={() => { setRecord(r.data); setRecordId(r.id); setRecordPublished(r.published); }}>Edit</Button><Button variant="danger" size="sm" disabled={busy} onClick={() => remove(`${base}/collections/${collection.id}/records/${r.id}`, 'record')}>Delete</Button></div>)}<Button variant="secondary" onClick={() => setDefinition({ id: collection.id, name: collection.name, key: collection.key, fields: collection.fields })}>Edit collection</Button><Button variant="danger" disabled={busy} onClick={() => remove(`${base}/collections/${collection.id}`, 'collection and its records')}>Delete collection</Button></Card> : <p>No collections yet.</p>}</>}
      {area === 'forms' && <><Card className="p-6">{definitionForm}</Card>{site.forms.map(f => <Card key={f.id} className="space-y-4 p-6"><div className="flex justify-between gap-3"><div><h2 className="text-lg font-semibold">{f.name}</h2><p className="text-sm text-slate-500">Included on every published page. Showing the latest 100 submissions.</p></div><Button variant="secondary" onClick={() => setDefinition({ id: f.id, name: f.name, key: f.key, fields: f.fields })}>Edit form</Button><Button variant="danger" disabled={busy} onClick={() => remove(`${base}/forms/${f.id}`, 'form and submissions')}>Delete</Button></div>{f.submissions.length ? f.submissions.map(s => <div key={s.id} className="rounded border p-3"><time className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleString()}</time>{f.fields.map(field => <p key={field.key} className="break-words text-sm"><strong>{field.label}: </strong>{String(s.data[field.key] ?? '')}</p>)}</div>) : <p className="text-sm">No submissions yet. Publish the website and submit its form to test it.</p>}</Card>)}</>}
      {area === 'export' && <Card className="space-y-5 p-6"><h2 className="text-lg font-semibold">Download your website</h2><p>Export your website with an independent Node.js server, forms, images, and editable content. Static frontend exports submit forms to this platform.</p><label className="block">Export type <select className="rounded border bg-transparent p-2" value={exportType} onChange={e => setExportType(e.target.value)}><option value="FULLSTACK">Fullstack ? independent website and server</option><option value="FRONTEND">Frontend ? static HTML</option><option value="BACKEND">Backend ? server and project data</option></select></label><Button loading={busy} disabled={!site.pages.length} onClick={() => run(async () => { const response = await axiosClient.get(`${base}/export`, { params: { type: exportType }, responseType: 'blob' }); const url = URL.createObjectURL(response.data); const a = document.createElement('a'); a.href = url; a.download = `${site.slug}.zip`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }, 'Website downloaded')}>Download website ZIP</Button>{!site.pages.length && <p>Add a template or page first.</p>}<h3 className="font-semibold">Export history</h3>{site.exportJobs.map(j => <p key={j.id} className="text-sm">{new Date(j.createdAt).toLocaleString()} — {j.type} — {j.status}</p>)}</Card>}
    </>}
  </div>;
}
