import pc from 'picocolors'

export function configUiPrintUseProfileSuccess(profile: string) {
  console.log(pc.green(`Using profile "${profile}".`))
}
