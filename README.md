# Fool Authentication API

Intentionally insecure authentication API used as a target for OWASP ZAP scanning and
AI-assisted security remediation experiments. See `specs/` for the full requirements and
`AGENTS.md` for the rules that govern how this repository should be changed.

The intended workflow is:

```
OWASP ZAP scans the app
  → findings are exported
  → findings + source code go to an LLM agent
  → the agent proposes/applies a fix
  → OWASP ZAP scans again
  → verify the finding is resolved
```

## Requirements

- Node.js 18+
- npm

## Setup

```bash
npm install
npm run dev
```

The API starts on `http://localhost:3000`. A SQLite database is created automatically
(default path `./data/database.sqlite`) and seed users are inserted on first run.

### Environment variables

| Variable        | Default                     | Description                    |
|------------------|------------------------------|--------------------------------|
| `PORT`           | `3000`                       | HTTP port                      |
| `JWT_SECRET`     | `fool-local-dev-secret-change-me` | Secret used to sign JWTs   |
| `DATABASE_PATH`  | `./data/database.sqlite`     | SQLite file path               |

Copy `.env.example` to `.env` to override any of these locally.

To reset the database, stop the server and delete the SQLite file (or the whole `data/`
directory) — it will be recreated with fresh seed data on next start.

## Scripts

- `npm run dev` — start with auto-reload (ts-node-dev)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled build
- `npm test` — run functional tests (Jest + Supertest)

## Seed users (development only)

| Role  | Email                    | Password     |
|-------|---------------------------|--------------|
| USER  | `user@foolauth.local`     | `User@1234`  |
| ADMIN | `admin@foolauth.local`    | `Admin@1234` |

These credentials are for local development and security testing only.

## API

OpenAPI spec available at `GET /openapi.json`, with an interactive Swagger UI at
`GET /docs`.

| Method | Path            | Auth required | Description                     |
|--------|-----------------|---------------|----------------------------------|
| GET    | `/health`       | No            | Health check                     |
| POST   | `/auth/register`| No            | Register a new user (role: USER) |
| POST   | `/auth/login`   | No            | Authenticate, returns a JWT      |
| GET    | `/users/me`     | Yes           | Current user profile             |
| PUT    | `/users/me`     | Yes           | Update current user's name/email |
| GET    | `/users`        | Yes           | List all users                   |
| GET    | `/users/:id`    | Yes           | Get a user by id                 |
| DELETE | `/users/:id`    | Yes           | Delete a user by id              |

Protected endpoints expect `Authorization: Bearer <token>`.

## Intentional vulnerabilities

This application intentionally contains security weaknesses so that OWASP ZAP has
findings to detect and an AI agent has something to remediate. Full details in
`specs/05-intentional-vulnerability-requirements.md`. Summary of what's currently present:

1. **Missing security headers** — no CSP, `X-Content-Type-Options`, `Strict-Transport-Security`, etc.
2. **No rate limiting on `POST /auth/login`** — unlimited authentication attempts.
3. **Verbose error responses** — unhandled errors return the raw error message and stack
   trace (see `src/middleware/errorHandler.ts`), including raw SQLite constraint errors
   (e.g. duplicate email on registration).
4. **Broken access control on `GET /users/:id`** — any authenticated user can fetch any
   other user's profile; there is no ownership or admin check (`src/controllers/userController.ts`).
5. **Weak authorization on `DELETE /users/:id`** — the admin check
   (`src/middleware/authMiddleware.ts`, `requireAdmin`) trusts a client-supplied
   `X-Role` header, allowing a regular user to claim the ADMIN role and delete users.
6. **Weak input validation** — registration/update only check that required fields are
   present; there is no email format validation, no length limits, no password strength
   rules, and unexpected extra JSON properties are not rejected.
7. **SQL injection in email lookup** — login email is interpolated into a SQLite query.
8. **Unverified JWT authentication** — decoded claims are trusted without checking the
   token signature.
9. **Weak password hashing cost** — new registrations use bcrypt cost `4`.

Do not fix these unless a task explicitly asks for remediation of a specific finding —
see `AGENTS.md`.

## Security testing workflow

1. Start the app: `npm run dev`.
2. Point OWASP ZAP at `http://localhost:3000` (optionally seed it with the OpenAPI spec at
   `/openapi.json`, and authenticate as the seed `USER`/`ADMIN` accounts above for
   authenticated scans).
3. Run a scan and export findings.
4. Feed findings + relevant source files to the remediation agent.
5. Apply the proposed fix for the targeted finding only.
6. Re-run the ZAP scan and confirm the finding no longer appears.
7. Re-run `npm test` to confirm no regressions in functional behavior.
