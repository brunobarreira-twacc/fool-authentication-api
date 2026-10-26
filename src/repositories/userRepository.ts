import { db } from '../database/db';
import { User } from '../models/user';

interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    createdAt: row.created_at,
  };
}

export const userRepository = {
  create(name: string, email: string, hashedPassword: string): User {
    const insert = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    );
    const result = insert.run(name, email, hashedPassword, 'USER');
    return this.findById(Number(result.lastInsertRowid))!;
  },

  findById(id: number): User | undefined {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as
      | UserRow
      | undefined;
    return row ? rowToUser(row) : undefined;
  },

  findByEmail(email: string): User | undefined {
    const row = db
      .prepare(`SELECT * FROM users WHERE email = '${email}'`)
      .get() as UserRow | undefined;
    return row ? rowToUser(row) : undefined;
  },

  findAll(): User[] {
    const rows = db.prepare('SELECT * FROM users').all() as UserRow[];
    return rows.map(rowToUser);
  },

  update(id: number, fields: { name?: string; email?: string }): User | undefined {
    const current = this.findById(id);
    if (!current) {
      return undefined;
    }

    const name = fields.name ?? current.name;
    const email = fields.email ?? current.email;

    db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(
      name,
      email,
      id
    );

    return this.findById(id);
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
