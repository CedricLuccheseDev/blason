import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  // Single source of truth for the version: package.json, bumped by
  // /dev-release. Read at build time so the footer cannot drift from the
  // build that is actually deployed.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 3000,
    // The design boards and the maquette are not the app: what they write
    // (design/maquette captures the game's pages) must not reload them.
    watch: { ignored: ['**/design/**'] },
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart(),
    viteReact(),
  ],
})
