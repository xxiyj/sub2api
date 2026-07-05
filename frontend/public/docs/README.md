# Token Life 文档

Token Life 是面向生产环境的 AI API 接入平台。你可以使用一个 API Key 接入 Claude、OpenAI、Gemini、Grok 等模型，并在控制台统一查看余额、用量、渠道状态和订单。

## 快速入口

| 场景 | 推荐阅读 | Base URL |
| --- | --- | --- |
| Claude Code | [Claude Code 接入](claude-code.md) | `https://token-life.com` |
| Codex CLI | [Codex CLI 接入](codex.md) | `https://token-life.com/v1` |
| CC Switch <span class="docs-badge docs-badge-recommend">推荐</span> | [CC Switch 导入](cc-switch.md) | 按所选客户端协议填写 |

> 使用前请先在控制台创建 API Key，并确认该 Key 所在分组拥有对应模型权限。
>
> 推荐使用 [CC Switch 导入](cc-switch.md)：在 API 密钥页点击导入即可自动写入 Token Life 配置，减少手动填写 Base URL 和 API Key 的出错概率。

## 你需要准备什么？

1. Token Life 控制台账号。
2. 一个可用的 API Key。
3. 客户端中填写正确的 Base URL 和模型名称。

## 常用协议

| 协议 | Base URL | 适合客户端 |
| --- | --- | --- |
| OpenAI 兼容接口 | `https://token-life.com/v1` | Codex CLI、OpenAI SDK、支持 OpenAI 协议的工具 |
| Anthropic Messages | `https://token-life.com` | Claude Code、Anthropic SDK、支持 Claude 协议的工具 |
| Gemini v1beta | `https://token-life.com` | Gemini CLI、Google GenAI SDK |

如果客户端会自动拼接 `/v1` 或 `/v1beta`，Base URL 不要重复填写路径。

## 推荐接入顺序

1. 先阅读 [Base URL 与协议](base-url.md)，确认你的客户端使用哪种协议。
2. 按客户端阅读对应教程。
3. 完成后在控制台查看用量记录，确认请求已经进入 Token Life。
