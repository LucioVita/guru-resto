# Guía de Despliegue en Hostinger VPS con Easypanel

Esta guía te ayudará a desplegar la aplicación **Guru Resto** en tu VPS de Hostinger usando Easypanel y GitHub.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ VPS de Hostinger con Easypanel instalado
- ✅ Acceso a Easypanel (generalmente en `https://tu-ip:3000` o dominio configurado)
- ✅ Repositorio Git del proyecto en GitHub
- ✅ Base de datos MySQL configurada en Hostinger (ya configurada: `u938616704_gururesto`)
- ✅ Dominio o subdominio apuntando al VPS (ya configurado: `gururesto.guruweb.com.ar`)

## 🚀 Paso 1: Preparar el Repositorio en GitHub

1. **Asegúrate de que todos los cambios estén en GitHub:**

```bash
# En tu máquina local, en el directorio del proyecto
git add .
git commit -m "Preparar app para deployment en Easypanel"
git push origin main
```

2. **Verifica que los siguientes archivos estén presentes en el repositorio:**
   - `Dockerfile`
   - `.dockerignore`
   - `next.config.ts` (con `output: 'standalone'`)
   - `.env.example`
   - `package.json`

⚠️ **IMPORTANTE:** No subas archivos `.env` con credenciales reales. Solo `.env.example` debe estar en Git.

## 🎯 Paso 2: Crear Proyecto en Easypanel

1. **Accede a tu panel de Easypanel:**
   - URL: `https://panel.tu-dominio.com` (o la IP de tu VPS con puerto 3000)

2. **Crear nuevo proyecto:**
   - Click en **"+ New Project"**
   - Tipo: **"App"** → **"GitHub"**

3. **Conectar con GitHub:**
   - Si es la primera vez, autoriza Easypanel para acceder a tu cuenta de GitHub
   - Selecciona el repositorio: `LucioVita/guru-resto` (o el nombre de tu repo)
   - Rama: `main` (o la rama que uses para producción)

4. **Configurar el servicio:**
   
   **General Settings:**
   - **Service Name:** `guru-resto`
   - **Build Method:** Dockerfile
   - **Dockerfile Path:** `Dockerfile` (ruta desde la raíz del proyecto)

   **Environment Variables:** (ver sección siguiente)

   **Networking:**
   - **Port:** `3000`
   - **Domain:** `gururesto.guruweb.com.ar`
   - **Enable HTTPS:** ✅ (importante para NextAuth)

## 🔐 Paso 3: Configurar Variables de Entorno

En la sección **Environment** de Easypanel, agrega las siguientes variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | `mysql://u938616704_guru_user:GuruR357o_2026@srv716.hstgr.io:3306/u938616704_gururesto` | Conexión a MySQL |
| `AUTH_SECRET` | `(generar un secret aleatorio)` | Secret para NextAuth |
| `AUTH_URL` | `https://gururesto.guruweb.com.ar` | URL pública de la app |
| `AUTH_TRUST_HOST` | `true` | Necesario para reverse proxy |
| `NODE_ENV` | `production` | Ambiente de ejecución |

### 🔑 Generar AUTH_SECRET

Puedes generar un secret seguro con este comando:

```bash
openssl rand -base64 32
```

O usa esta alternativa en Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## ⚙️ Paso 4: Configurar Build y Deploy

1. **Build Settings (ya configuradas en Dockerfile):**
   - El Dockerfile maneja todo automáticamente
   - Multi-stage build optimizado
   - Output standalone para menor tamaño

2. **Deploy Settings:**
   - **Auto Deploy:** ✅ Activar (para deployar automáticamente en cada push a `main`)
   - **Health Check Path:** `/` (opcional, Next.js manejará esto)

3. **Resources (opcional):**
   - **Memory Limit:** `512MB` mínimo (recomendado: `1GB`)
   - **CPU Limit:** Default está bien para comenzar

## 🎬 Paso 5: Iniciar el Despliegue

1. **Click en "Deploy"** o "Create & Deploy"

