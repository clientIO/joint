import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Dedupe React so the server render and `@joint/react`'s hooks share ONE React
  // instance. A single hoisted React copy is enforced via the monorepo root
  // `resolutions` field; this keeps Vite's own graph deduped too.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // Transform the `@joint/*` packages through Vite (don't externalize them for
  // SSR) so `<Paper>` renders with the shim installed by `@joint/react/server`.
  // React stays externalized — Node loads its CJS natively.
  ssr: {
    noExternal: ['@joint/react', '@joint/core', '@joint/svg-shim'],
  },
  plugins: [react(), tailwindcss()],
});
