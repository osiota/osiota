FROM node:26.1.0-trixie-slim

# /cache for caching applications code
# /data for configuration and persistent data
# /config for configuration (mount from host)
VOLUME ["/cache", "/data"]
WORKDIR /app
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["--config", "/config/osiota.json"]

# Install required system dependencies
RUN apt-get update && apt-get install -y \
  build-essential \
  pkg-config \
  ca-certificates \
  wget \
  python3 \
  python3-pip \
  iputils-ping \
  jq \
  git \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
COPY ./src/package*.json /app

RUN npm install --omit=dev --omit=optional --omit=peer

WORKDIR /data

COPY ./src/ /app

