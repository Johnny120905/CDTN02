# ==============================================================================
# STAGE 1: Build React + Vite Frontend (includes Three.js 3D & Tailwind CSS)
# ==============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==============================================================================
# STAGE 2: Python Flask + Socket.IO Unified Server (Serves API + SPA + WebRTC)
# ==============================================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8002 \
    DEBUG=False

WORKDIR /app

# Install Python dependencies
COPY Backend/requirements.txt ./Backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r Backend/requirements.txt

# Copy Backend source code
COPY Backend/ ./Backend/

# Copy compiled Frontend static bundle from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8002

# Healthcheck against /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import os, urllib.request; port=os.environ.get('PORT','8002'); urllib.request.urlopen(f'http://127.0.0.1:{port}/api/health', timeout=4)" || exit 1

CMD ["python", "Backend/server.py"]
