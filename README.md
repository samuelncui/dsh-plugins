# dsh-plugins

English | [中文](README.zh.md)

Community plugins for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH).
Not affiliated with DeepSeek.

Each plugin is an independent installable bundle package. Install only what you need.

## Plugins

| Package | What it does |
|---|---|
| [`@samuelncui/dsh-tool-policy`](packages/tool-policy) | Deterministic `allow` / `deny` rules for tool calls, evaluated before any model-based review |
| [`@samuelncui/dsh-permission-default`](packages/permission-default) | Start every new session on a chosen permission preset, e.g. Auto review |

## Install

```sh
# from the npm registry
dsh plugin --profile web add @samuelncui/dsh-tool-policy

# straight from this repository (lock the commit for reproducibility)
dsh plugin --profile web add github:samuelncui/dsh-plugins#path:/packages/tool-policy

# from a local checkout, during development
dsh plugin --profile web add /absolute/path/to/dsh-plugins/packages/tool-policy
```

Adding a package installs it into the profile. It provides no behavior until its row is
composed and configured — see each package's README for the configuration snippet.

## Compatibility

Both plugins target DSH `0.2.1-rc.2` and later `0.2.x`. They declare `engines.dsh`, so an
incompatible host rejects the install before any package is downloaded.

## License

MIT
