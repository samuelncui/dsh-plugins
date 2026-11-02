---
description: "Start every new DSH session on a chosen permission preset, such as Auto review, without touching restored sessions."
kind: "package-bundle"
---

# @samuelncui/dsh-permission-default

English | [中文](README.zh.md)

## Summary

Apply a permission preset to every new session at creation. A preset such as Auto
review cannot be a deployment default — it exists only while its integration is live and
is intentionally absent from the `permission` settings schema — so this package applies it
per session instead.

Only genuinely new sessions are switched. Restored logs, forked sessions, and subagent
children are left alone.

## How a session counts as new

A session is switched only when its log carries **no permission facts**:
`permission/preset`, `sandbox/mode`, `approval/policy`, and `session/end-seed`. That is the
same condition the permission service itself uses to decide that a session needs its
defaults pinned. A restored session's log already has at least one of them, so it is never
rewritten — including a Full access choice you made by hand before a restart.

The listener prepends `session/created` so it observes the log before the permission
service pins the deployment default.

## Configuration

| Field | Default | Meaning |
|---|---|---|
| `preset` | `auto` | Preset applied to a new session; must be available in the live catalog |
| `subagents` | `false` | Whether in-process subagent children are switched too |

If the preset is not live — for example `auto` while the Auto review bundle is switched
off — the plugin does nothing, and the session keeps the deployment default.

## Minimal configuration

```yaml
- id: permission-default
  config:
    preset: auto
```

Requires the Auto review bundle (`@deepseek-ai/dsh-experimental-auto-review`) to be switched
on, or any other name from the live permission catalog.

## Model experience

The model sees no plugin-specific prompt. It observes the resulting facts through DSH's
normal runtime context: the file policy and approval policy contributions of the preset you
selected.

## Known limitations

- **Writes through a live switch, not a schema default** — the setting page and future-session
  defaults still list only configured presets; Auto appears there for no session.
- **No unlock for restored sessions** — a session you switched away from the preset keeps
  your choice after a restart; that is deliberate.
- **Ordering-sensitive** — the prepend relies on running before the permission service's own
  `session/created` listener. If that guarantee changes, the plugin silently stops switching
  instead of overwriting user choices.

## License

MIT
