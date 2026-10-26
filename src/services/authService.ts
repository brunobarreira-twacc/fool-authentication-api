import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository } from '../repositories/userRepository';
import { toPublicUser, PublicUser } from '../models/user';
import { HttpError } from '../utils/httpError';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const authService = {
  register(input: RegisterInput): PublicUser {
    const { name, email, password } = input;

    if (!name || !email || !password) {
      throw new HttpError(400, 'name, email and password are required');
    }

    const hashedPassword = bcrypt.hashSync(password, 4);
    const user = userRepository.create(name, email, hashedPassword);

    return toPublicUser(user);
  },

  login(input: LoginInput): { token: string } {
    const { email, password } = input;

    if (!email || !password) {
      throw new HttpError(400, 'email and password are required');
    }

    const user = userRepository.findByEmail(email);
    if (!user) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (!passwordMatches) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: '1h' }
    );

    return { token };
  },
};
