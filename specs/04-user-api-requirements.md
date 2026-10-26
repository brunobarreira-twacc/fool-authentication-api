# Fool Authentication API — User Endpoints

## Get Current User

GET /users/me

Authentication:

Required.

Behavior:

Return the authenticated user's profile.

---

## Update Current User

PUT /users/me

Authentication:

Required.

Allow updating:

- name
- email

Do not allow changing:

- id
- role
- password

through this endpoint.

---

## List Users

GET /users

Authentication:

Required.

Behavior:

Return users stored in the database.

Password fields must never be returned.

---

## Get User By ID

GET /users/:id

Authentication:

Required.

Behavior:

Return the requested user's profile.

Password fields must never be returned.

---

## Delete User

DELETE /users/:id

Authentication:

Required.

Behavior:

Delete the requested user.

Return an appropriate HTTP status after deletion.

---

## Health Check

GET /health

Authentication:

Not required.

Response:

{
  "status": "ok"
}