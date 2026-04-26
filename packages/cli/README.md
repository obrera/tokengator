# tokengator

CLI package for Tokengator.

## CLI

```bash
tokengator config get
tokengator config get api-url
tokengator config init
tokengator config path
tokengator config profiles create default --api-url http://localhost:3000
tokengator config profiles delete default
tokengator config profiles list
tokengator config profiles use default
tokengator config set api-url https://api.tokengator.app
```

## Config

Tokengator stores local CLI config as JSON in the platform config directory resolved by
[`env-paths`](https://www.npmjs.com/package/env-paths).

Use `tokengator config path` to print the exact file path. For tests and local isolation, set
`TOKENGATOR_CONFIG_HOME` to override the directory that contains `config.json`.

The config starts with profile-scoped API URLs:

```json
{
  "activeProfile": "default",
  "profiles": {
    "default": {
      "apiUrl": "https://api.tokengator.app"
    }
  }
}
```

Run `tokengator config init` to create or update a profile interactively. The onboarding prompt offers
`http://localhost:3000`, `https://dev.tokengator.app`, or a custom API URL.

## Development

```bash
bun run build
bun run check-types
bun test
```
