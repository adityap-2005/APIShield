# APIShield Frontend Integration Reference

> This document was extracted from the actual backend source code.
> Every endpoint, field name, role, and status here comes directly from the real implementation.
> Do NOT invent or assume any values. Use this document as the ground truth when building the frontend.

---

## Base URL

The backend runs on:

```
http://localhost:5000
```

All API routes are prefixed with `/api/v1`.

In the frontend, store this as:

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## Authentication Mechanism

The backend uses **JWT (JSON Web Token)** in the HTTP `Authorization` header.

**Token format (required for every protected route):**
```
Authorization: Bearer <token>
```

- Token is returned on login.
- Token expires in **7 days** (`JWT_EXPIRES_IN=7d`).
- The frontend must store the token (e.g. `localStorage`) and attach it to every protected request.
- If the token is missing, expired, or invalid, the backend returns `401`.
- The `protect` middleware decodes the token, fetches the `User` from MongoDB, and attaches it to `req.user`.

---

## Standard Response Envelope

**Success response:**
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Error response:**
```json
{
  "success": false,
  "message": "...",
  "errors": []
}
```

The `errors` field is an array and may be empty. Check `success: false` to detect errors.

---

## Data Model Hierarchy

```
User
  └─ Membership  (org-level role: OWNER / ADMIN / DEVELOPER)
        └─ Organization
              ├─ Invitation  (PENDING / ACCEPTED / REJECTED / EXPIRED / CANCELLED)
              ├─ Team
              │     ├─ TeamMembership  (team-level role: TEAM_ADMIN / MEMBER)
              │     └─ ApiKey
              └─ AuditLog
```

---

## Backend Constants

### Organization Member Roles (MEMBERSHIP_ROLES / ORGANIZATION_ROLES)

| Value | Can Invite | Can Manage Members | Notes |
|-------|------------|-------------------|-------|
| `"OWNER"` | Yes | Yes (anyone) | Cannot be assigned via invitation |
| `"ADMIN"` | Yes | Yes (DEVELOPER only) | |
| `"DEVELOPER"` | No | No | Default on invitation |

### Team Roles (TEAM_ROLES)

| Value | Can Manage API Keys | Can Add/Remove Team Members |
|-------|--------------------|-----------------------------|
| `"TEAM_ADMIN"` | Yes | Yes |
| `"MEMBER"` | No | No |

### Membership Status (MEMBERSHIP_STATUS)

| Value | Meaning |
|-------|---------|
| `"ACTIVE"` | Active member |
| `"SUSPENDED"` | Suspended |
| `"LEFT"` | Voluntarily left |
| `"REMOVED"` | Removed by admin/owner |

### Invitation Status (INVITATION_STATUS)

| Value | Meaning |
|-------|---------|
| `"PENDING"` | Awaiting response |
| `"ACCEPTED"` | Accepted |
| `"REJECTED"` | Rejected |
| `"EXPIRED"` | Past expiry (7 days) |
| `"CANCELLED"` | Cancelled by org admin |

### API Key Status (API_KEY_STATUS)

| Value | Meaning |
|-------|---------|
| `"ACTIVE"` | Active and usable |
| `"REVOKED"` | Permanently revoked |
| `"EXPIRED"` | Past expiresAt date |
| `"ARCHIVED"` | Archived (must be REVOKED first) |

### API Key Environment (API_KEY_ENVIRONMENT) + Prefixes

| Value | Key Prefix |
|-------|-----------|
| `"PRODUCTION"` | `aps_live_` |
| `"STAGING"` | `aps_stage_` |
| `"DEVELOPMENT"` | `aps_dev_` |
| `"TEST"` | `aps_test_` |

### API Scopes (API_SCOPES)

| Value | Meaning |
|-------|---------|
| `"users:read"` | Read user data |
| `"users:write"` | Write user data |
| `"teams:read"` | Read team data |
| `"teams:write"` | Write team data |
| `"api_keys:read"` | Read API keys |
| `"api_keys:write"` | Write API keys |

### Account Status (ACCOUNT_STATUS)

