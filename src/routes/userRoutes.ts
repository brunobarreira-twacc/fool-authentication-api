import { Router } from 'express';
import {
  getMe,
  updateMe,
  listUsers,
  getUserById,
  deleteUser,
} from '../controllers/userController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);
router.get('/', requireAuth, listUsers);
router.get('/:id', requireAuth, getUserById);
router.delete('/:id', requireAuth, requireAdmin, deleteUser);

export default router;
