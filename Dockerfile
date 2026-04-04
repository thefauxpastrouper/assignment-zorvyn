FROM oven/bun:latest AS builder

WORKDIR /app

# Copy dependency manifests first for better build caching
COPY package.json .
COPY bun.lock* .

# Install all dependencies so Prisma client can be generated
RUN bun install

# Copy source code and Prisma schema
COPY tsconfig.json .
COPY src ./src

# Generate the Prisma client
RUN bun prisma generate --schema=src/services/prisma/schema.prisma

FROM oven/bun:latest
WORKDIR /app

# Copy app files and generated node_modules from the builder stage
COPY --from=builder /app /app

# Install production deps only in the final image
RUN bun install --production

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
