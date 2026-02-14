const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// --- SISTEMA DE DIAGNÓSTICO PARA HOSTINGER ---
const logFile = path.join(__dirname, 'server_debug.log');

function log(msg) {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${msg}`;
    console.log(message);
    try {
        fs.appendFileSync(logFile, message + '\n');
    } catch (e) {
        // Ignorar error de escritura de log
    }
}

log('>>> ARRANQUE DEL SERVIDOR NODE.JS (Hostinger) <<<');

// 1. CARGA DE VARIABLES .ENV (Manual, para asegurar lectura)
try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        log(`Leyendo archivo .env desde: ${envPath}`);
        const envContent = fs.readFileSync(envPath, 'utf8');

        envContent.split('\n').forEach(line => {
            let cleanLine = line.trim();
            if (!cleanLine || cleanLine.startsWith('#')) return;

            const separatorIndex = cleanLine.indexOf('=');
            if (separatorIndex > 0) {
                const key = cleanLine.substring(0, separatorIndex).trim();
                let value = cleanLine.substring(separatorIndex + 1).trim();

                // Remover comillas envolventes si las hay
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                // Definir si no existe o está vacío (Hostinger prioridad si están cargadas)
                if (!process.env[key] || process.env[key].trim() === "") {
                    process.env[key] = value;
                }
            }
        });
        log('Variables .env procesadas.');
        log('Check DATABASE_URL: ' + (process.env.DATABASE_URL ? 'CONFIGURADA' : 'FALTA'));
        log('Check AUTH_SECRET: ' + (process.env.AUTH_SECRET ? 'CONFIGURADA' : 'FALTA'));
        log('Check AUTH_URL: ' + (process.env.AUTH_URL || 'NO DEFINIDA (Usando default)'));
        log('Check AUTH_TRUST_HOST: ' + (process.env.AUTH_TRUST_HOST || 'FALTA'));
        log('Check NODE_ENV: ' + (process.env.NODE_ENV || 'FALTA (Defaulting to production or development)'));
    } else {
        log('Archivo .env no encontrado. Usando variables del sistema.');
    }
} catch (error) {
    log(`ERROR leyendo .env: ${error.message}`);
}

// 2. CONFIGURACIÓN NEXT.JS
const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

log(`Configurando Next.js en modo: ${dev ? 'development' : 'production'}`);
log(`Puerto asignado: ${port}`);

// Iniciar la app de Next
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            log(`ERROR request: ${err.message}`);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    })
        .once('error', (err) => {
            console.error(err);
            log(`ERROR CRÍTICO DEL SERVIDOR: ${err.message}`);
            process.exit(1);
        })
        .listen(port, () => {
            log(`> Servidor listo en http://${hostname}:${port}`);
            console.log(`> Ready on http://${hostname}:${port}`);
        });
}).catch((ex) => {
    console.error(ex.stack);
    log(`ERROR al preparar Next.js: ${ex.stack}`);
    process.exit(1);
});
