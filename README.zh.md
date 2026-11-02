# dsh-plugins

[English](README.md) | 中文

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的社区插件集。
与 DeepSeek 官方无关。

每个插件都是独立可安装的组合包（bundle package），装你需要的那一个即可。

## 插件

| 包 | 作用 |
|---|---|
| [`@samuelncui/dsh-tool-policy`](packages/tool-policy) | 工具调用的确定性 `allow` / `deny` 规则，在任何模型审查之前求值 |
| [`@samuelncui/dsh-permission-default`](packages/permission-default) | 让每个新会话以指定的权限预设启动，例如自动审查 |

## 安装

```sh
# 从 npm 注册表安装
dsh plugin --profile web add @samuelncui/dsh-tool-policy

# 直接从本仓库安装（建议锁定 commit 以保证可复现）
dsh plugin --profile web add github:samuelncui/dsh-plugins#path:/packages/tool-policy

# 开发期从本地目录安装
dsh plugin --profile web add /absolute/path/to/dsh-plugins/packages/tool-policy
```

安装只是把包放进 profile。它不会自动生效，需要把它的行组合进页面并按各包 README 的片段配置。

## 兼容性

两个插件都面向 DSH `0.2.1-rc.2` 及之后的 `0.2.x`，并声明 `engines.dsh`；不兼容的宿主会在下载任何包之前拒绝安装。

## 许可

MIT
