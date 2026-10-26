import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import healthRoutes from './healthRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);

export default router;
