# Quick Start

## 1. Create an API Key

Log in to the Token Life console, open the API Keys page, and create a new key. Use a clear name such as `claude-code-main` or `codex-dev` so you can trace usage later.

![Create API Key](../assets/api-key-create.png)

When creating a key, choose an available group. The group controls which models the key can access and which rate multiplier applies.

## 2. Choose the Client Protocol

Different clients use different protocols:

| Client | Protocol | Base URL |
| --- | --- | --- |
| Claude Code | Anthropic Messages | `https://token-life.com` |
| Codex CLI | OpenAI-compatible API | `https://token-life.com/v1` |
| CC Switch Import | Depends on the selected client | Fill according to the client |

## 3. Fill in the Model

Use a model name that is enabled in the console. Examples:

```text
claude-sonnet-4-20250514
gpt-4.1
gpt-4.1-mini
gemini-2.5-pro
```

The actual available models are shown in the Available Channels and Channel Status pages.

## 4. Verify the Setup

After configuration, run a simple request. If the client replies normally, check the Token Life console:

1. A new usage record appears.
2. Balance is deducted normally.
3. The channel status is available.

For 401, 403, 404, or 429 errors, see [FAQ](faq.md).
