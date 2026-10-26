import { userRepository } from '../repositories/userRepository';
import { toPublicUser, PublicUser } from '../models/user';
import { HttpError } from '../utils/httpError';

export const userService = {
  getById(id: number): PublicUser {
    const user = userRepository.findById(id);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    return toPublicUser(user);
  },

  list(): PublicUser[] {
    return userRepository.findAll().map(toPublicUser);
  },

  update(id: number, fields: { name?: string; email?: string }): PublicUser {
    const updated = userRepository.update(id, fields);
    if (!updated) {
      throw new HttpError(404, 'User not found');
    }
    return toPublicUser(updated);
  },

  delete(id: number): void {
    const deleted = userRepository.delete(id);
    if (!deleted) {
      throw new HttpError(404, 'User not found');
    }
  },
};
