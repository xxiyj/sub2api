# Claude Code 接入

Claude Code 使用 Anthropic Messages 协议。Token Life 的 Anthropic Base URL 填写根域名即可。

## 环境变量方式

macOS / Linux：

```bash
export ANTHROPIC_BASE_URL="https://token-life.com"
export ANTHROPIC_AUTH_TOKEN="你的 Token Life API Key"
```

Windows PowerShell：

```powershell
$env:ANTHROPIC_BASE_URL="https://token-life.com"
$env:ANTHROPIC_AUTH_TOKEN="你的 Token Life API Key"
```

然后启动 Claude Code：

```bash
claude
```

## 推荐模型

请在 Claude Code 中选择控制台已开放的 Claude 模型，例如：

```text
claude-sonnet-4-20250514
claude-3-7-sonnet-20250219
```

## 检查点

1. `ANTHROPIC_BASE_URL` 使用 `https://token-life.com`，不要额外加 `/v1`。
2. `ANTHROPIC_AUTH_TOKEN` 填 Token Life 控制台生成的 API Key。
3. 当前 Key 所在分组需要有 Claude 模型权限。

## 常见问题

如果 Claude Code 仍然提示登录官方账号，通常是本地已有官方登录状态或环境变量没有生效。请重新打开终端，确认环境变量已经写入当前会话。
