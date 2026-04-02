async function main() {
  const processResult = Bun.spawn({
    cmd: ['bun', 'run', '--cwd', 'apps/web', 'dist/server/server.js'],
    cwd: import.meta.dir + '/..',
    env: process.env,
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'inherit',
  })

  process.exitCode = await processResult.exited
}

await main()
