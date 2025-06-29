import { esbuildPlugin } from '@web/dev-server-esbuild'
export default {
  concurrency: 3,
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true, target: 'auto' })],
  filterBrowserLogs: log => !log.args?.at(0)?.startsWith('Lit is in dev mode'),
}
