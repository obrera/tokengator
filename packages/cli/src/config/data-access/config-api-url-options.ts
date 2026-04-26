export type ConfigApiUrlOption = {
  name: string
  url: string
}

export const configApiUrlOptions: ConfigApiUrlOption[] = [
  {
    name: 'local',
    url: 'http://localhost:3000',
  },
  {
    name: 'dev',
    url: 'https://dev.tokengator.app',
  },
]
