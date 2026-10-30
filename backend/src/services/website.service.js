import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slug.js';

async function generateUniqueSlug(baseName, explicitSlug) {
  const base = slugify(explicitSlug || baseName) || 'website';
  let candidate = base;
  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.websiteProject.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

export async function createWebsite(ownerId, payload) {
  const slug = await generateUniqueSlug(payload.name, payload.slug);

  return prisma.websiteProject.create({
    data: {
      ownerId,
      name: payload.name,
      slug,
      category: payload.category,
      description: payload.description ?? null,
      brandName: payload.brandName ?? null,
      templateKey: payload.templateKey ?? null,
      settings: {
        create: {},
      },
    },
    include: { settings: true },
  });
}

export async function listWebsites(ownerId, { page, pageSize, search, status }) {
  const where = {
    ownerId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.websiteProject.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { pages: true } } },
    }),
    prisma.websiteProject.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

async function findOwnedWebsiteOrThrow(ownerId, websiteId) {
  const website = await prisma.websiteProject.findUnique({ where: { id: websiteId } });
  if (!website) {
    throw ApiError.notFound('Website project not found');
  }
  if (website.ownerId !== ownerId) {
    throw ApiError.forbidden('You do not have access to this website project');
  }
  return website;
}

export async function getWebsiteById(ownerId, websiteId) {
  const website = await findOwnedWebsiteOrThrow(ownerId, websiteId);
  return prisma.websiteProject.findUnique({
    where: { id: website.id },
    include: {
      settings: true,
      pages: { orderBy: { order: 'asc' } },
      _count: { select: { pages: true, collections: true, forms: true } },
    },
  });
}

export async function updateWebsite(ownerId, websiteId, payload) {
  await findOwnedWebsiteOrThrow(ownerId, websiteId);
  return prisma.websiteProject.update({
    where: { id: websiteId },
    data: payload,
  });
}

export async function deleteWebsite(ownerId, websiteId) {
  await findOwnedWebsiteOrThrow(ownerId, websiteId);
  await prisma.websiteProject.delete({ where: { id: websiteId } });
}

export async function getDashboardStats(ownerId) {
  const [total, draft, published, pageCount, submissionCount, recent] = await Promise.all([
    prisma.websiteProject.count({ where: { ownerId } }),
    prisma.websiteProject.count({ where: { ownerId, status: 'DRAFT' } }),
    prisma.websiteProject.count({ where: { ownerId, status: 'PUBLISHED' } }),
    prisma.websitePage.count({ where: { website: { ownerId } } }),
    prisma.formSubmission.count({ where: { form: { website: { ownerId } } } }),
    prisma.websiteProject.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, slug: true, status: true, updatedAt: true },
    }),
  ]);

  return {
    totalWebsites: total,
    draftWebsites: draft,
    publishedWebsites: published,
    totalPages: pageCount,
    formSubmissions: submissionCount,
    recentlyEdited: recent,
  };
}
