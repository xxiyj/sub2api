# Base URL 与协议

Token Life 同时支持多种客户端协议。填写 Base URL 时，最容易出错的是路径是否重复。

## 协议对照

| 协议 | Base URL | Authorization |
| --- | --- | --- |
| OpenAI 兼容接口 | `https://token-life.com/v1` | `Bearer <API Key>` |
| Anthropic Messages | `https://token-life.com` | `x-api-key` 或客户端内置 Anthropic 鉴权 |
| Gemini v1beta | `https://token-life.com` | 按 Gemini 客户端要求填写 |

## 为什么有些要加 `/v1`？

OpenAI 兼容接口的请求路径通常是：

```text
/v1/chat/completions
/v1/responses
/v1/models
```

所以 OpenAI 类客户端通常需要 `https://token-life.com/v1`。

Anthropic Messages 的请求路径通常是：

```text
/v1/messages
```

Claude Code 会按 Anthropic 协议拼接路径，因此 Base URL 填根域名 `https://token-life.com`。

## 避免重复路径

如果客户端已经自动拼接 `/v1`，你再填写 `https://token-life.com/v1`，最终可能变成：

```text
https://token-life.com/v1/v1/messages
```

遇到 404 时，优先检查是否出现了重复路径。
