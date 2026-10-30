import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/ApiResponse.js';
import { registerUser, loginUser, getCurrentUser } from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  created(res, result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  ok(res, result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  ok(res, user);
});
