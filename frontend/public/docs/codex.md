# Codex CLI 接入

Codex CLI 使用 OpenAI 兼容接口时，Base URL 需要填写到 `/v1`。

## 环境变量方式

macOS / Linux：

```bash
export OPENAI_BASE_URL="https://token-life.com/v1"
export OPENAI_API_KEY="你的 Token Life API Key"
```

Windows PowerShell：

```powershell
$env:OPENAI_BASE_URL="https://token-life.com/v1"
$env:OPENAI_API_KEY="你的 Token Life API Key"
```

## 配置文件方式

如果你的 Codex CLI 使用配置文件，可以按 OpenAI 兼容服务填写：

```toml
[model_providers.token_life]
name = "Token Life"
base_url = "https://token-life.com/v1"
env_key = "OPENAI_API_KEY"

[profiles.token_life]
model_provider = "token_life"
model = "gpt-4.1"
```

> 不同版本 Codex CLI 的配置字段可能略有差异。核心原则是：Provider 选择 OpenAI 兼容，Base URL 填 `https://token-life.com/v1`，API Key 填 Token Life Key。

## 验证方式

启动 Codex CLI 后发起一次简单任务，例如让它解释一段代码。随后到 Token Life 控制台的使用记录中确认请求是否出现。

## 常见错误

| 错误 | 可能原因 | 处理方式 |
| --- | --- | --- |
| 401 | API Key 无效或没有传入 | 重新复制控制台 Key |
| 403 | 分组没有模型权限 | 检查 Key 所属分组 |
| 404 | Base URL 或模型名不正确 | 确认使用 `/v1` |
| 429 | 频率或额度限制 | 降低并发或检查余额 |
