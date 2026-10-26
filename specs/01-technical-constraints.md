# Fool Authentication API — Technical Constraints

## Runtime

Use:

- Node.js
- TypeScript

## HTTP Framework

Use either:

- Fastify
- Express

Prefer the simplest implementation.

## Database

Use SQLite.

Requirements:

- Database must run locally.
- No external database infrastructure is required.
- Database initialization must happen automatically.
- The database must be easy to delete and recreate.

## API Style

Use REST over HTTP.

Request and response bodies must use JSON.

## Authentication

Use JWT bearer tokens.

Protected endpoints must expect:

Authorization: Bearer <token>

## Configuration

Use environment variables for runtime configuration.

At minimum:

- PORT
- JWT_SECRET
- DATABASE_PATH

Provide sensible local-development defaults where appropriate.

## Package Management

Use npm.

The application should run after:

npm install
npm run dev

## Local Address

Default application URL:

http://localhost:3000