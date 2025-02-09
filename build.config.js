const { build } = require('esbuild');

build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/server.js',
  external: ['express', '@neondatabase/serverless'],
}).catch(() => process.exit(1));
