import { spawn, argv } from 'bun';

const [command] = argv.slice(2); 

if (command === 'dev') {
  console.log('Starting dev server with Bun (with watch mode)...');
  spawn(['bun', '--watch', 'src/server/index.ts']);
} else if (command === 'start') {
  console.log('Starting production server with Bun...');
  spawn(['bun', 'run', 'src/server/index.ts']);
} else {
  console.log('Commands: dev | start');
}