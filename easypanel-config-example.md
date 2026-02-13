# Configuración de Referencia para Easypanel

Este documento contiene la configuración completa de referencia para el servicio en Easypanel.

## 📦 Service Configuration

### General Settings

```yaml
Service Name: guru-resto
Service Type: App (GitHub)
Repository: LucioVita/guru-resto (ajustar según tu repo)
Branch: main
Auto Deploy: Enabled
```

### Build Configuration

```yaml
Build Method: Dockerfile
Dockerfile Path: Dockerfile
Build Context: . (root del proyecto)
Build Args: (ninguno necesario)
```

### Environment Variables

```bash
# Database
DATABASE_URL=mysql://u938616704_guru_user:GuruR357o_2026@srv716.hstgr.io:3306/u938616704_gururesto

# Authentication (NextAuth v5)
AUTH_SECRET=<generar-con-openssl-rand-base64-32>
AUTH_URL=https://gururesto.guruweb.com.ar
AUTH_TRUST_HOST=true

# Environment
NODE_ENV=production
```

### Networking

```yaml
Port: 3000
Protocol: HTTP
Domain: gururesto.guruweb.com.ar
HTTPS: Enabled (Let's Encrypt)
Force HTTPS: Yes
```

### Resources

```yaml
Memory Limit: 1024MB (1GB)
Memory Reservation: 512MB
CPU Limit: 1.0
CPU Reservation: 0.5
```

### Health Check (opcional)

```yaml
Path: /
Interval: 30s
Timeout: 10s
Retries: 3
Start Period: 40s
```

### Volumes (no necesario)

```
No se requieren volúmenes persistentes.
Next.js genera los archivos estáticos en build time.
```

### Restart Policy

```yaml
Policy: unless-stopped
Max Retries: 3
```

## 🔄 Deploy Configuration

### Auto Deploy Settings

```yaml
Auto Deploy: Enabled
Deploy On Push: Yes
Deploy Branch: main
Deploy On Tag: No
```

### Build Triggers

```yaml
GitHub Webhook: Enabled (automático)
Manual Deploy: Available
```

## 🌐 Domain Configuration

### DNS Settings (Hostinger)

```
Type: A Record
Name: gururesto (subdominio)
Value: <IP-de-tu-VPS>
TTL: 14400 (o automático)
```

### SSL/TLS

```yaml
SSL Provider: Let's Encrypt
Auto Renew: Yes
Force HTTPS: Yes
HSTS: Enabled (opcional pero recomendado)
```

## 📊 Monitoring Configuration

### Logs

```yaml
Log Level: info
Max Log Size: 10MB
Log Retention: 7 days
```

### Metrics

```yaml
Enable Metrics: Yes
Metrics Endpoint: /metrics (si lo implementas)
Scrape Interval: 15s
```

## 🔐 Security Settings

### Environment Security

```yaml
Hide Environment Variables: Yes (en logs)
Encrypted Variables: Yes (Easypanel los encripta automáticamente)
```

### Network Security

```yaml
Expose Port Publicly: Only through Easypanel proxy
Direct Container Access: Disabled
Internal Network: Enabled (si tienes otros servicios)
```

## 🚀 Deployment Strategy

```yaml
Strategy: Rolling Update
Max Surge: 1
Max Unavailable: 0
Health Check Before Promote: Yes
Rollback On Failure: Yes
```

## 📝 Notas Importantes

### Para el AUTH_SECRET

Genera un secret seguro antes de configurar:

```bash
# Opción 1: Con OpenSSL
openssl rand -base64 32

# Opción 2: Con Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Para DATABASE_URL

El formato es:
```
mysql://usuario:contraseña@host:puerto/basededatos
```

Tu configuración actual:
```
Usuario: u938616704_guru_user
Contraseña: GuruR357o_2026
Host: srv716.hstgr.io
Puerto: 3306
Database: u938616704_gururesto
```

### Para AUTH_URL

**IMPORTANTE:** Debe coincidir EXACTAMENTE con el dominio público de tu aplicación, incluyendo el protocolo:

```bash
# ✅ Correcto
AUTH_URL=https://gururesto.guruweb.com.ar

# ❌ Incorrecto
AUTH_URL=http://gururesto.guruweb.com.ar  # sin HTTPS
AUTH_URL=gururesto.guruweb.com.ar         # sin protocolo
AUTH_URL=https://gururesto.guruweb.com.ar/ # con barra final
```

## 🔄 Actualizar Configuración

Para cambiar cualquier configuración después del despliegue inicial:

1. Ve a **Easypanel → Tu Servicio → Settings**
2. Modifica la configuración necesaria
3. Click en **Save**
4. Click en **Restart** (si es necesario)

## 🐳 Docker Configuration Summary

El Dockerfile incluye:
- Multi-stage build para optimización
- Node.js 20 Alpine (imagen ligera)
- Standalone output mode de Next.js
- Usuario no-root para seguridad
- Puerto 3000 expuesto
- Variables de entorno en runtime

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs:** Easypanel → Logs
2. **Verifica las variables:** Easypanel → Environment
3. **Documentación oficial:** https://easypanel.io/docs
4. **Comunidad:** https://discord.com/invite/easypanel
