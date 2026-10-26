import crypto from 'crypto';
import path from 'path';

process.env.DATABASE_PATH = path.join(
  __dirname,
  '..',
  'data',
  `test-${crypto.randomUUID()}.sqlite`
);
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '0';
