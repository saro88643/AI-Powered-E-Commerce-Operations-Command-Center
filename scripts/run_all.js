const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('   ShopSphere AI-Powered Operations Command Center Launcher     ');
console.log('================================================================');
console.log('Starting all microservices, backend API, AI service, and web UI...\n');

const services = [
  {
    name: 'EXTERNAL-APIS',
    command: 'node',
    args: ['services/run_services.js'],
    cwd: rootDir,
    prefixColor: '\x1b[35m', // Magenta
  },
  {
    name: 'PYTHON-AI-SERVICE',
    command: 'python',
    args: ['apps/ai-service/run.py'],
    cwd: rootDir,
    prefixColor: '\x1b[36m', // Cyan
  },
  {
    name: 'EXPRESS-GATEWAY',
    command: 'node',
    args: ['apps/backend/src/server.js'],
    cwd: rootDir,
    prefixColor: '\x1b[32m', // Green
  },
  {
    name: 'VITE-WEB-UI',
    command: 'npm',
    args: ['--prefix', 'apps/web', 'run', 'dev'],
    cwd: rootDir,
    prefixColor: '\x1b[34m', // Blue
  }
];

const processes = [];

services.forEach((svc) => {
  const p = spawn(svc.command, svc.args, {
    cwd: svc.cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  p.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${svc.prefixColor}[${svc.name}]\x1b[0m ${line}`);
      }
    });
  });

  p.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${svc.prefixColor}[${svc.name} ERROR]\x1b[0m ${line}`);
      }
    });
  });

  p.on('close', (code) => {
    console.log(`${svc.prefixColor}[${svc.name}]\x1b[0m Process exited with code ${code}`);
  });

  processes.push(p);
});

function cleanup() {
  console.log('\nGracefully shutting down all ShopSphere services...');
  processes.forEach((p) => {
    try {
      p.kill();
    } catch (e) {}
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
