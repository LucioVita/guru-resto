# 🚀 Quick Start - Desplegar en Easypanel

## 1️⃣ Push a GitHub (5 min)

```bash
git add .
git commit -m "Preparar para deployment en Easypanel"
git push origin main
```

## 2️⃣ Crear Proyecto en Easypanel (10 min)

1. **Acceder a Easypanel** → https://panel.tu-dominio.com
2. **+ New Project** → **GitHub** → Seleccionar repo
3. **Configurar:**
   - Service Name: `guru-resto`
   - Build: `Dockerfile`
   - Port: `3000`
   - Domain: `gururesto.guruweb.com.ar`
   - HTTPS: ✅

## 3️⃣ Variables de Entorno

```bash
DATABASE_URL=mysql://u938616704_guru_user:GuruR357o_2026@srv716.hstgr.io:3306/u938616704_gururesto
AUTH_SECRET=<ejecutar: openssl rand -base64 32>
AUTH_URL=https://gururesto.guruweb.com.ar
AUTH_TRUST_HOST=true
NODE_ENV=production
```

## 4️⃣ Deploy

Click en **Deploy** y espera 3-5 minutos.

---

**📖 Guía completa:** Ver `DEPLOYMENT.md`  
**⚙️ Configuración detallada:** Ver `easypanel-config-example.md`
