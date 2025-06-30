import { esbuildPlugin } from '@web/dev-server-esbuild'
export default {
  // concurrency: 1,
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true, target: 'auto' })],
  filterBrowserLogs: log => {
    const first = !log.args?.at(0)
    return typeof first === 'string' && first?.startsWith('Lit is in dev mode')
  },
}
