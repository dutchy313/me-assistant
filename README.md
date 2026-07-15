# M&E Assistant

M&E Assistant is a source-backed Monitoring and Evaluation assistant built for evidence teams. Users can ask M&E questions and receive answers grounded in a private document library with citations.

Designed by the Evidence and Intelligence team at Cloneshouse.

---

## What the app does

M&E Assistant helps teams:

- Upload and sync M&E books, manuals, reports, and PDFs from Google Drive
- Extract text from PDFs
- OCR scanned PDFs using Google Cloud Document AI
- Split source text into searchable chunks
- Embed chunks with OpenAI embeddings
- Store vectors in Qdrant
- Ask questions through a chat interface
- Show citations for retrieved source chunks
- Collect user feedback
- Evaluate RAG answers with an AI evaluator
- Review answer quality through an admin dashboard

---

## Architecture

```txt
React Web App
   ↓
Node.js / Express API
   ↓
MongoDB Atlas
   ↓
Qdrant Vector DB
   ↓
OpenAI API
   ↓
Google Drive + Document AI OCR
```

### Main services

- **Web:** React + Vite + Redux Toolkit + Axios
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas + Mongoose
- **Vector DB:** Qdrant Cloud
- **AI:** OpenAI chat and embedding models
- **OCR:** Google Cloud Document AI
- **Document source:** Google Drive
- **Testing:** Vitest

---

## Project structure

```txt
me-assistant/
  backend/
    src/
      config/
      controllers/
      middlewares/
      models/
      routes/
      scripts/
      services/
      tests/
      utils/
      validations/
    .env.example
    package.json

  web/
    src/
      api/
      components/
      pages/
      store/
    .env.example
    package.json

  README.md
  DEPLOYMENT.md
  BETA_ADMIN_CHECKLIST.md
```

---

## Prerequisites

Install these before running the project:

- Node.js 20+
- npm
- Git
- MongoDB Atlas account
- Qdrant Cloud account
- OpenAI API key
- Google Cloud project with Document AI enabled
- Google Drive folder containing your PDF source library

---

## Local setup

### 1. Clone the project

```powershell
git clone <your-repository-url>
cd me-assistant
```

### 2. Install backend dependencies

```powershell
cd backend
npm install
```

### 3. Create backend environment file

```powershell
Copy-Item .env.example .env
```

Then edit:

```txt
backend/.env
```

Add your real values.

Never commit `.env`.

### 4. Start backend

```powershell
npm run dev
```

Expected:

```txt
MongoDB connected successfully
M&E Assistant API running on port 4000
Health check: http://localhost:4000/api/v1/health
Readiness check: http://localhost:4000/api/v1/ready
```

### 5. Install frontend dependencies

Open a second terminal:

```powershell
cd web
npm install
```

### 6. Create frontend environment file

```powershell
Copy-Item .env.example .env
```

Confirm this value for local development:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

### 7. Start frontend

```powershell
npm run dev
```

Open:

```txt
http://localhost:5173
```

---

## Useful backend commands

```powershell
npm run dev
npm run start
npm run test
npm run test:watch
npm run make:admin
```

---

## Useful frontend commands

```powershell
npm run dev
npm run build
npm run preview
```

---

## Admin workflow

### Source library workflow

```txt
Upload PDFs to Google Drive
↓
Admin → Documents → Sync Drive
↓
Process batch
↓
Run OCR where needed
↓
Admin → Vectors → Embed pending chunks
↓
Test retrieval in Retrieval Lab
↓
Ask questions in Chat
```

### RAG evaluation workflow

```txt
Ask question
↓
System saves RAG evaluation snapshot
↓
Admin → Evaluations
↓
Evaluate snapshot
↓
Review answer, context, and citations
↓
Mark reviewed
```

---

## Testing

Run backend tests:

```powershell
cd backend
npm run test
```

Before controlled beta, also run:

```powershell
cd web
npm run build
```

---

## Security notes

- Never commit `.env`
- Never paste secrets into source code
- JWT secrets must be long and random
- OTP codes must never be logged in production
- Admin routes require authentication and admin role
- Chat and evaluation routes have rate limits and daily usage limits
- Frontend tokens currently use browser storage; for higher-security public launch, consider HttpOnly cookie auth

---

## Deployment

See:

```txt
DEPLOYMENT.md
```

---

## Beta operations

See:

```txt
BETA_ADMIN_CHECKLIST.md
```
