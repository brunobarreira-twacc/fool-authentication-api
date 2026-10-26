# Fool Authentication API — Authentication Requirements

## Register User

Endpoint:

POST /auth/register

Request:

- name
- email
- password

Behavior:

- Create a new user.
- Email must be unique.
- Assign USER role automatically.
- Persist the user in SQLite.
- Return basic information about the created user.
- Do not return the password.

## Login

Endpoint:

POST /auth/login

Request:

- email
- password

Behavior:

- Validate provided credentials.
- Return an authentication token when credentials are valid.
- Return an authentication error when credentials are invalid.

Response should contain:

- JWT access token

## Authentication Middleware

Protected routes must validate JWT tokens.

Invalid, missing, or expired tokens must prevent access to protected endpoints.