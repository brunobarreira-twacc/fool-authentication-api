import request from 'supertest';
import { createApp } from '../src/app';
import { initSchema } from '../src/database/db';
import { seedUsers, SEED_USERS } from '../src/database/seed';

describe('Users', () => {
  const app = createApp();
  let userToken: string;
  let otherUserId: number;

  beforeAll(async () => {
    initSchema();
    seedUsers();

    const loginResponse = await request(app).post('/auth/login').send({
      email: SEED_USERS[0].email,
      password: SEED_USERS[0].password,
    });
    userToken = loginResponse.body.token;

    const registerResponse = await request(app).post('/auth/register').send({
      name: 'Other Person',
      email: 'other.person@example.com',
      password: 'anything',
    });
    otherUserId = registerResponse.body.id;
  });

  describe('GET /users/me', () => {
    it('rejects requests without a token', async () => {
      const response = await request(app).get('/users/me');
      expect(response.status).toBe(401);
    });

    it('returns the authenticated user profile without a password', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(SEED_USERS[0].email);
      expect(response.body.password).toBeUndefined();
    });
  });

  describe('PUT /users/me', () => {
    it('updates name and email but ignores role and password', async () => {
      const response = await request(app)
        .put('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Name',
          email: SEED_USERS[0].email,
          role: 'ADMIN',
          password: 'hacked',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.role).toBe('USER');
      expect(response.body.password).toBeUndefined();
    });
  });

  describe('GET /users', () => {
    it('lists users without password fields', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      for (const user of response.body) {
        expect(user.password).toBeUndefined();
      }
    });
  });

  describe('GET /users/:id', () => {
    it('returns 404 for an unknown id', async () => {
      const response = await request(app)
        .get('/users/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('returns another user profile for any authenticated caller', async () => {
      const response = await request(app)
        .get(`/users/${otherUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(otherUserId);
    });
  });

  describe('DELETE /users/:id', () => {
    it('rejects requests without a token', async () => {
      const response = await request(app).delete(`/users/${otherUserId}`);
      expect(response.status).toBe(401);
    });

    it('rejects a non-admin caller without the spoofed role header', async () => {
      const response = await request(app)
        .delete(`/users/${otherUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('rejects a non-admin caller who sends a spoofed X-Role header', async () => {
      const response = await request(app)
        .delete(`/users/${otherUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Role', 'ADMIN');

      expect(response.status).toBe(403);
    });
  });
});
