<p align="center">
  <img src="assets/equiledger_banner.png" alt="EquiLedger — financial records API" width="920" />
</p>

<h1 align="center">EquiLedger Backend</h1>

<p align="center">
  REST API for authentication, role-based access, financial records, and analytics dashboards.<br />
  <strong>Primary focus:</strong> testing and integrating against the production deployment below.
</p>

<p align="center">
  <a href="https://testapi.thefauxpastrouper.xyz/reference"><img src="https://img.shields.io/badge/API_docs-Scalar-0D1117?style=flat&logo=swagger&logoColor=85EA2D" alt="Scalar API documentation" /></a>
  <a href="https://testapi.thefauxpastrouper.xyz/openapi.json"><img src="https://img.shields.io/badge/OpenAPI-3.1-6A57FF?style=flat" alt="OpenAPI 3.1 specification" /></a>
  <img src="https://img.shields.io/badge/runtime-Bun-000000?style=flat&logo=bun&logoColor=white" alt="Bun runtime" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-97ca00?style=flat" alt="MIT License" />
</p>

<p align="center">
  <a href="#production-base-url"><strong>Production</strong></a> ·
  <a href="#endpoint-reference-production"><strong>Endpoints</strong></a> ·
  <a href="#end-to-end-test-flow-curl"><strong>curl walkthrough</strong></a> ·
  <a href="#local-development"><strong>Local dev</strong></a> ·
  <a href="#support"><strong>Support</strong></a>
</p>

---

## Table of contents

