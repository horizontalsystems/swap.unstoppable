// pm2 process definition for the web client. deploy/deploy.sh copies this file into every release
// folder and runs `pm2 startOrReload <release>/ecosystem.config.js`, so cwd is the release itself:
// the Next.js standalone server (server.js) resolves .next/ and public/ relative to it.
module.exports = {
  apps: [
    {
      name: 'swap-web',
      script: 'server.js',
      cwd: __dirname,
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
