# Dockerfile para Next.js 16 en Easypanel
FROM node:20-alpine AS base

# Instalar dependencias necesarias para compilación
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Builder stage - construir la aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Deshabilitar telemetría de Next.js durante build
ENV NEXT_TELEMETRY_DISABLED=1

# Declarar ARGs para variables de entorno en build time
ARG DATABASE_URL
ARG AUTH_SECRET
ARG AUTH_URL
ARG AUTH_TRUST_HOST
ARG NODE_ENV

# Hacer disponibles las variables durante el build
ENV DATABASE_URL=$DATABASE_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV AUTH_URL=$AUTH_URL
ENV AUTH_TRUST_HOST=$AUTH_TRUST_HOST
ENV NODE_ENV=$NODE_ENV

# Build de la aplicación
RUN npm run build

# Runner stage - imagen de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para ejecutar la aplicación
CMD ["node", "server.js"]