2. **Monitorear el build:**
   - Ve a **"Logs"** en el panel del servicio
   - Verás el proceso de build de Docker
   - El build puede tomar 3-5 minutos la primera vez

3. **Esperar a que el servicio esté "Running":**
   - Estado: `🟢 Running`
   - El indicador cambiará de amarillo a verde

## ✅ Paso 6: Verificar el Despliegue

1. **Accede a tu aplicación:**
   - URL: `https://gururesto.guruweb.com.ar`

2. **Verificar funcionalidad:**
   - ✅ La página principal carga correctamente
   - ✅ Puedes iniciar sesión
   - ✅ La conexión a la base de datos funciona
   - ✅ Los datos se muestran correctamente

3. **Revisar logs si hay problemas:**
   - En Easypanel: **Logs** → **Application Logs**
   - Busca errores de conexión a DB, autenticación, etc.

## 🔄 Despliegues Automáticos

Una vez configurado, cada vez que hagas `git push` a la rama `main`:

1. GitHub notifica a Easypanel del nuevo commit
2. Easypanel descarga el código automáticamente
3. Construye una nueva imagen Docker
4. Reemplaza el contenedor antiguo con el nuevo
5. Tu app se actualiza sin downtime (rolling deployment)

**Para desactivar auto-deploy:**
- Ve a configuración del servicio → Deploy Settings
- Desactiva "Auto Deploy"

## 🐛 Troubleshooting

### La app no inicia (Status: Failed)

**Revisar logs:**
```
Easypanel → Tu Servicio → Logs
```

**Problemas comunes:**

1. **Error de conexión a base de datos:**
   - Verifica que `DATABASE_URL` esté correcta
   - Verifica que el usuario MySQL tiene permisos
   - Verifica que el host de la DB sea accesible desde el VPS

2. **Error de NextAuth:**
   - Verifica que `AUTH_SECRET` esté configurado
   - Verifica que `AUTH_URL` coincida con tu dominio (incluir `https://`)
   - Verifica que `AUTH_TRUST_HOST=true`

3. **Build falla:**
   - Revisa los logs de build
   - Verifica que `package.json` tenga todas las dependencias
   - Asegúrate de que `npm run build` funcione localmente

### La app carga pero no se ve correctamente

- **Problema de assets estáticos:**
  - Verifica que `.next/static` se esté copiando correctamente en el Dockerfile
  - Los estilos y JavaScript deben cargarse desde `/_next/static/`

### No puedo acceder por HTTPS

1. **Verifica configuración del dominio:**
   - El dominio debe apuntar a la IP del VPS
   - Espera unos minutos para propagación DNS

2. **Verifica certificado SSL:**
   - Easypanel debería generar certificado Let's Encrypt automáticamente
   - Puede tomar 1-2 minutos

## 📊 Monitoreo

**Ver logs en tiempo real:**
```
Easypanel → Servicio → Logs → Application
```

**Métricas de rendimiento:**
```
Easypanel → Servicio → Metrics
```
- CPU Usage
- Memory Usage
- Network Traffic

## 🔧 Comandos Útiles

**Acceder al contenedor (shell):**
```
Easypanel → Servicio → Terminal
```

**Reiniciar el servicio:**
```
Easypanel → Servicio → Restart
```

**Ver variables de entorno:**
```
Easypanel → Servicio → Environment
```

## 📝 Migrando desde Vercel

Si estabas usando Vercel antes:

1. **No elimines el proyecto de Vercel todavía** - úsalo como respaldo
2. **Verifica que todo funcione en Easypanel** durante unos días
3. **Actualiza el DNS** si es necesario (de Vercel a Hostinger)
4. **Cuando estés seguro**, puedes eliminar el proyecto de Vercel

## 🎉 ¡Listo!

Tu aplicación ahora está desplegada en tu propio VPS con:
- ✅ Despliegue automático desde GitHub
- ✅ HTTPS configurado
- ✅ Monitoreo y logs
- ✅ Control total del servidor

Para cualquier duda, consulta la [documentación oficial de Easypanel](https://easypanel.io/docs).
