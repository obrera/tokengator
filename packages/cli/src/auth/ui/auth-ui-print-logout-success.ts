export function authUiPrintLogoutSuccess(args: { profile: string; revokeFailed?: boolean }) {
  console.log(`Logged out profile "${args.profile}".`)

  if (args.revokeFailed) {
    console.log('Remote API key revoke failed or the key was already invalid; local credentials were cleared.')
  }
}
