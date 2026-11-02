---
description: "让每个新建 DSH 会话以指定的权限预设启动，例如自动审查，且不改写恢复的会话。"
kind: "package-bundle"
---

# @samuelncui/dsh-permission-default

[English](README.md) | 中文

## 概述

在会话创建时把指定的权限预设应用到每个新会话。自动审查这类预设不能作为部署默认值——它只在 integration 存活期间存在，并且有意不进入 `permission` 设置 schema——所以本包改为逐会话应用。

只有真正的新会话会被切换。恢复的日志、分叉出来的会话以及 subagent 子会话一概不动。

## 什么算「新会话」

只有当会话日志里**没有任何权限事实**时才会切换：`permission/preset`、`sandbox/mode`、`approval/policy`、`session/end-seed`。这正是权限服务自己用来判断「该会话需要钉默认值」的同一个条件。恢复的会话日志里必然已有至少一条，因此永远不会被改写——包括你在重启前手动选定的 Full access。

监听器挂在 `session/created` 的 prepend 位置，从而在权限服务钉部署默认值之前观察到日志。

## 配置

| 字段 | 默认值 | 含义 |
|---|---|---|
| `preset` | `auto` | 应用到新会话的预设；必须存在于实时目录中 |
| `subagents` | `false` | 是否连进程内 subagent 子会话一起切换 |

预设不在线时（例如自动审查组合包未开启时的 `auto`），插件什么也不做，会话保持部署默认值。

## 最小配置

```yaml
- id: permission-default
  config:
    preset: auto
```

需要先开启自动审查组合包（`@deepseek-ai/dsh-experimental-auto-review`），或改用实时目录中的其他预设名。

## 模型体验

模型看不到本包特有的提示词。它通过 DSH 常规的运行时上下文观察到最终事实：所选预设的文件策略与审批策略贡献。

## 已知限制

- **走运行期切换，而不是 schema 默认值**——设置页与「未来会话默认值」仍然只列配置预设，Auto 对任何会话都不出现在那里。
- **不给恢复的会话解锁**——你手动切走的会话在重启后保持你的选择，这是有意为之。
- **对顺序敏感**——prepend 依赖先于权限服务自己的 `session/created` 监听器执行。这个保证若发生变化，插件会静默停止切换，而不是覆盖用户选择。

## 许可

MIT
