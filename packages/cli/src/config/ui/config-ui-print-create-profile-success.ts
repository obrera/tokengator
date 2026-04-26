import pc from 'picocolors'

export function configUiPrintCreateProfileSuccess(profile: string) {
  console.log(pc.green(`Created profile "${profile}".`))
}
