import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = userService.getById(req.user!.id);
  res.status(200).json(user);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const user = userService.update(req.user!.id, { name, email });
  res.status(200).json(user);
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = userService.list();
  res.status(200).json(users);
});

// NOTE: intentional vulnerability — see specs/05-intentional-vulnerability-requirements.md (#4).
// Any authenticated user can fetch any other user's profile by id; there is no ownership
// or admin check here.
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = userService.getById(id);
  res.status(200).json(user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  userService.delete(id);
  res.status(204).send();
});