`"ACTIVE"` / `"SUSPENDED"` / `"DELETED"`

### Organization Status (ORGANIZATION_STATUS)

`"ACTIVE"` / `"SUSPENDED"` / `"ARCHIVE"` (note: value is `"ARCHIVE"`, not `"ARCHIVED"`)

### Audit Actions (AUDIT_ACTIONS)

```
USER_REGISTERED        ORGANIZATION_CREATED
MEMBER_INVITED         MEMBER_REMOVED         MEMBER_ROLE_CHANGED
TEAM_CREATED           TEAM_UPDATED           TEAM_DELETED
TEAM_MEMBER_ADDED      TEAM_MEMBER_REMOVED
API_KEY_CREATED        API_KEY_UPDATED        API_KEY_ROTATED
API_KEY_REVOKED        API_KEY_ARCHIVED
```

### Audit Entity Types (AUDIT_ENTITY_TYPES)

`USER` / `ORGANIZATION` / `MEMBER` / `TEAM` / `API_KEY`

---

## API Endpoints

---

### 1. Authentication

#### POST /api/v1/auth/register

Register a new user.

**Authentication:** None.

**Request body:**
```json
{
  "name": "string (2-50 chars, required)",
  "email": "string (valid email, required)",
  "password": "string (min 8 chars, required)"
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "...", "name": "...", "email": "...",
    "avatar": null, "status": "ACTIVE", "isVerified": false,
    "createdAt": "...", "updatedAt": "..."
  }
}
```

**Errors:** `409` user already exists, `400` validation failure.

---

#### POST /api/v1/auth/login

Login.

**Authentication:** None.

**Request body:**
```json
{ "email": "string", "password": "string" }
```

**Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "data": { "_id": "...", "name": "...", "email": "...", ... }
}
```

> `token` is at the **top level** of the response, NOT inside `data`.

**Errors:** `401` invalid credentials, `403` inactive account.

---

#### GET /api/v1/auth/me

Get current user profile.

**Authentication:** Required.

**Success (200):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": { "_id": "...", "name": "...", "email": "...", ... }
}
```

**Errors:** `401` unauthorized.

---

### 2. Organizations

#### POST /api/v1/organizations

Create a new organization. The creator becomes OWNER automatically.

**Authentication:** Required.

**Request body:**
```json
{
  "name": "string (3-100 chars, required)",
  "description": "string (max 500 chars, optional)",
  "website": "string (must start with 'http', optional)"
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "_id": "...", "name": "...", "slug": "...",
    "description": "", "logo": null, "website": "",
    "createdBy": "USER_ID", "status": "ACTIVE",
    "createdAt": "...", "updatedAt": "..."
  }
}
```

**Errors:** `400` name required, `400` invalid website, `409` name already taken.

---

#### GET /api/v1/organizations

Get all organizations the current user is an active member of.

**Authentication:** Required.

**Success (200):**
```json
{
  "success": true,
  "data": [ { "_id": "...", "name": "...", "slug": "...", ... } ]
}
```

> Returns an array of Organization objects (the backend populates and extracts organization from each membership).

---

### 3. Invitations (Organization-scoped)

#### POST /api/v1/organizations/:organizationId/invitations

Invite a user to the organization.

**Authentication:** Required.
**Authorization:** OWNER or ADMIN only.

**Request body:**
```json
{ "email": "string", "role": "ADMIN | DEVELOPER" }
```

**Success (201):**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "_id": "...", "organizationId": "...", "email": "...",
    "role": "DEVELOPER", "invitedBy": "USER_ID",
    "status": "PENDING", "expiresAt": "...",
    "createdAt": "...", "updatedAt": "..."
  }
}
```

**Errors:** `403` no permission, `400` invalid/OWNER role, `400` self-invite, `409` already member, `409` pending invite exists.

---

#### GET /api/v1/organizations/:organizationId/invitations

Get all invitations for an organization.

**Authentication:** Required.
**Authorization:** OWNER or ADMIN only.

**Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...", "email": "...", "role": "...", "status": "...",
      "invitedBy": { "_id": "...", "name": "...", "email": "...", "avatar": null },
      "expiresAt": "...", "createdAt": "..."
    }
  ]
}
```

