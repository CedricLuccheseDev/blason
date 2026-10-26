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
