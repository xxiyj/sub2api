# Token Life Docs

Token Life is an AI API access platform for production environments. You can use one API key to access Claude, OpenAI, Gemini, Grok, and other model families, while managing balance, usage, channel status, and orders from one console.

## Quick Links

| Scenario | Read This | Base URL |
| --- | --- | --- |
| Claude Code | [Claude Code Setup](claude-code.md) | `https://token-life.com` |
| Codex CLI | [Codex CLI Setup](codex.md) | `https://token-life.com/v1` |
| CC Switch <span class="docs-badge docs-badge-recommend">Recommended</span> | [CC Switch Import](cc-switch.md) | Depends on the selected client protocol |

> Before using a client, create an API key in the Token Life console and make sure the key's group has permission for the target model.
>
> We recommend [CC Switch Import](cc-switch.md): click import on the API Keys page to write the Token Life provider settings automatically and avoid mistakes when entering the Base URL and API key manually.

## What You Need

1. A Token Life console account.
2. A valid API key.
3. The correct Base URL and model name for your client.

## Common Protocols

| Protocol | Base URL | Suitable For |
| --- | --- | --- |
| OpenAI-compatible API | `https://token-life.com/v1` | Codex CLI, OpenAI SDK, OpenAI-compatible tools |
| Anthropic Messages | `https://token-life.com` | Claude Code, Anthropic SDK, Claude-compatible tools |
| Gemini v1beta | `https://token-life.com` | Gemini CLI, Google GenAI SDK |

If your client automatically appends `/v1` or `/v1beta`, do not repeat the path in the Base URL.