> `invitedBy` is populated with user name, email, and avatar.

---

#### DELETE /api/v1/organizations/:organizationId/invitations/:invitationId

Cancel a pending invitation.

**Authentication:** Required.
**Authorization:** OWNER or ADMIN only.

**Success (200):**
```json
{ "success": true, "message": "Invitation cancelled successfully." }
```

---

### 4. Invitations (User-scoped)

#### GET /api/v1/invitations

Get all PENDING invitations for the current user (matched by email).

**Authentication:** Required.

**Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "organizationId": { "_id": "...", "name": "...", "slug": "..." },
      "email": "...", "role": "...", "status": "PENDING", "expiresAt": "...",
      "invitedBy": { "_id": "...", "name": "...", "email": "..." },
      "createdAt": "..."
    }
  ]
}
```

---

#### POST /api/v1/invitations/:invitationId/accept

Accept an invitation. Creates a membership for the current user.

**Authentication:** Required.

**Request body:** None.

**Success (200):**
```json
{
  "success": true,
  "message": "Invitation accepted successfully.",
  "data": {
    "_id": "...", "status": "ACCEPTED", "acceptedAt": "...",
    "organizationId": { "_id": "...", "name": "...", "slug": "..." },
    "invitedBy": { "_id": "...", "name": "...", "email": "..." },
    ...
  }
}
```

**Errors:** `403` not your invitation, `409` no longer pending, `400` expired, `409` already a member.

---

#### POST /api/v1/invitations/:invitationId/reject

Reject an invitation.

**Authentication:** Required.

**Request body:** None.

**Success (200):**
```json
{ "success": true, "message": "Invitation rejected successfully.", "data": { ... } }
```

---

### 5. Organization Members

#### GET /api/v1/organizations/:organizationId/members

Get all active members.

**Authentication:** Required.
**Authorization:** Any active member.

**Success (200):**
```json
{
  "success": true,
  "message": "Organization members fetched successfully",
  "data": [
    {
      "membershipId": "MEMBERSHIP_ID",
      "user": { "_id": "...", "name": "...", "email": "...", "avatar": null },
      "role": "OWNER",
      "status": "ACTIVE",
      "joinedAt": "ISO_DATE"
    }
  ]
}
```

> `membershipId` is the Membership document's `_id`. Use this when adding members to teams or updating/removing members.

---

#### PATCH /api/v1/organizations/:organizationId/members/:memberId/role

Update a member's organization role.

**Authentication:** Required.
**Authorization:** OWNER can update anyone; ADMIN can only update DEVELOPER members.

**URL param:** `memberId` = the Membership `_id`.

**Request body:**
```json
{ "role": "ADMIN | DEVELOPER" }
```

**Success (200):**
```json
{
  "success": true,
  "message": "Member role updated successfully.",
  "data": { "membershipId": "...", "user": "USER_ID", "role": "ADMIN", "status": "ACTIVE" }
}
```

**Errors:** `400` own role, `400` same role, `400` invalid role, `403` no permission, `404` member not found.

---

#### DELETE /api/v1/organizations/:organizationId/members/:memberId

Remove a member from the organization.

**Authentication:** Required.
**Authorization:** OWNER can remove anyone; ADMIN can only remove DEVELOPER.

**URL param:** `memberId` = the Membership `_id`.

**Success (200):**
```json
{ "success": true, "message": "Member removed successfully." }
```

**Errors:** `400` use leave endpoint for self, `403` no permission, `409` last owner, `404` not found.

---

#### DELETE /api/v1/organizations/:organizationId/members/me

Leave the organization (current user only).

**Authentication:** Required.

**Success (200):**
```json
{ "success": true, "message": "Left organization successfully", "data": { ... membership ... } }
```

**Errors:** `409` last owner, `403` not a member.

---

### 6. Teams

#### POST /api/v1/organizations/:organizationId/teams

Create a team. Creator automatically becomes TEAM_ADMIN.

**Authentication:** Required.
**Authorization:** Any active org member.

**Request body:**
```json
{
  "name": "string (max 100 chars, required)",
  "description": "string (max 500 chars, optional)"
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "_id": "...", "organizationId": "...", "name": "...", "slug": "...",
    "description": "", "createdBy": "USER_ID", "updatedBy": "USER_ID",
    "createdAt": "...", "updatedAt": "..."
  }
}
```

**Errors:** `409` name taken, `403` not a member, `404` org not found.

---

#### GET /api/v1/organizations/:organizationId/teams

Get all teams in organization.

**Authentication:** Required.
**Authorization:** Any active member.

**Success (200):**
```json
{ "success": true, "message": "Teams fetched successfully", "data": [ { ... } ] }
```

---

#### GET /api/v1/organizations/:organizationId/teams/:teamId

Get a single team.

**Authentication:** Required.
**Authorization:** Any active member.

**Success (200):**
```json
{ "success": true, "message": "Team fetched successfully", "data": { ... } }
```

---

#### PATCH /api/v1/organizations/:organizationId/teams/:teamId

Update team name/description.

**Authentication:** Required.
**Authorization:** TEAM_ADMIN of this team.

**Request body:**
```json
{ "name": "string (optional)", "description": "string (optional)" }
```

**Success (200):**
```json
{ "success": true, "message": "Team updated successfully", "data": { ... } }
```

**Errors:** `403` not team admin, `409` name taken.

---

#### DELETE /api/v1/organizations/:organizationId/teams/:teamId

Delete a team and all its memberships.

**Authentication:** Required.
**Authorization:** Org OWNER/ADMIN, or TEAM_ADMIN.

**Success (200):**
```json
{ "success": true, "message": "Team deleted successfully" }
```

---

### 7. Team Members

Base path: `/api/v1/organizations/:organizationId/teams/:teamId/members`

#### POST /members

Add an org member to the team. New team members get role MEMBER by default.

**Authentication:** Required.
**Authorization:** TEAM_ADMIN.

**Request body:**
```json
{ "membershipId": "MEMBERSHIP_DOCUMENT_ID" }
```

> `membershipId` is the `_id` from the `Membership` document (from GET /organizations/:orgId/members).

**Success (201):**
```json
{
  "success": true,
  "message": "Member added to team successfully",
  "data": {
    "_id": "TEAM_MEMBERSHIP_ID",
    "organizationId": "...", "teamId": "...", "membershipId": "...",
    "role": "MEMBER", "addedBy": "USER_ID",
    "createdAt": "...", "updatedAt": "..."
  }
}
```

**Errors:** `409` already in team, `404` member not found, `403` not team admin.

---

#### GET /members

Get all team members.

**Authentication:** Required.
**Authorization:** Org OWNER/ADMIN, or any team member.

**Success (200):**
```json
{
  "success": true,
  "message": "Team members fetched successfully",
  "data": [
    {
      "teamMembershipId": "TEAM_MEMBERSHIP_ID",
      "teamRole": "TEAM_ADMIN",
      "organizationRole": "OWNER",
      "status": "ACTIVE",
      "user": { "id": "...", "name": "...", "email": "...", "avatar": null }
    }
  ]
}
```

---

#### DELETE /members/:membershipId

Remove a member from the team.

**URL param:** `membershipId` = the Membership `_id` (not TeamMembership `_id`).

**Authentication:** Required.
**Authorization:** Org OWNER/ADMIN, or TEAM_ADMIN (but cannot remove another TEAM_ADMIN).

**Success (200):**
```json
{ "success": true, "message": "Member removed from team successfully" }
```

**Errors:** `403` cannot remove team admin, `404` not found.

---

#### PATCH /members/:membershipId

Update a team member's role.

**URL param:** `membershipId` = the Membership `_id`.

**Authentication:** Required.
**Authorization:** Org OWNER/ADMIN, or TEAM_ADMIN (with restrictions).

**Request body:**
```json
{ "role": "TEAM_ADMIN | MEMBER" }
```

**Success (200):**
```json
{ "success": true, "message": "Member role updated successfully." }
```

**Errors:** `400` same role, `400` own role, `403` cannot change another team admin's role.

---

#### DELETE /leave

Leave a team voluntarily.

**Authentication:** Required.

**Success (200):**
```json
{ "success": true, "message": "Left team successfully" }
```

**Errors:** `403` not a team member. Backend validates if last TEAM_ADMIN.

---

### 8. API Keys

Base path: `/api/v1/organizations/:organizationId/teams/:teamId/api-keys`

**Authorization for ALL API key routes:** Must be active org member + team member + TEAM_ADMIN role.

---

#### POST /

Create an API key.

**Authentication:** Required.

**Request body:**
```json
{
  "name": "string (max 100 chars, required)",
  "description": "string (optional)",
  "environment": "PRODUCTION | STAGING | DEVELOPMENT | TEST (required)",
  "scopes": ["users:read", ...] (optional array),
  "expiresAt": "ISO date string (optional, must be future)"
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "API key created successfully.",
  "data": {
    "apiKey": "aps_dev_FULL_SECRET_KEY_HERE",
    "apiKeyDetails": {
      "_id": "...", "organizationId": "...", "teamId": "...",
      "name": "...", "description": "", "environment": "DEVELOPMENT",
      "publicKeyId": "aps_dev_abc1",
      "scopes": [], "status": "ACTIVE",
      "expiresAt": null, "lastUsedAt": null,
      "createdBy": "USER_ID",
      "archivedAt": null, "archivedBy": null,
      "createdAt": "...", "updatedAt": "..."
    }
  }
}
```

> **CRITICAL:** `data.apiKey` contains the full plain-text key. This is shown **ONCE ONLY**. The frontend must immediately display it with a "copy and save" warning. After this request, the full key cannot be retrieved — only `publicKeyId` (prefix) is stored.

---

#### GET /

Get all API keys for the team.

**Authentication:** Required.

**Success (200):**
```json
{
  "success": true,
  "message": "API keys fetched successfully.",
  "data": [ { "_id": "...", "publicKeyId": "...", "status": "ACTIVE", ... } ]
}
```

> `keyHash` is never returned (it has `select: false`).

---

#### GET /:apiKeyId

Get a single API key.

**Success (200):**
```json
{ "success": true, "message": "API key fetched successfully.", "data": { ... } }
```

---

#### PATCH /:apiKeyId

Update name, description, scopes, or expiresAt.

**Request body (all optional):**
```json
{
  "name": "string",
  "description": "string",
  "scopes": ["..."],
  "expiresAt": "ISO date string"
}
```

> `environment` cannot be updated.

**Success (200):**
```json
{ "success": true, "message": "API key updated successfully.", "data": { ... } }
```

**Errors:** `400` expiry in past, `404` not found.

---

#### POST /:apiKeyId/rotate

Rotate the key secret. Same record, new secret.

**Request body:** None.

**Success (200):**
```json
{
  "success": true,
  "message": "API key rotated successfully.",
  "data": {
    "apiKey": "aps_dev_NEW_FULL_SECRET",
    "apiKeyDetails": { ... updated with new publicKeyId ... }
  }
}
```

> Same as create — show the new full key once with a warning.

**Errors:** `400` revoked key, `400` expired key.

---

#### POST /:apiKeyId/revoke

Revoke an API key.

**Request body:** None.

**Success (200):**
```json
{
  "success": true,
  "message": "API key revoked successfully.",
  "data": {
    "apiKeyId": "...", "publicKeyId": "...",
    "status": "REVOKED", "revokedAt": "ISO_DATE"
  }
}
```

**Errors:** `400` already revoked.

---

#### POST /:apiKeyId/archive

Archive a revoked key. **Key must be REVOKED status first.**

**Request body:** None.

**Success (200):**
```json
{
  "success": true,
  "message": "API key archived successfully.",
  "data": {
    "apiKeyId": "...", "publicKeyId": "...",
    "status": "ARCHIVED", "archivedAt": "ISO_DATE"
  }
}
```

**Errors:** `400` already archived, `400` must be revoked first.

---

### 9. Audit Logs

#### GET /api/v1/organizations/:organizationId/audit-logs

Get paginated audit logs.

**Authentication:** Required.
**Authorization:** Any active org member.

**Query params:**

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `20` | Items per page |

**Success (200):**
```json
{
  "success": true,
  "message": "Audit logs fetched successfully.",
  "data": {
    "logs": [
      {
        "_id": "...",
        "organizationId": "...",
        "teamId": null,
        "actor": { "id": "USER_ID", "name": "...", "email": "..." },
        "action": "API_KEY_CREATED",
        "entity": { "id": "...", "type": "API_KEY", "name": "..." },
        "metadata": { "environment": "DEVELOPMENT" },
        "createdAt": "...", "updatedAt": "..."
      }
    ],
    "pagination": {
      "page": 1, "limit": 20, "total": 42, "totalPages": 3
    }
  }
}
```

---

#### GET /api/v1/organizations/:organizationId/audit-logs/:auditLogId

Get a single audit log entry.

**Authentication:** Required.
**Authorization:** Any active org member.

**Success (200):**
```json
{
  "success": true,
  "message": "Audit log fetched successfully.",
  "data": { ... single log object ... }
}
```

---

## Known Backend Issues Found During Analysis

> These must be reviewed with the developer. Do NOT modify backend without approval.

| # | File | Issue | Impact |
|---|------|-------|--------|
| 1 | `app.js` | `cors` package installed but not imported/used | **HIGH** — Browser requests will fail with CORS errors. Must add `app.use(cors())` before routes. |
| 2 | `invitation.service.js` L511 | References `AUDIT_ACTIONS.INVITATION_ACCEPTED` which is not defined in `auditActions.js` | MEDIUM — Accepted invitations log `undefined` as action |
| 3 | `membership.service.js` | Uses `auditLogService`, `AUDIT_ACTIONS`, `AUDIT_ENTITY_TYPES` but none are imported | **HIGH** — Runtime error when `updateMemberRole` or `removeMember` is called |
| 4 | `package.json` | `jsonwebtoken` and `bcryptjs` are used in code but not listed in dependencies | Medium — May work if installed locally; will fail on fresh install |

---

## Features NOT Yet in Backend (V1 Gaps)

| Feature | Status |
|---------|--------|
| Dashboard summary stats (counts of teams, keys, members) | No single endpoint; derive from individual list calls |
| Analytics / request tracking | Not implemented |
| Update organization (name/description/website/logo) | No PATCH endpoint |
| Update user profile (name/avatar/password) | No endpoint |
| Audit log filtering (by action, actor, date) | No query params; pagination only |
| Logout endpoint | Not needed — logout is client-side (delete token) |

---

## Frontend Architecture Notes

### Token Storage
```javascript
// Store on login
localStorage.setItem('apiShield_token', token);

// Read on every request
const token = localStorage.getItem('apiShield_token');

// Clear on logout
localStorage.removeItem('apiShield_token');
```

### Organization Context
The user may belong to multiple organizations. Store the selected `organizationId` in React state or `localStorage` so all org-scoped requests know which org to target.

### Naming Conventions — Use EXACTLY As Listed

| Identifier | Meaning |
|-----------|---------|
| `membershipId` | `_id` of a `Membership` document |
| `teamMembershipId` | `_id` of a `TeamMembership` document |
| `apiKeyId` | `_id` of an `ApiKey` document |
| `organizationId` | `_id` of an `Organization` document |
| `teamId` | `_id` of a `Team` document |
| `invitationId` | `_id` of an `Invitation` document |
| `auditLogId` | `_id` of an `AuditLog` document |
| `publicKeyId` | Safe display prefix of an API key (e.g. `aps_dev_abc1`) |
| `apiKey` | Full plain-text secret (only on create/rotate) |

---

*End of FRONTEND_INTEGRATION.md*
