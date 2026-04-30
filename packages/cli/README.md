# tokengator

CLI package for Tokengator.

## CLI

```bash
tokengator asset-groups create --address <address> --label <label> --type collection
tokengator asset-groups delete <asset-group-id> --yes
tokengator asset-groups get <asset-group-id>
tokengator asset-groups index <asset-group-id>
tokengator asset-groups index-runs <asset-group-id>
tokengator asset-groups list
tokengator asset-groups lookup <address>
tokengator asset-groups update <asset-group-id> --label <label>
tokengator communities create --name <name> --owner-user-id <user-id> --slug <slug>
tokengator communities delete <organization-id> --yes
tokengator communities get <organization-id>
tokengator communities list
tokengator communities owner-candidates
tokengator communities update <organization-id> --name <name>
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

Admin API commands use the active profile by default. Pass `--profile <profile>` to use another profile,
`--verbose` to print failed request details, and `--json` to print raw JSON responses for scripts.

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
