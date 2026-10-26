export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
}

export type PublicUser = Omit<User, 'password'>;

export function toPublicUser(user: User): PublicUser {
  const { password, ...publicUser } = user;
  return publicUser;
}
