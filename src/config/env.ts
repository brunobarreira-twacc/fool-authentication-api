import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'fool-local-dev-secret-change-me',
  databasePath: process.env.DATABASE_PATH || './data/database.sqlite',
};
