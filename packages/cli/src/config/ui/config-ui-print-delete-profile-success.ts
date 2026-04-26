import pc from 'picocolors'

export function configUiPrintDeleteProfileSuccess(profile: string) {
  console.log(pc.green(`Deleted profile "${profile}".`))
}
