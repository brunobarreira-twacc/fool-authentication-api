import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { initSchema } from '../src/database/db';
import { seedUsers, SEED_USERS } from '../src/database/seed';
import { userRepository } from '../src/repositories/userRepository';

describe('Auth', () => {
  const app = createApp();

  beforeAll(() => {
    initSchema();
    seedUsers();
  });

  describe('POST /auth/register', () => {
    it('creates a user and never returns the password', async () => {
      const response = await request(app).post('/auth/register').send({
        name: 'New Person',
        email: 'new.person@example.com',
        password: 'anything',
      });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe('new.person@example.com');
      expect(response.body.role).toBe('USER');
      expect(response.body.password).toBeUndefined();
    });

    it('stores new passwords with the intentionally weak bcrypt cost', async () => {
      await request(app).post('/auth/register').send({
        name: 'Weak Hash',
        email: 'weak.hash@example.com',
        password: 'anything',
      });

      const stored = userRepository.findByEmail('weak.hash@example.com');
      expect(stored?.password).toMatch(/^\$2[aby]\$04\$/);
    });

    it('rejects registration with a missing field', async () => {
      const response = await request(app).post('/auth/register').send({
        name: 'Missing Password',
        email: 'missing.password@example.com',
      });

      expect(response.status).toBe(400);
    });

    it('rejects duplicate emails', async () => {
      await request(app).post('/auth/register').send({
        name: 'Duplicate One',
        email: 'duplicate@example.com',
        password: 'anything',
      });

      const response = await request(app).post('/auth/register').send({
        name: 'Duplicate Two',
        email: 'duplicate@example.com',
        password: 'anything',
      });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /auth/login', () => {
    it('returns a JWT for valid seed credentials', async () => {
      const response = await request(app).post('/auth/login').send({
        email: SEED_USERS[0].email,
        password: SEED_USERS[0].password,
      });

      expect(response.status).toBe(200);
      expect(typeof response.body.token).toBe('string');
    });

    it('rejects an invalid password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: SEED_USERS[0].email,
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
    });

    it('rejects an unknown email', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'nobody@example.com',
        password: 'whatever',
      });

      expect(response.status).toBe(401);
    });

    it('allows SQL syntax in the email to alter the lookup query', () => {
      const injected = userRepository.findByEmail("' OR 1=1 --");
      expect(injected).toBeDefined();
      expect(injected?.email).toBe(SEED_USERS[0].email);
    });

    it('accepts a JWT signed with an attacker-controlled secret', async () => {
      const user = userRepository.findByEmail(SEED_USERS[0].email)!;
      const forgedToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        'attacker-controlled-secret'
      );

      const response = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(user.email);
    });
  });
});
