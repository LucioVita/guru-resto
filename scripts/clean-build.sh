#!/bin/bash
# Script para limpiar build anterior y reconstruir limpiamente
echo "🧹 Limpiando build anterior..."
rm -rf .next
echo "✅ Carpeta .next eliminada"
echo "🔨 Ejecutando build limpio..."
npm run build
