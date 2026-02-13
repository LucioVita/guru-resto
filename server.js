const path = require('path');

// Configuración de Hostinger para Node.js
process.env.PORT = process.env.PORT || 3000;
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Importante: Cargar las variables de entorno si estamos en un contexto donde no se cargan automáticamente
// require('dotenv').config();

console.log('Iniciando servidor de Next.js standalone...');

// Ruta al servidor generado por Next.js standalone
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');

try {
    // Requerir el servidor generado
    require(standaloneServerPath);
} catch (error) {
    console.error('Error al iniciar el servidor standalone. ¿Corriste "npm run build"?');
    console.error(error);
    process.exit(1);
}
