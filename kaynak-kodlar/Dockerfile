# Official Node image (Node 26 is the newest LTS line that has a bookworm-slim tag).
FROM node:26-bookworm-slim

# ffmpeg is needed by spotdl. Debian bookworm ships Python 3.11, which spotdl supports.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip python3-venv ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Virtualenv first on PATH: avoids the PEP 668 "externally-managed-environment" error.
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Python dependencies in their own layer, so code edits do not reinstall them.
# The deno package (PyPI) gives yt-dlp the JavaScript runtime it needs for some YouTube videos.
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt "deno>=2.3,<3"

ENV NEXT_TELEMETRY_DISABLED=1 \
    DOWNLOAD_DIR=/app/downloads

# /app and the downloads folder belong to the non-root "node" user (uid 1000, HOME=/home/node).
RUN mkdir -p /app/downloads && chown -R node:node /app
USER node
WORKDIR /app

# Node dependencies (cached until package*.json change).
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

# App code and production build.
COPY --chown=node:node . .
RUN npm run build

EXPOSE 3000

# Healthy when the queue API answers.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/queue').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Inside the container the server must listen on 0.0.0.0; docker-compose limits the host side to localhost.
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
