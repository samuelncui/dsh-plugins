---
description: "DSH 工具调用的确定性 allow / deny 规则，在任何其它 pre-execute 策略之前求值。"
kind: "package-bundle"
---

# @samuelncui/dsh-tool-policy

[English](README.md) | 中文

## 概述

在工具流水线最前面放一张规则表。每次工具调用之前，规则匹配工具名，对 shell 调用再匹配命令文本。命中 `allow` 直接短路流水线，命中 `deny` 让调用失败，未命中的调用原样交给后续流水线。

因为监听器挂到 `tools/pre-execute` 的 prepend 位置，`allow` 决策发生在模型评审（例如 DSH 的自动审查）之前。这正是本包的目的：反复出现、已被预先授权的操作保持确定性，且不消耗评审 token。代价同样真实——规则表是它所覆盖调用的唯一闸门，之后没有任何环节再检查这些调用。

## 配置

| 字段 | 默认值 | 含义 |
|---|---|---|
| `rules` | `[]` | 有序规则表；第一条命中的规则决定该调用 |

| 规则字段 | 默认值 | 含义 |
|---|---|---|
| `action` | `deny` | `allow` 立即执行，`deny` 使其失败 |
| `tools` | `[]` | 本规则覆盖的工具名；为空表示覆盖所有工具 |
| `commands` | `[]` | 任一命令段的首个可执行名命中其中之一时生效 |
| `commandPrefixes` | `[]` | 仅匹配整条命令以其中之一开头的 shell 调用 |
| `commandPatterns` | `[]` | 仅匹配整条命令符合其中之一正则的 shell 调用 |
| `reason` | `''` | 模型可见的拒绝理由 |

没有 `tools` 的规则匹配所有工具。带命令匹配器的规则只匹配携带字符串 `command` 的调用，因此纯 shell 规则不会误命中文件工具。

`commands` 会按 `;`、`&&`、`||`、`|` 与换行切分命令，跳过前置的 `VAR=value`，把路径归约成文件名，再比较首个 token。这正是能命中 `cd X && bytedcli ...`、管道或包装器的判据——`commandPrefixes` 在这三种写法下都会漏。

## 最小配置

在自己的 profile patch 层里覆盖该行：

```yaml
- id: tool-policy
  config:
    rules:
      - action: allow
        commands: ['argos', 'bytedcli', 'lark-cli', 'codebase']
        reason: 只读查询的常设授权
      - action: deny
        commandPatterns: ['(^|&&|;)\s*rm\s+-rf\s+/']
        reason: refusing a recursive delete of an absolute root
```

## 已知限制

- **只读参数做匹配**——`tools/pre-execute` 不能改写 `exec.arguments`，规则也看不到命令随后造成的副作用。
- **切分是启发式**——引号内的 `;`、`|` 同样会被当作分隔符，本包不解析 shell 语法。
- **规则决定整次调用**——任一命令段命中就会覆盖同一行里的其它命令，不要把 `allow` 规则当成逐条命令的许可；同一行里不要混入无关的破坏性操作。
- **首个匹配生效**——规则表要从最具体排到最宽泛。
- **会短路其它策略**——`allow` 跳过之后的所有监听器，包括该调用的沙箱升权与自动审查。
- **没有反悔通道**——被拒绝的调用对模型是最终结果，无法申请覆盖。

## 许可

MIT
