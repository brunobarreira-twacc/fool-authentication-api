import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const user = authService.register({ name, email, password });
  res.status(201).json(user);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = authService.login({ email, password });
  res.status(200).json(result);
});
