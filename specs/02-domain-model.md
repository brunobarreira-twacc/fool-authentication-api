# Fool Authentication API — Domain Model

## User

A User contains:

- id
- name
- email
- password
- role
- createdAt

## Roles

Supported roles:

- USER
- ADMIN

## Rules

- `id` uniquely identifies a user.
- `email` must be unique.
- New users receive the `USER` role by default.
- Roles are stored in the database.
- Passwords are used for authentication.
- Passwords must never be returned by API responses.

## Persistence

Create a SQLite table named:

users

Minimum database fields:

- id
- name
- email
- password
- role
- created_at