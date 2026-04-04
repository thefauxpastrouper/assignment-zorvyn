FROM oven/bun:latest

WORKDIR /app

# Copy dependency manifests first for better build caching
COPY package.json .
COPY bun.lock* .

# Copy source and config files
COPY tsconfig.json .
COPY src ./src

# Install production dependencies only
RUN bun install --production

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
