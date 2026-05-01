import { cancel, confirm, isCancel } from '@clack/prompts'

export async function coreUiConfirmDestructiveAction(input: { message: string; yes?: boolean }): Promise<void> {
  if (input.yes) {
    return
  }

  if (!process.stdin.isTTY) {
    throw new Error('Pass --yes to confirm this destructive action.')
  }

  const answer = await confirm({
    initialValue: false,
    message: input.message,
  })

  if (isCancel(answer)) {
    cancel('Cancelled.')
    throw new Error('Cancelled.')
  }

  if (!answer) {
    cancel('Cancelled.')
    throw new Error('Cancelled.')
  }
}
