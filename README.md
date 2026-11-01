# APIShield

**A Developer Access & API Security Platform**

APIShield is a SaaS platform that helps organizations manage API keys, control developer access, monitor API usage, and improve API security through centralized access management.

## Features

- **Authentication:** Secure authentication using JWT access tokens and rotating refresh tokens.
- **OAuth:** Google OAuth authentication.
- **Organization Management:** Create and manage organizations.
- **Team Management:** Organize members into teams.
- **Role-Based Access Control:** Manage permissions through roles.
- **API Key Management:** Create, manage, and revoke API keys.
- **Rate Limiting:** Protect APIs against excessive requests.
- **Usage Analytics:** Monitor API request activity and usage.
- **Audit Logs:** Track important organization and security-related activities.

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- Axios

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Google OAuth

**Deployment**
- Vercel — Frontend
- Render — Backend

## Architecture

APIShield follows a client-server architecture.

- The React frontend communicates with the backend through REST APIs.
- The Express backend handles authentication, authorization, business logic, and API requests.
- MongoDB stores application data.
- JWT access tokens authenticate requests, while refresh tokens support session renewal.

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB

### Clone the repository

```bash
git clone https://github.com/adityap-2005/APIShield
cd APIShield
```

### Backend Setup

```bash
cd server
npm install
```

Configure the backend environment variables in a `.env` file.

```env
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_ACCESS_EXPIRES_IN=
FRONTEND_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
```

Start the backend:

```bash
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
```

Configure the frontend environment:

```env
VITE_API_BASE_URL=
```

Start the frontend:

```bash
npm run dev
```

## Live Application

- **Frontend:** https://apishield-app.vercel.app
- **Backend:** https://apishield-backend-kgh1.onrender.com

## Project Status

APIShield V1 is implemented and deployed. The project focuses on developer access management, API key security, organization-level permissions, and usage monitoring.

## Future Improvements

- Automated API key rotation and expiration.
- IP allowlisting.
- Usage quotas and alerts.
- Improved webhook reliability.
- Advanced analytics.

---

**APIShield — Secure your APIs. Manage access. Monitor usage.**
