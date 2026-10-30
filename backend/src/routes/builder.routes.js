import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import archiver from 'archiver';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler as wrap } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { templates, renderWebsite } from '../services/render.service.js';
import { exportedServer } from '../services/export.service.js';

export const uploadDir = fileURLToPath(new URL('../../uploads/', import.meta.url));
export const builderRoutes = Router();
export const publicRoutes = Router();
const name = z.string().trim().min(1).max(120);
const key = z.string().regex(/^[a-z][a-z0-9-]{0,79}$/);
const section = z.object({ heading: z.string().max(200).default(''), text: z.string().max(10000).default(''), imageUrl: z.string().max(2000).default(''), buttonText: z.string().max(100).default(''), buttonUrl: z.string().max(2000).default('') });
const pageSchema = z.object({ name, slug: key, isHome: z.boolean().default(false), published: z.boolean().default(true), seoTitle: z.string().max(200).nullable().optional(), seoDesc: z.string().max(500).nullable().optional(), content: z.object({ sections: z.array(section).max(100) }), order: z.number().int().min(0).default(0) });
const field = z.object({ key, label: name, type: z.enum(['TEXT', 'LONG_TEXT', 'NUMBER', 'BOOLEAN', 'EMAIL', 'URL', 'DATE']).default('TEXT'), required: z.boolean().default(false) });
const parse = (schema, value) => { const r = schema.safeParse(value); if (!r.success) throw ApiError.badRequest(r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')); return r.data; };
const include = { settings: true, pages: { orderBy: { order: 'asc' } }, collections: { include: { fields: true, records: { orderBy: { createdAt: 'desc' } } } }, forms: { include: { submissions: { orderBy: { createdAt: 'desc' }, take: 100 } } }, media: true, exportJobs: { orderBy: { createdAt: 'desc' }, take: 20 } };
builderRoutes.use(requireAuth);
builderRoutes.get('/templates', (_req, res) => res.json({ success: true, data: templates }));
builderRoutes.use('/websites/:id', wrap(async (req, _res, next) => {
  const site = await prisma.websiteProject.findUnique({ where: { id: req.params.id } });
  if (!site) throw ApiError.notFound('Website not found');
  if (site.ownerId !== req.user.id) throw ApiError.forbidden('Access denied');
  req.site = site;
  next();
}));
builderRoutes.get('/websites/:id/workspace', wrap(async (req, res) => res.json({ success: true, data: await prisma.websiteProject.findUnique({ where: { id: req.site.id }, include }) })));
builderRoutes.post('/websites/:id/templates', wrap(async (req, res) => {
  const template = templates.find(t => t.key === req.body.key);
  if (!template) throw ApiError.badRequest('Unknown template');
  const existing = await prisma.websitePage.count({ where: { websiteId: req.site.id } });
  if (existing) throw ApiError.conflict('Templates can only be applied to an empty website. Remove existing pages first.');
  await prisma.websiteProject.update({ where: { id: req.site.id }, data: { templateKey: template.key, pages: { create: { name: 'Home', slug: 'home', isHome: true, published: true, content: { sections: [{ heading: req.site.brandName || template.heading, text: req.site.description || template.text }, { heading: 'About us', text: 'Tell your visitors your story.' }] } } } } });
  res.json({ success: true });
}));
builderRoutes.post('/websites/:id/pages', wrap(async (req, res) => {
  const data = parse(pageSchema, req.body);
  const result = await prisma.$transaction(async tx => {
    if (data.isHome) await tx.websitePage.updateMany({ where: { websiteId: req.site.id }, data: { isHome: false } });
    return tx.websitePage.create({ data: { ...data, websiteId: req.site.id } });
  });
  res.status(201).json({ success: true, data: result });
}));
builderRoutes.put('/websites/:id/pages/:pageId', wrap(async (req, res) => {
  const data = parse(pageSchema, req.body);
  const page = await prisma.websitePage.findFirst({ where: { id: req.params.pageId, websiteId: req.site.id } });
  if (!page) throw ApiError.notFound('Page not found');
  const result = await prisma.$transaction(async tx => {
    await tx.pageVersion.create({ data: { pageId: page.id, content: page.content } });
    if (data.isHome) await tx.websitePage.updateMany({ where: { websiteId: req.site.id }, data: { isHome: false } });
    return tx.websitePage.update({ where: { id: page.id }, data });
  });
  res.json({ success: true, data: result });
}));
builderRoutes.delete('/websites/:id/pages/:pageId', wrap(async (req, res) => {
  await prisma.websitePage.deleteMany({ where: { id: req.params.pageId, websiteId: req.site.id } });
  res.sendStatus(204);
}));
builderRoutes.put('/websites/:id/settings', wrap(async (req, res) => {
  const data = parse(z.object({ primaryColor: z.string().regex(/^#[a-f0-9]{6}$/i), secondaryColor: z.string().regex(/^#[a-f0-9]{6}$/i), fontFamily: name, seo: z.object({ title: z.string().max(200), description: z.string().max(500) }).optional(), contact: z.object({ email: z.union([z.string().email(), z.literal('')]), phone: z.string().max(60) }).optional() }), req.body);
  res.json({ success: true, data: await prisma.websiteSettings.upsert({ where: { websiteId: req.site.id }, create: { ...data, websiteId: req.site.id }, update: data }) });
}));
builderRoutes.post('/websites/:id/collections', wrap(async (req, res) => {
  const data = parse(z.object({ name, key, fields: z.array(field).min(1).max(30) }), req.body);
  if (new Set(data.fields.map(f => f.key)).size !== data.fields.length) throw ApiError.badRequest('Field keys must be unique');
  res.status(201).json({ success: true, data: await prisma.cMSCollection.create({ data: { ...data, websiteId: req.site.id, fields: { create: data.fields } } }) });
}));
builderRoutes.put('/websites/:id/collections/:collectionId', wrap(async (req, res) => {
  const data = parse(z.object({ name, key, fields: z.array(field).min(1).max(30) }), req.body);
  if (new Set(data.fields.map(f => f.key)).size !== data.fields.length) throw ApiError.badRequest('Field keys must be unique');
  const existing = await prisma.cMSCollection.findFirst({ where: { id: req.params.collectionId, websiteId: req.site.id } });
  if (!existing) throw ApiError.notFound('Collection not found');
  res.json({ success: true, data: await prisma.cMSCollection.update({ where: { id: existing.id }, data: { name: data.name, key: data.key, fields: { deleteMany: {}, create: data.fields } } }) });
}));
function validateData(fields, data) {
  const shape = Object.fromEntries(fields.map(f => {
    let rule = f.type === 'NUMBER' ? z.coerce.number().finite() : f.type === 'BOOLEAN' ? z.boolean() : f.type === 'EMAIL' ? z.string().email() : f.type === 'URL' ? z.string().url() : z.string().max(10000);
    if (f.required && ['TEXT', 'LONG_TEXT', 'DATE'].includes(f.type)) rule = rule.min(1);
    if (!f.required) rule = z.union([rule.optional(), z.literal('')]);
    return [f.key, rule];
  }));
  return parse(z.object(shape), data);
}
builderRoutes.post('/websites/:id/collections/:collectionId/records', wrap(async (req, res) => {
  const collection = await prisma.cMSCollection.findFirst({ where: { id: req.params.collectionId, websiteId: req.site.id }, include: { fields: true } });
  if (!collection) throw ApiError.notFound('Collection not found');
  const data = validateData(collection.fields, req.body.data);
  res.status(201).json({ success: true, data: await prisma.cMSRecord.create({ data: { collectionId: collection.id, data, published: req.body.published === true } }) });
}));
builderRoutes.put('/websites/:id/collections/:collectionId/records/:recordId', wrap(async (req, res) => {
  const collection = await prisma.cMSCollection.findFirst({ where: { id: req.params.collectionId, websiteId: req.site.id }, include: { fields: true } });
  if (!collection) throw ApiError.notFound('Collection not found');
  const existing = await prisma.cMSRecord.findFirst({ where: { id: req.params.recordId, collectionId: collection.id } });
  if (!existing) throw ApiError.notFound('Record not found');
  const data = validateData(collection.fields, req.body.data);
  res.json({ success: true, data: await prisma.cMSRecord.update({ where: { id: existing.id }, data: { data, published: req.body.published === true } }) });
}));
builderRoutes.delete('/websites/:id/collections/:collectionId/records/:recordId', wrap(async (req, res) => {
  await prisma.cMSRecord.deleteMany({ where: { id: req.params.recordId, collectionId: req.params.collectionId, collection: { websiteId: req.site.id } } }); res.sendStatus(204);
}));
builderRoutes.delete('/websites/:id/collections/:collectionId', wrap(async (req, res) => {
  await prisma.cMSCollection.deleteMany({ where: { id: req.params.collectionId, websiteId: req.site.id } }); res.sendStatus(204);
}));
builderRoutes.post('/websites/:id/forms', wrap(async (req, res) => {
  const data = parse(z.object({ name, key, fields: z.array(field).min(1).max(30) }), req.body);
  if (new Set(data.fields.map(f => f.key)).size !== data.fields.length) throw ApiError.badRequest('Field keys must be unique');
  res.status(201).json({ success: true, data: await prisma.formDefinition.create({ data: { ...data, websiteId: req.site.id } }) });
}));
builderRoutes.put('/websites/:id/forms/:formId', wrap(async (req, res) => {
  const data = parse(z.object({ name, key, fields: z.array(field).min(1).max(30) }), req.body);
  if (new Set(data.fields.map(f => f.key)).size !== data.fields.length) throw ApiError.badRequest('Field keys must be unique');
  const existing = await prisma.formDefinition.findFirst({ where: { id: req.params.formId, websiteId: req.site.id } });
  if (!existing) throw ApiError.notFound('Form not found');
  res.json({ success: true, data: await prisma.formDefinition.update({ where: { id: existing.id }, data }) });
}));
builderRoutes.delete('/websites/:id/forms/:formId', wrap(async (req, res) => {
  await prisma.formDefinition.deleteMany({ where: { id: req.params.formId, websiteId: req.site.id } }); res.sendStatus(204);
}));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
builderRoutes.post('/websites/:id/media', upload.single('file'), wrap(async (req, res) => {
  const file = req.file;
  const bytes = file?.buffer;
  const ext = bytes?.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png' : bytes?.[0] === 255 && bytes?.[1] === 216 && bytes?.[2] === 255 ? 'jpg' : bytes?.subarray(0, 4).toString() === 'RIFF' && bytes?.subarray(8, 12).toString() === 'WEBP' ? 'webp' : null;
  if (!ext) throw ApiError.badRequest('Upload a PNG, JPEG, or WebP image (maximum 5 MB)');
  await mkdir(uploadDir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(uploadDir, filename), bytes);
  try {
    res.status(201).json({ success: true, data: await prisma.mediaAsset.create({ data: { websiteId: req.site.id, url: `/uploads/${filename}`, mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, size: file.size } }) });
  } catch (error) { await unlink(path.join(uploadDir, filename)); throw error; }
}));
builderRoutes.delete('/websites/:id/media/:mediaId', wrap(async (req, res) => {
  const asset = await prisma.mediaAsset.findFirst({ where: { id: req.params.mediaId, websiteId: req.site.id } });
  if (!asset) throw ApiError.notFound('Image not found');
  await prisma.mediaAsset.delete({ where: { id: asset.id } });
  await unlink(path.join(uploadDir, path.basename(asset.url))).catch(() => {});
  res.sendStatus(204);
}));
builderRoutes.get('/websites/:id/preview/:pageId', wrap(async (req, res) => {
  const site = await prisma.websiteProject.findUnique({ where: { id: req.site.id }, include });
  const page = site.pages.find(p => p.id === req.params.pageId);
  if (!page) throw ApiError.notFound('Page not found');
  res.type('html').send(renderWebsite(site, page));
}));
builderRoutes.get('/websites/:id/export', wrap(async (req, res, next) => {
  const site = await prisma.websiteProject.findUnique({ where: { id: req.site.id }, include });
  if (!site.pages.length) throw ApiError.badRequest('Add at least one page before exporting');
  const type = parse(z.enum(['FRONTEND', 'BACKEND', 'FULLSTACK']), req.query.type || 'FRONTEND');
  const standalone = type !== 'FRONTEND';
  const job = await prisma.exportJob.create({ data: { websiteId: site.id, type, status: 'RUNNING' } });
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', error => { prisma.exportJob.update({ where: { id: job.id }, data: { status: 'FAILED', errorLog: error.message } }).catch(() => {}); if (!res.headersSent) next(error); else res.destroy(error); });
  res.attachment(`${site.slug}.zip`);
  archive.pipe(res);
  const exportedSite = JSON.parse(JSON.stringify(site));
  for (const form of exportedSite.forms) delete form.submissions;
  delete exportedSite.exportJobs;
  for (const page of exportedSite.pages) for (const section of page.content.sections || []) {
    const asset = site.media.find(a => section.imageUrl?.endsWith(a.url));
    if (asset) section.imageUrl = standalone ? `/assets/${path.basename(asset.url)}` : `assets/${path.basename(asset.url)}`;
  }
  for (const page of exportedSite.pages) {
    let html = renderWebsite(exportedSite, page, { base: standalone ? '' : '.', apiBase: standalone ? '' : `${req.protocol}://${req.get('host')}` });
    for (const p of site.pages) html = html.replaceAll(`href="./${p.isHome ? '' : p.slug}"`, `href="${p.isHome ? 'index' : p.slug}.html"`);
    if (type !== 'BACKEND') archive.append(html, { name: `${standalone ? 'public/' : ''}${page.isHome ? 'index' : page.slug}.html` });
  }
  for (const asset of site.media) { try { archive.append(await readFile(path.join(uploadDir, path.basename(asset.url))), { name: `${standalone ? 'public/' : ''}assets/${path.basename(asset.url)}` }); } catch { /* Missing images can be replaced from project data. */ } }
  archive.append(JSON.stringify(exportedSite, null, 2), { name: 'project.json' });
  if (standalone) {
    archive.append(exportedServer, { name: 'server.js' });
    archive.append(await readFile(new URL('../services/render.service.js', import.meta.url)), { name: 'render.js' });
    archive.append(JSON.stringify({ name: site.slug, private: true, type: 'module', scripts: { start: 'node server.js' }, engines: { node: '>=22.12.0' } }, null, 2), { name: 'package.json' });
    archive.append('Run npm start with Node.js 22.12+. No dependencies or platform connection are required. PORT defaults to 3000. Edit project.json to update content. Form submissions persist in data/submissions.jsonl; back it up. Put a reverse proxy in front of localhost:3000 for hosting. The backend renders pages dynamically; fullstack exports also include pre-rendered HTML in public/.\n', { name: 'README.txt' });
  } else archive.append('Serve these files using any static web host. Forms submit to the original platform API and require the source website to remain published. project.json contains your editable content.\n', { name: 'README.txt' });
  await archive.finalize();
  await prisma.exportJob.update({ where: { id: job.id }, data: { status: 'SUCCESS', completedAt: new Date() } });
}));
publicRoutes.get('/sites/:slug/:page?', wrap(async (req, res) => {
  const site = await prisma.websiteProject.findFirst({ where: { slug: req.params.slug, status: 'PUBLISHED' }, include: { ...include, forms: true, collections: { include: { fields: true, records: { where: { published: true } } } } } });
  if (!site) throw ApiError.notFound('Published website not found');
  const page = site.pages.find(p => p.published && (req.params.page ? p.slug === req.params.page : p.isHome));
  if (!page) throw ApiError.notFound('Published page not found');
  res.type('html').send(renderWebsite(site, page));
}));
publicRoutes.post('/api/public/forms/:formId/submissions', wrap(async (req, res) => {
  const form = await prisma.formDefinition.findFirst({ where: { id: req.params.formId, website: { status: 'PUBLISHED' } } });
  if (!form) throw ApiError.notFound('Form not found');
  const data = validateData(form.fields, req.body);
  await prisma.formSubmission.create({ data: { formId: form.id, data } });
  if (req.is('application/x-www-form-urlencoded')) return res.type('html').send('<!doctype html><title>Thank you</title><h1>Thank you!</h1><p>Your submission has been received.</p>');
  res.status(201).json({ success: true, message: 'Submission received' });
}));
