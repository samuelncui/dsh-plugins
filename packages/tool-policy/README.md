---
description: "Deterministic allow and deny rules for DSH tool calls, evaluated ahead of every other pre-execute policy."
kind: "package-bundle"
---

# @samuelncui/dsh-tool-policy

English | [中文](README.zh.md)

## Summary

Add a rule table in front of the tool pipeline. Before every tool call, rules match
the tool name and — for shell calls — the command text. A matching `allow` short-circuits
the pipeline, a matching `deny` fails the call, and an uncovered call continues to the
rest of the pipeline unchanged.

Because the listener prepends the `tools/pre-execute` waterfall, an `allow` decision runs
before model-based review such as DSH's Auto review. That is the point of this package:
repeated, pre-authorized operations stay deterministic and cost no review tokens. The
cost is equally real — the rule table is the only gate for what it covers, and nothing
else inspects those calls.

## Configuration

| Field | Default | Meaning |
|---|---|---|
| `rules` | `[]` | Ordered rule table; the first matching rule decides the call |

| Rule field | Default | Meaning |
|---|---|---|
| `action` | `deny` | `allow` runs the call immediately, `deny` fails it |
| `tools` | `[]` | Tool names this rule covers; empty covers every tool |
| `commands` | `[]` | Applies when the head of any command segment is one of these names |
| `commandPrefixes` | `[]` | Applies to shell calls whose whole command starts with one of these |
| `commandPatterns` | `[]` | Applies to shell calls whose whole command matches one of these regular expressions |
| `reason` | `''` | Model-visible denial reason |

A rule with no `tools` entry matches every tool. A rule with command matchers only matches
calls that carry a string `command`, so a shell-only rule never matches a file tool by
accident.

`commands` splits the command on `;`, `&&`, `||`, `|`, and newlines, skips leading
`VAR=value` assignments, reduces a path to its basename, and compares the first token. That
is what catches a CLI reached through `cd X && bytedcli ...`, a pipe, or a wrapper — a
`commandPrefixes` entry would miss all three.

## Minimal configuration

Override the row from your profile patch layer:

```yaml
- id: tool-policy
  config:
    rules:
      - action: allow
        commands: ['argos', 'bytedcli', 'lark-cli', 'codebase']
        reason: standing authorization for read-only queries
      - action: deny
        commandPatterns: ['(^|&&|;)\s*rm\s+-rf\s+/']
        reason: refusing a recursive delete of an absolute root
```

## Known limitations

- **Matching reads arguments only** — `tools/pre-execute` cannot rewrite `exec.arguments`,
  and a rule cannot see a side effect the command will cause later.
- **Segmenting is a heuristic** — an operator inside quotes still splits, and the command is
  not shell-parsed.
- **A rule decides the whole call** — one matching segment authorizes every other command in
  the same line, so never treat an `allow` entry as a per-command permit. Keep pre-authorized
  CLIs away from unrelated destructive work in one command string.
- **First match wins** — order the table from most specific to most general.
- **Short circuits other policy** — an `allow` skips every later listener, including
  sandbox escalation and Auto review for that call.
- **No escalation path** — a denied call is final for the model; it cannot ask for an override.

## License

MIT
