# DriveMind AI 🚗🧠

> Personalized Road Memory — A PWA that learns your driving habits and warns you before you reach dangerous spots.

---

## Architecture

```
drivemind-ai/
├── client/          # React PWA (Vite + Tailwind)
└── server/          # Node.js + Express REST API
```

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd drivemind-ai

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Environment variables

**server/.env**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/drivemind
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

**client/.env**
```
VITE_API_URL=http://localhost:5000/api
VITE_MAP_TILE=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### 3. Run locally

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

App runs at: http://localhost:5173

---

## Deployment

### Frontend → Vercel
```bash
cd client
npm run build
# Deploy /dist to Vercel
# Set VITE_API_URL=https://your-backend.onrender.com/api
```

### Backend → Render
1. Push server/ to GitHub
2. New Web Service on Render
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables in Render dashboard

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, get JWT |
| GET | /api/auth/me | Get current user |
| GET | /api/trips | Get all trips |
| POST | /api/trips | Create trip |
| GET | /api/trips/:id | Get trip details |
| PUT | /api/trips/:id/end | End active trip |
| POST | /api/trips/:id/events | Add risk event to trip |
| GET | /api/risk-zones | Get nearby risk zones |
| POST | /api/risk-zones | Create/update risk zone |
| GET | /api/analytics/dashboard | Dashboard stats |
| GET | /api/analytics/coach | AI coach insights |

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Leaflet.js
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT Auth
- **AI Engine**: Rule-based risk scoring (TensorFlow.js ready)
- **Maps**: OpenStreetMap + Leaflet
- **Hosting**: Vercel (client) + Render (server)
