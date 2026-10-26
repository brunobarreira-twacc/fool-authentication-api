import { env } from './config/env';
import { initSchema } from './database/db';
import { seedUsers } from './database/seed';
import { createApp } from './app';

initSchema();
seedUsers();

const app = createApp();

app.listen(env.port, () => {
  console.log(`Fool Authentication API listening on http://localhost:${env.port}`);
});
