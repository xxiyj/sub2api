# Claude Code Setup

Claude Code uses the Anthropic Messages protocol. For Token Life, use the root domain as the Anthropic Base URL.

## Environment Variables

macOS / Linux:

```bash
export ANTHROPIC_BASE_URL="https://token-life.com"
export ANTHROPIC_AUTH_TOKEN="your Token Life API key"
```

Windows PowerShell:

```powershell
$env:ANTHROPIC_BASE_URL="https://token-life.com"
$env:ANTHROPIC_AUTH_TOKEN="your Token Life API key"
```

Then start Claude Code:

```bash
claude
```

## Recommended Models

Choose a Claude model that is enabled in your console, for example:

```text
claude-sonnet-4-20250514
claude-3-7-sonnet-20250219
```

## Checklist

1. `ANTHROPIC_BASE_URL` should be `https://token-life.com`, without `/v1`.
2. `ANTHROPIC_AUTH_TOKEN` should be your Token Life API key.
3. The key's group must have permission for Claude models.
