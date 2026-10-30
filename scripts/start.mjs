import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const child = spawn(process.execPath, ['src/server.js'], { cwd: fileURLToPath(new URL('../backend/', import.meta.url)), stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });
child.on('exit', code => { process.exitCode = code || 0; });
child.on('error', error => { console.error(error); process.exitCode = 1; });
process.on('SIGINT', () => child.kill());
process.on('SIGTERM', () => child.kill());
