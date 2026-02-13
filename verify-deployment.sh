#!/bin/bash

# Script de verificación pre-deployment
# Verifica que todos los archivos necesarios estén presentes antes de hacer push

echo "🔍 Verificando configuración para deployment en Easypanel..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0
WARNINGS=0

# Función para verificar archivos
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 existe"
        return 0
    else
        echo -e "${RED}✗${NC} $1 NO existe"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Función para verificar contenido
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 contiene '$2'"
        return 0
    else
        echo -e "${RED}✗${NC} $1 NO contiene '$2'"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Función para advertencias
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

echo "📦 Verificando archivos Docker..."
check_file "Dockerfile"
check_file ".dockerignore"
echo ""

echo "⚙️ Verificando configuración Next.js..."
check_file "next.config.ts"
check_content "next.config.ts" "output.*standalone"
echo ""

echo "📄 Verificando documentación..."
check_file "DEPLOYMENT.md"
check_file "easypanel-config-example.md"
check_file ".env.example"
echo ""

echo "🔒 Verificando seguridad..."
# Verificar que .env no esté en git
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo -e "${RED}✗${NC} .env está en git (PELIGRO: contiene credenciales)"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} .env NO está en git"
fi

# Verificar que ,env no esté en git
if git ls-files --error-unmatch ,env 2>/dev/null; then
    echo -e "${RED}✗${NC} ,env está en git (PELIGRO: contiene credenciales)"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} ,env NO está en git"
fi

# Verificar .env.production
if git ls-files --error-unmatch .env.production 2>/dev/null; then
    warn ".env.production está en git (revisar si contiene credenciales)"
else
    echo -e "${GREEN}✓${NC} .env.production NO está en git"
fi
echo ""

echo "🔍 Verificando que no haya credenciales hardcodeadas..."
# Buscar la contraseña en archivos de código
if grep -r "GuruR357o_2026" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null; then
    echo -e "${RED}✗${NC} Credenciales encontradas en código fuente!"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} No se encontraron credenciales en código"
fi
echo ""

echo "📋 Verificando package.json..."
check_file "package.json"
if [ -f "package.json" ]; then
    if grep -q '"build"' package.json; then
        echo -e "${GREEN}✓${NC} Script 'build' encontrado en package.json"
    else
        echo -e "${RED}✗${NC} Script 'build' NO encontrado en package.json"
        ERRORS=$((ERRORS + 1))
    fi
fi
echo ""

echo "📊 Verificando dependencias..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules existe"
else
    warn "node_modules no existe (ejecuta 'npm install')"
fi
echo ""

# Resumen final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Verificación completada exitosamente!${NC}"
    echo ""
    echo "📝 Próximos pasos:"
    echo "   1. git add ."
    echo "   2. git commit -m 'Preparar para deployment en Easypanel'"
    echo "   3. git push origin main"
    echo "   4. Configurar en Easypanel (ver DEPLOYMENT.md)"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Se encontraron $ERRORS errores${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ Se encontraron $WARNINGS advertencias${NC}"
    fi
    echo ""
    echo "Por favor, corrige los errores antes de continuar."
    echo ""
    exit 1
fi