- [Production base URL](#production-base-url)
- [Before you call anything](#before-you-call-anything)
- [Response shapes](#response-shapes-what-to-expect-in-tools)
- [Roles and what they can do](#roles-and-what-they-can-do)
- [End-to-end test flow (curl)](#end-to-end-test-flow-curl)
- [Endpoint reference](#endpoint-reference-production)
- [Example: create a record](#example-create-a-record-admin-or-analyst)
- [Example: list records with filters](#example-list-records-with-filters)
- [Local development](#local-development)
- [Support](#support)

---

## Production base URL

**`https://testapi.thefauxpastrouper.xyz`**

All versioned routes are under **`/api/v1`**. Full example:

`https://testapi.thefauxpastrouper.xyz/api/v1/auth/signin`

### Discover the API without extra tools

| Resource | URL |
| -------- | --- |
| **Interactive docs (Scalar)** | [https://testapi.thefauxpastrouper.xyz/reference](https://testapi.thefauxpastrouper.xyz/reference) |
| **OpenAPI 3.1 JSON** | [https://testapi.thefauxpastrouper.xyz/openapi.json](https://testapi.thefauxpastrouper.xyz/openapi.json) |

You can import `openapi.json` into Postman, Insomnia, or Hoppscotch (“Import from URL”) to generate a ready-made collection with schemas.

---

## Before you call anything

1. **HTTPS only** — use `https://` for the host above.
2. **JSON bodies** — send `Content-Type: application/json` on `POST`, `PATCH`, and `PUT`.
3. **Protected routes** — send a JWT in the header:  
   `Authorization: Bearer <your_access_token>`
4. **Rate limiting** — by default the API allows **100 requests per IP per 60 seconds**. If exceeded, you get **HTTP 429** with a `Retry-After` header (seconds until the window resets).

---

## Response shapes (what to expect in tools)

### Success (most controller responses)

Successful calls typically return **HTTP 200** with:

```json
{
  "success": true,
  "message": "…",
  "data": { }
}
```

> **Note:** The OpenAPI document may describe some operations as `201` or `204`. The running service often uses **200** and the envelope above for creates and deletes as well—rely on `success` and `message`, not only on status code.

### Auth middleware (missing or bad token)

- **401** — no `Authorization` bearer token:  
  `{ "error": "Unauthorized", "message": "No token provided" }`
- **440** — invalid or expired JWT:  
  `{ "error": "Session Expired", "message": "Invalid or Expired Token" }`  
  Tokens are issued with a **1-day** expiry (`signin`).

### Inactive account

If `isActive` is false: **403**

```json
{
  "error": "Account Inactive",
  "message": "Please contact support to reactivate your account."
}
```

### Forbidden role

**403** when your role is not allowed for the route:

```json
{
  "error": "Forbidden",
  "message": "This action requires one of the following roles: …"
}
```

### Validation (Zod)

**400**:

```json
{
  "success": false,
  "error": "ValidationError",
  "details": [
    { "location": "body", "field": "email", "message": "…" }
  ]
}
```

### Many business-rule errors (e.g. signin failure)

**400** with:

```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

(The `error` field holds the message string in these paths.)

### Rate limit

**429**:

```json
{
  "success": false,
  "error": "TooManyRequests",
  "message": "Rate limit exceeded. Try again in N seconds."
}
```

---

## Roles and what they can do

| Role | Typical source | Users admin | Records |
| ---- | -------------- | ----------- | ------- |
| **VIEWER** | Default when registering via `POST /auth/signup` | No | List & get only |
| **ANALYST** | Set by an **ADMIN** | No | Create, update (not delete) |
| **ADMIN** | First user / seed / another admin | Yes | Full record access including delete |

Concrete route rules:

- **`/api/v1/users/*`** — **ADMIN** only (after auth + active account).
- **`GET /api/v1/records`**, **`GET /api/v1/records/:id`** — any authenticated **active** user (**VIEWER**, **ANALYST**, **ADMIN**).
- **`POST /api/v1/records`**, **`PUT /api/v1/records/:id`** — **ADMIN** or **ANALYST**.
- **`DELETE /api/v1/records/:id`** — **ADMIN** only.
- **`/api/v1/dashboard/*`** — any authenticated **active** user (data is scoped to **your** `userId`).

---

## End-to-end test flow (curl)

Set a shell variable so you can paste examples as-is:

```bash
export BASE_URL="https://testapi.thefauxpastrouper.xyz"
```

### 1. Register (optional if you already have an account)

```bash
curl -sS -X POST "$BASE_URL/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-secure-password", "role": "ADMIN"}'
```

New users get role **VIEWER** by default.

### 2. Sign in and capture the token

```bash
curl -sS -X POST "$BASE_URL/api/v1/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-secure-password"}'
```

Parse `data.token` from the JSON (e.g. with `jq`):

```bash
TOKEN=$(curl -sS -X POST "$BASE_URL/api/v1/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-secure-password"}' \
  | jq -r '.data.token')

echo "$TOKEN"
```

### 3. Call a protected route

```bash
curl -sS "$BASE_URL/api/v1/dashboard/summary" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Endpoint reference (production)

Base path: **`$BASE_URL/api/v1`**

### Auth (no bearer token)

| Method | Path | Body (JSON) |
| ------ | ---- | ----------- |
| POST | `/auth/signup` | `{ "email", "password" }` — password 6–100 chars |
| POST | `/auth/signin` | `{ "email", "password" }` |

**Sign-in response** includes `data.user` and `data.token`.

### Users — ADMIN only

| Method | Path | Body / notes |
| ------ | ---- | ------------ |
| POST | `/users` | `{ "email", "password", "role"?, "isActive"? }` — `role`: `ADMIN` \| `ANALYST` \| `VIEWER` |
| GET | `/users` | — |
| PATCH | `/users/:id` | `{ "role"?, "isActive"? }` — `:id` is UUID |

### Records — bearer required; see role table above

| Method | Path | Query / body |
| ------ | ---- | ------------ |
| GET | `/records` | `page` (default 1), `limit` (default 10, max 100), `q`, `type` (`INCOME`\|`EXPENSE`), `category`, `startDate`, `endDate` (ISO date-time) |
| GET | `/records/:id` | — |
| POST | `/records` | `{ "amount" (>0), "type", "category", "date"?, "description"? }` |
| PUT | `/records/:id` | Same fields as create, all optional partial update per service |
| DELETE | `/records/:id` | — |

**List response** shape: `data.records` plus `data.pagination` (`total`, `page`, `limit`, `totalPages`).

**Testing note:** `GET /records` only returns **your** records. `GET /records/:id` returns any non-deleted record if you know its UUID (not filtered by the caller’s user id). When validating behavior, compare list results with explicit IDs you own.

### Dashboard — bearer required; data is for the signed-in user

| Method | Path | Query |
| ------ | ---- | ----- |
| GET | `/dashboard/overview` | — |
| GET | `/dashboard/summary` | — |
| GET | `/dashboard/categories` | — |
| GET | `/dashboard/trends/monthly` | `months` (1–24, default 6), `weeks` (1–52, default 4), `limit` (1–50, default 5) |
| GET | `/dashboard/trends/weekly` | same as monthly |
| GET | `/dashboard/recent` | `months`, `weeks`, `limit` (same constraints; `limit` caps recent rows) |

---

## Example: create a record (ADMIN or ANALYST)

```bash
curl -sS -X POST "$BASE_URL/api/v1/records" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 42.50,
    "type": "EXPENSE",
    "category": "Food",
    "description": "Lunch",
    "date": "2026-04-04T12:00:00.000Z"
  }'
```

If you only have a **VIEWER** account, this returns **403 Forbidden**; use an admin-created **ANALYST** (or **ADMIN**) user for writes.

---

## Example: list records with filters

```bash
curl -sS -G "$BASE_URL/api/v1/records" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "page=1" \
  --data-urlencode "limit=10" \
  --data-urlencode "type=EXPENSE" \
  --data-urlencode "q=food"
```

---

## Local development

```bash
bun install
bun run dev
```

Default local URL: `http://localhost:3000` (same routes under `/api/v1`). Interactive docs: `http://localhost:3000/reference`.

---

## Support

- **Interactive docs:** [testapi.thefauxpastrouper.xyz/reference](https://testapi.thefauxpastrouper.xyz/reference)
- **OpenAPI JSON:** [testapi.thefauxpastrouper.xyz/openapi.json](https://testapi.thefauxpastrouper.xyz/openapi.json)
- **Email:** [thefauxpastrouper120@gmail.com](mailto:thefauxpastrouper120@gmail.com)

### Contributing

Issues and pull requests are welcome. Run `bun run test` before submitting changes.

### License

This project is released under the [MIT License](https://opensource.org/licenses/MIT) (see also API metadata in `src/docs/openapi.json`).
