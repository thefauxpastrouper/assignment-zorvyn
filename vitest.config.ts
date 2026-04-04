import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^services\/(.*)$/, replacement: path.resolve(__dirname, 'src/services/$1') },
      { find: /^utils\/(.*)$/, replacement: path.resolve(__dirname, 'src/utils/$1') },
      { find: /^controllers\/(.*)$/, replacement: path.resolve(__dirname, 'src/controllers/$1') },
      { find: /^middleware\/(.*)$/, replacement: path.resolve(__dirname, 'src/middleware/$1') },
      { find: /^validators\/(.*)$/, replacement: path.resolve(__dirname, 'src/validators/$1') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
    },
  },
});
