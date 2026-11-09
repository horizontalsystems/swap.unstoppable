// pm2 process definition for the web client. deploy/deploy.sh copies this file into every release
// folder and starts it from there (`pm2 start <release>/ecosystem.config.js`), so cwd is the release itself:
// the Next.js standalone server (server.js) resolves .next/ and public/ relative to it.
//
// The runtime settings (the proxies' RPC URLs and keys, TRUSTED_PROXY_HOPS) are NOT in the release:
// releases are replaced on every deploy, the .env next to the git checkout is not. Node loads it
// before the server starts; a missing file stops the process instead of starting it without them.
const path = require('path')
const os = require('os')

const envFile = process.env.SWAP_WEB_ENV_FILE || path.join(os.homedir(), 'swap.unstoppable', '.env')

module.exports = {
  apps: [
    {
      name: 'swap-web',
      script: 'server.js',
      cwd: __dirname,
      node_args: [`--env-file=${envFile}`],
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
        HOSTNAME: '127.0.0.1' // reachable through nginx only
      }
    }
  ]
}
