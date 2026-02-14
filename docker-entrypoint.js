const fs = require('fs');
const path = require('path');

console.log('--- GURU RESTO ENTRYPOINT STARTING ---');
console.log(`Time: ${new Date().toISOString()}`);
console.log(`Node Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);

// Check for .env file (though usually Docker provides env vars directly)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('Found .env file, loading...');
    // Simple parsing if dotenv isn't available/working for some reason (though process.env should ideally be populated by platform)
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [key, ...values] = trimmed.split('=');
                const value = values.join('=').replace(/^["']|["']$/g, ''); // Basic strip quotes
                if (!process.env[key]) {
                    process.env[key] = value;
                    console.log(`Loaded env var: ${key}`);
                }
            }
        });
    } catch (err) {
        console.error('Error loading .env:', err);
    }
} else {
    console.log('No .env file found in /app. Assuming environment variables are injected by host.');
}

// Log critical variables (masked)
console.log('DATABASE_URL is ' + (process.env.DATABASE_URL ? 'SET' : 'MISSING'));
console.log('AUTH_SECRET is ' + (process.env.AUTH_SECRET ? 'SET' : 'MISSING'));

// Start the Next.js Standalone Server
// In the runner stage, we copy .next/standalone contents to /app.
// So the Next.js server file is at /app/server.js
const nextServerPath = path.join(__dirname, 'server.js');

if (fs.existsSync(nextServerPath)) {
    console.log(`Found Next.js server at ${nextServerPath}. Starting...`);
    try {
        require(nextServerPath);
    } catch (err) {
        console.error('FATAL: Failed to start Next.js server:', err);
        process.exit(1);
    }
} else {
    console.error(`FATAL: Next.js server file not found at ${nextServerPath}`);
    console.log('Directory listing of /app:');
    try {
        console.log(fs.readdirSync(__dirname));
    } catch (e) {
        console.error('Cannot list directory');
    }
    process.exit(1);
}
