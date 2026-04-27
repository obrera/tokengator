import { Command } from 'commander'

import { authFeatureLogin } from './auth-feature-login'
import { authFeatureLogout } from './auth-feature-logout'
import { authFeatureWhoami } from './auth-feature-whoami'

type AuthCommandOptions = {
  profile?: string
  verbose?: boolean
}

type AuthLoginCommandOptions = AuthCommandOptions & {
  open?: boolean
}

export function createAuthCommand(): Command {
  const authCommand = new Command('auth').description('Manage Tokengator CLI authentication.').action(() => {
    authCommand.outputHelp()
  })

  authCommand
    .command('login')
    .description('Log in by approving CLI access in a browser.')
    .option('--no-open', 'Print the authorization URL without opening a browser.')
    .option('--profile <profile>', 'Profile to authenticate.')
    .option('--verbose', 'Show API request failure details.')
    .action(async (options: AuthLoginCommandOptions) => {
      await authFeatureLogin({
        noOpen: options.open === false,
        profile: options.profile,
        verbose: options.verbose,
      })
    })

  authCommand
    .command('logout')
    .description('Log out and revoke the stored CLI API key.')
    .option('--profile <profile>', 'Profile to log out.')
    .option('--verbose', 'Show API request failure details.')
    .action(async (options: AuthCommandOptions) => {
      await authFeatureLogout({
        profile: options.profile,
        verbose: options.verbose,
      })
    })

  authCommand
    .command('whoami')
    .description('Show the signed-in CLI user.')
    .option('--profile <profile>', 'Profile to inspect.')
    .option('--verbose', 'Show API request failure details.')
    .action(async (options: AuthCommandOptions) => {
      await authFeatureWhoami({
        profile: options.profile,
        verbose: options.verbose,
      })
    })

  return authCommand
}
