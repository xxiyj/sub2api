# 常见问题

## QuotaAPI 是什么？

Token Life 是面向开发者和团队的 AI API 接入平台。你可以通过一个控制台管理 API Key、余额、请求记录和多个模型系列的接入方式。

## 一个 API Key 可以用于多个模型分组吗？

可以，前提是控制台给这个 Key 或账号开放了对应分组权限。客户端仍然需要按协议使用正确的 Base URL。

## Codex 分组和 OpenAI 类型有什么关系？

如果某个分组命名为 Codex，但实际使用 OpenAI 兼容协议，客户端仍然按照 OpenAI 兼容方式接入，Base URL 使用 `https://token-life.com/v1`。

## 为什么 Claude Code 导入后无法使用？

常见原因有：

1. `ANTHROPIC_BASE_URL` 没有生效。
2. API Key 填错或复制时多了空格。
3. Key 所在分组没有 Claude 模型权限。
4. 模型名不是当前控制台开放的模型名。

## 为什么请求返回 401？

401 通常表示鉴权失败。请重新复制 API Key，并确认客户端确实使用了 Token Life 的 Key。

## 为什么请求返回 403？

403 通常表示权限不足。请检查 Key 所属分组是否允许访问当前模型。

## 为什么请求返回 404？

404 通常和 Base URL 或模型名有关。OpenAI 兼容接口使用 `https://token-life.com/v1`，Claude Code 使用 `https://token-life.com`。

## 为什么请求返回 429？

429 通常表示请求过于频繁、并发过高、额度不足或渠道限流。可以降低并发后重试，并检查余额和渠道状态。

## 如何确认扣费是否正常？

完成一次调用后，进入控制台查看使用记录和余额变化。如果记录存在，说明请求已经进入 Token Life 网关。
