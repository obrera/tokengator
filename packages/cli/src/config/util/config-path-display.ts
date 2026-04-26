import { homedir } from 'node:os'
import { sep } from 'node:path'

export function formatPathForDisplay(path: string): string {
  const home = homedir()

  if (path === home) {
    return '~'
  }

  if (path.startsWith(`${home}${sep}`)) {
    return `~${sep}${path.slice(home.length + sep.length)}`
  }

  return path
}
