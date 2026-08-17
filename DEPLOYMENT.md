# M&E Assistant Deployment Guide

## Purpose

This guide explains how to deploy M&E Assistant for staging or controlled beta use.

M&E Assistant is a source-backed Monitoring and Evaluation knowledge assistant. It uses a React frontend, Node/Express backend, MongoDB Atlas, Qdrant, OpenAI, Google Drive, and optional Google Document AI OCR.

## Recommended controlled beta stack

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Vector database: Qdrant Cloud
- AI services: OpenAI API
- Anti-bot protection: Cloudflare Turnstile

## Required backend environment variables

Set these on the backend hosting platform:

```env
PORT=4000
NODE_ENV=production
APP_NAME=M&E Assistant API
APP_BASE_URL_WEB=https://your-frontend-domain.com
APP_BASE_URL_API=https://your-backend-domain.com

MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=1d
LOGIN_TEMP_JWT_SECRET=
LOGIN_TEMP_JWT_EXPIRES_IN=10m

EMAIL_OTP_ENABLED=false
EMAIL_OTP_EXPIRES_MINUTES=10

TURNSTILE_ENABLED=true
TURNSTILE_SECRET_KEY=

GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_LOCATION=us
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=

OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_EVALUATION_MODEL=gpt-4.1-mini

QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=me_assistant_chunks

RAG_TOP_K=5
RAG_MIN_SCORE=0.2
RAG_CANDIDATE_K=20
RAG_MAX_CHUNKS_PER_DOCUMENT=2

CHAT_RATE_LIMIT_WINDOW_MINUTES=10
CHAT_RATE_LIMIT_MAX_REQUESTS=30
EVALUATION_RATE_LIMIT_WINDOW_MINUTES=10
EVALUATION_RATE_LIMIT_MAX_REQUESTS=20

DAILY_CHAT_LIMIT_PER_USER=100
DAILY_EVALUATION_LIMIT_PER_ADMIN=50
MAX_CHAT_MESSAGE_LENGTH=4000