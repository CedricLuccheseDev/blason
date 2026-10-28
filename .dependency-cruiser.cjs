// Architecture made executable: the rules the family actually needs.
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'A cycle is a module boundary that failed',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'engine-depends-on-nothing',
      comment:
        'The simulation runs the same everywhere: it imports neither the app, nor React, Pixi or Convex (SOLID, D)',
      severity: 'error',
      from: { path: '^engine/' },
      to: {
        path: [
          '^src/',
          '^scripts/',
          '^design/',
          'node_modules/(react|react-dom|pixi\\.js|convex)/',
        ],
      },
    },
    {
      name: 'engine-through-its-contract',
      comment:
        'Outside the engine, only engine/index.ts is imported: its contract, not its insides (SOLID, D)',
      severity: 'error',
      from: { pathNot: '^engine/' },
      to: { path: '^engine/', pathNot: '^engine/index\\.ts$' },
    },
    {
      name: 'relay-apart-from-the-app',
      comment:
        'The protocol and the relay run on the server too: they import neither the app nor the browser (SOLID, D)',
      severity: 'error',
      from: { path: '^(net|server)/' },
      to: {
        path: [
          '^src/',
          '^scripts/',
          'node_modules/(react|react-dom|pixi\\.js)/',
        ],
      },
    },
    {
      name: 'convex-stays-isolated',
      comment: 'Convex functions deploy alone: they never import app code',
      severity: 'error',
      from: { path: '^convex' },
      to: { path: '^src' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    exclude: { path: ['routeTree\\.gen', '_generated'] },
  },
}
