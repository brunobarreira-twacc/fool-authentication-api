import bcrypt from 'bcryptjs';
import { db } from './db';

export const SEED_USERS = [
  {
    name: 'Regular User',
    email: 'user@foolauth.local',
    password: 'User@1234',
    role: 'USER' as const,
  },
  {
    name: 'Administrator',
    email: 'admin@foolauth.local',
    password: 'Admin@1234',
    role: 'ADMIN' as const,
  },
];

export function seedUsers(): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as {
    count: number;
  };

  if (countRow.count > 0) {
    return;
  }

  const insert = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  );

  for (const seedUser of SEED_USERS) {
    const hashedPassword = bcrypt.hashSync(seedUser.password, 10);
    insert.run(seedUser.name, seedUser.email, hashedPassword, seedUser.role);
  }
}
