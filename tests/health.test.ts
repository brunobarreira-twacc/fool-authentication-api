import request from 'supertest';
import { createApp } from '../src/app';
import { initSchema } from '../src/database/db';
import { seedUsers } from '../src/database/seed';

describe('GET /health', () => {
  const app = createApp();

  beforeAll(() => {
    initSchema();
    seedUsers();
  });

  it('returns status ok without authentication', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
