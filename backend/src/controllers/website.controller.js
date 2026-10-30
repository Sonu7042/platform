import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/ApiResponse.js';
import {
  createWebsite,
  listWebsites,
  getWebsiteById,
  updateWebsite,
  deleteWebsite,
  getDashboardStats,
} from '../services/website.service.js';

export const createWebsiteHandler = asyncHandler(async (req, res) => {
  const website = await createWebsite(req.user.id, req.body);
  created(res, website);
});

export const listWebsitesHandler = asyncHandler(async (req, res) => {
  const result = await listWebsites(req.user.id, req.query);
  ok(res, result.items, result.pagination);
});

export const getWebsiteHandler = asyncHandler(async (req, res) => {
  const website = await getWebsiteById(req.user.id, req.params.id);
  ok(res, website);
});

export const updateWebsiteHandler = asyncHandler(async (req, res) => {
  const website = await updateWebsite(req.user.id, req.params.id, req.body);
  ok(res, website);
});

export const deleteWebsiteHandler = asyncHandler(async (req, res) => {
  await deleteWebsite(req.user.id, req.params.id);
  noContent(res);
});

export const dashboardStatsHandler = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats(req.user.id);
  ok(res, stats);
});
