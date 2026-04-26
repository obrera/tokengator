export type AuthBrowserSpawn = (command: string[]) => { exited: Promise<number> }

function getOpenCommand(url: string) {
  if (process.platform === 'darwin') {
    return ['open', url]
  }

  if (process.platform === 'win32') {
    return ['cmd', '/c', 'start', '', url]
  }

  return ['xdg-open', url]
}

const defaultSpawn: AuthBrowserSpawn = (command) =>
  Bun.spawn(command, {
    stderr: 'ignore',
    stdout: 'ignore',
  })

export async function openAuthBrowser(args: {
  spawn?: AuthBrowserSpawn
  url: string
  writeLine?: (message: string) => void
}): Promise<void> {
  const spawn = args.spawn ?? defaultSpawn
  const writeLine = args.writeLine ?? console.log

  try {
    const exitCode = await spawn(getOpenCommand(args.url)).exited

    if (exitCode === 0) {
      return
    }
  } catch {
    // Fall through to the manual URL output below.
  }

  writeLine(`Open this URL to authorize the CLI: ${args.url}`)
}
